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

import MachineCategoryTable from "./components/MachineCategoryTable";
import MachineCategoryFormDialog from "./components/MachineCategoryFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const MachineCategoryPage = () => {
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("MachineCategories");
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
        { field: 'name', header: 'Name', visible: true },
        { field: 'description', header: 'Description', visible: true },
        { field: 'created_at', header: 'Created Date', visible: true },
        { field: 'updated_at', header: 'Updated Date', visible: true }
    ]);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/machine-categories", {
                credentials: "include"
            });
            const body = await res.json();
            setCategories(body.data || []);
        } catch (err) {
            showToast("error", "Error", "Failed to fetch machine categories");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

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
        if (!categories.length) {
            showToast("warn", "Warning", "No data to export");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Machine Categories');

        // Add headers
        const headers = columnOptions
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        // Add data
        categories.forEach(category => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field === 'created_at' || col.field === 'updated_at') {
                        return formatDate(category[col.field]);
                    } else {
                        return category[col.field] || '';
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
        showToast("success", "Success", "Data exported to Excel");
    };

    // --- Export to PDF ---
    const exportPdf = (config = null) => {
        if (!categories.length) {
            showToast("warn", "Warning", "No data to print");
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
        const data = categories.map(category => {
            return visibleColumns.map(col => {
                if (col.field === 'created_at' || col.field === 'updated_at') {
                    return formatDate(category[col.field]);
                } else {
                    return category[col.field] || '';
                }
            });
        });

        doc.text('Machine Categories Report', currentConfig.marginLeft, currentConfig.marginTop);

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
                    const headers = ['name', 'description'];
                    if (headers[colNumber - 1]) {
                        rowData[headers[colNumber - 1]] = cell.value;
                    }
                });

                if (rowData.name) {
                    data.push(rowData);
                }
            });

            for (const item of data) {
                const res = await fetch("/api/admin/machine-categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(item),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || "Import failed");
            }

            showToast("success", "Import Success", `${data.length} records imported`);
            fetchCategories();

        } catch (err) {
            showToast("error", "Import Failed", err.message);
        }

        // Reset file input
        e.target.value = '';
    };

    const handleDelete = (category) => {
        setSelectedCategory(category);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedCategories.length === 0) {
            showToast("warn", "Warning", "No categories selected");
            return;
        }
        setSelectedCategory(null);
        setDeleteOpen(true);
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
                        <h3 className="text-2xl font-semibold">Machine Category Management</h3>
                        <p className="text-sm text-gray-500">Manage machine categories in the system.</p>
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
                            setSelectedCategory(null);
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
                        label={`Delete${selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ''}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={handleDeleteSelected}
                        disabled={selectedCategories.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={fetchCategories}
                        disabled={loading}
                    />
                </div>

                <MachineCategoryTable
                    categories={categories}
                    loading={loading}
                    selectedCategories={selectedCategories}
                    onSelectionChange={setSelectedCategories}
                    onEdit={(category) => {
                        setSelectedCategory(category);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                />

                <MachineCategoryFormDialog
                    visible={isFormOpen}
                    onHide={() => {
                        setFormOpen(false);
                        setSelectedCategory(null);
                    }}
                    category={selectedCategory}
                    fetchCategories={fetchCategories}
                    showToast={showToast}
                />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    category={selectedCategory}
                    selectedCategories={selectedCategories}
                    onHide={() => {
                        setDeleteOpen(false);
                        setSelectedCategory(null);
                    }}
                    fetchCategories={fetchCategories}
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

export default MachineCategoryPage;
