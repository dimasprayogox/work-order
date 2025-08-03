// app/(main)/issues/page.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import IssueTable from "./components/IssueTable";
import IssueFormDialog from "./components/IssueFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import IssueDetailDialog from "./components/IssueDetailDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const IssuePage = () => {
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    const [issues, setIssues] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [selectedIssues, setSelectedIssues] = useState([]);

    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isDetailOpen, setDetailOpen] = useState(false);

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("Issues");
    const [printConfig, setPrintConfig] = useState({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });

    const [columnOptions] = useState([
        { field: 'title', header: 'Title', visible: true },
        { field: 'machine.name', header: 'Machine', visible: true },
        { field: 'description', header: 'Description', visible: true },
        { field: 'status', header: 'Status', visible: true },
        { field: 'created_at', header: 'Created Date', visible: true },
        { field: 'updated_at', header: 'Updated Date', visible: true }
    ]);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchIssues = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/issues", {
                credentials: "include"
            });
            const body = await res.json();
            setIssues(body.data || []);
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data issue");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchMachines = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/machines", {
                credentials: "include"
            });
            const body = await res.json();
            setMachines(body.data || []);
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data mesin");
        }
    }, [showToast]);

    useEffect(() => {
        fetchIssues();
        fetchMachines();
    }, [fetchIssues, fetchMachines]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // --- Export to Excel ---
    const exportExcel = async () => {
        if (!issues.length) {
            showToast("warn", "Warning", "Tidak ada data untuk diekspor");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Issues');

        // Add headers
        const headers = columnOptions
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        // Add data
        issues.forEach(issue => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field === 'created_at' || col.field === 'updated_at') {
                        return formatDate(issue[col.field]);
                    } else if (col.field === 'machine.name') {
                        return issue.machine?.name || '-';
                    } else if (col.field === 'description') {
                        return issue.description?.substring(0, 100) + (issue.description?.length > 100 ? '...' : '') || '';
                    } else {
                        return issue[col.field] || '';
                    }
                });

            worksheet.addRow(rowData);
        });

        // Style headers
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = 20;
        });

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
        showToast("success", "Success", "Data berhasil diekspor ke Excel");
    };

    // --- Export to PDF ---
    const exportPdf = (config = null) => {
        if (!issues.length) {
            showToast("warn", "Warning", "Tidak ada data untuk cetak");
            return;
        }

        const currentConfig = config || printConfig;

        const doc = new jsPDF({
            orientation: currentConfig.orientation,
            unit: currentConfig.unit,
            format: currentConfig.format
        });

        const visibleColumns = columnOptions.filter(col => col.visible);

        const headers = visibleColumns.map(col => col.header);
        const data = issues.map(issue => {
            return visibleColumns.map(col => {
                if (col.field === 'created_at' || col.field === 'updated_at') {
                    return formatDate(issue[col.field]);
                } else if (col.field === 'machine.name') {
                    return issue.machine?.name || '-';
                } else if (col.field === 'description') {
                    return issue.description?.substring(0, 50) + (issue.description?.length > 50 ? '...' : '') || '';
                } else {
                    return issue[col.field] || '';
                }
            });
        });

        doc.text('Issues Report', currentConfig.marginLeft, currentConfig.marginTop);

        autoTable(doc, {
            startY: currentConfig.marginTop + 10,
            head: [headers],
            body: data,
            margin: {
                left: currentConfig.marginLeft,
                right: currentConfig.marginRight,
                top: currentConfig.marginTop + 10,
                bottom: currentConfig.marginBottom
            },
            styles: { fontSize: 8 },
            headStyles: { fillColor: [71, 85, 105] }
        });

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setJsPdfPreviewOpen(true);
    };

    // --- Adjust Print Margins ---
    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        exportPdf(newConfig);
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const workbook = new ExcelJS.Workbook();
            const buffer = await file.arrayBuffer();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.getWorksheet(1);
            const data = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row

                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    const headers = ['title', 'machine_id', 'description'];
                    if (headers[colNumber - 1]) {
                        rowData[headers[colNumber - 1]] = cell.value;
                    }
                });

                if (rowData.title && rowData.machine_id && rowData.description) {
                    data.push(rowData);
                }
            });

            for (const item of data) {
                const res = await fetch("/api/admin/issues", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(item),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || "Import gagal");
            }

            showToast("success", "Import Sukses", `${data.length} data berhasil diimpor`);
            fetchIssues();

        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        }

        // Reset file input
        e.target.value = '';
    };

    const handleDelete = (issue) => {
        setSelectedIssue(issue);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedIssues.length === 0) {
            showToast("warn", "Warning", "Tidak ada issue yang dipilih");
            return;
        }

        setSelectedIssue(null);
        setDeleteOpen(true);
    };

    const handleDetail = (issue) => {
        setSelectedIssue(issue);
        setDetailOpen(true);
    };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

            <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={handleImport}
                style={{ display: "none" }}
            />

            <div className="card">
                <div className="flex justify-content-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-semibold">Issue Management</h3>
                        <p className="text-sm text-gray-500">Manage data issues in the system.</p>
                    </div>
                </div>

                <div className="flex flex-row flex-wrap items-center gap-2 mb-4">
                    <Button
                        size="small"
                        label="Back"
                        icon="pi pi-arrow-left"
                        outlined
                        disabled
                    />
                    <Button
                        size="small"
                        label="New"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => {
                            setSelectedIssue(null);
                            setFormOpen(true);
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Import"
                        icon="pi pi-file-import"
                        outlined
                        onClick={() => fileInputRef.current?.click()}
                    />
                    <Button
                        size="small"
                        label="Export"
                        icon="pi pi-file-export"
                        outlined
                        onClick={exportExcel}
                    />
                    <Button
                        size="small"
                        label="Print"
                        icon="pi pi-print"
                        outlined
                        onClick={() => setAdjustDialog(true)}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label={`Delete${selectedIssues.length > 0 ? ` (${selectedIssues.length})` : ''}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={handleDeleteSelected}
                        disabled={selectedIssues.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={fetchIssues}
                        disabled={loading}
                    />
                </div>

                <IssueTable
                    issues={issues}
                    loading={loading}
                    selectedIssues={selectedIssues}
                    onSelectionChange={setSelectedIssues}
                    onEdit={(issue) => {
                        setSelectedIssue(issue);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                />

                <IssueFormDialog
                    visible={isFormOpen}
                    onHide={() => {
                        setFormOpen(false);
                        setSelectedIssue(null);
                    }}
                    issue={selectedIssue}
                    machines={machines}
                    fetchIssues={fetchIssues}
                    showToast={showToast}
                />

                <IssueDetailDialog
                    visible={isDetailOpen}
                    onHide={() => {
                        setDetailOpen(false);
                        setSelectedIssue(null);
                    }}
                    issue={selectedIssue}
                />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    issue={selectedIssue}
                    selectedIssues={selectedIssues}
                    onHide={() => {
                        setDeleteOpen(false);
                        setSelectedIssue(null);
                    }}
                    fetchIssues={fetchIssues}
                    showToast={showToast}
                />

                <AdjustPrintMarginLaporan
                    key={adjustDialog ? 'open' : 'closed'}
                    adjustDialog={adjustDialog}
                    setAdjustDialog={setAdjustDialog}
                    handleAdjust={handleAdjust}
                    excel={exportExcel}
                    columnOptions={columnOptions}
                    printConfig={printConfig}
                    setPrintConfig={setPrintConfig}
                />

                <Dialog
                    visible={jsPdfPreviewOpen}
                    onHide={() => setJsPdfPreviewOpen(false)}
                    modal
                    style={{ width: '90vw', height: '90vh' }}
                    header="PDF Preview"
                >
                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                </Dialog>
            </div>
        </div>
    );
};

export default IssuePage;
