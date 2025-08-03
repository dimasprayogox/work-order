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

import ScheduleTable from "./components/ScheduleTable";
import ScheduleFormDialog from "./components/ScheduleFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import ScheduleDetailDialog from "./components/ScheduleDetailDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const SchedulePage = () => {
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    const [schedules, setSchedules] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [selectedSchedules, setSelectedSchedules] = useState([]);

    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isDetailOpen, setDetailOpen] = useState(false);
    const [isGeneratingWO, setGeneratingWO] = useState(false);

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("Schedules");
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
        { field: 'frequency', header: 'Frequency', visible: true },
        { field: 'priority', header: 'Priority', visible: true },
        { field: 'next_due_date', header: 'Next Due Date', visible: true },
        { field: 'created_at', header: 'Created Date', visible: true }
    ]);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/schedules", {
                credentials: "include"
            });
            const body = await res.json();
            setSchedules(body.data || []);
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data schedule");
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
        fetchSchedules();
        fetchMachines();
    }, [fetchSchedules, fetchMachines]);

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

    const formatFrequency = (frequency) => {
        const frequencies = {
            'daily': 'Daily',
            'weekly': 'Weekly',
            'monthly': 'Monthly',
            'yearly': 'Yearly'
        };
        return frequencies[frequency] || frequency;
    };

    const formatPriority = (priority) => {
        const priorities = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High'
        };
        return priorities[priority] || priority;
    };

    // --- Generate Work Orders ---
    const handleGenerateWorkOrders = async () => {
        setGeneratingWO(true);
        try {
            const res = await fetch("/api/admin/schedules/generate", {
                method: "POST",
                credentials: "include"
            });
            const body = await res.json();

            if (!res.ok) throw new Error(body.message);

            const createdCount = body.data?.length || 0;
            showToast("success", "Success", `${createdCount} Work Order berhasil dibuat dari jadwal yang jatuh tempo`);
            fetchSchedules(); // Refresh schedules to update next due dates
        } catch (err) {
            showToast("error", "Error", err.message || "Gagal membuat Work Order");
        } finally {
            setGeneratingWO(false);
        }
    };

    // --- Export to Excel ---
    const exportExcel = async () => {
        if (!schedules.length) {
            showToast("warn", "Warning", "Tidak ada data untuk diekspor");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Schedules');

        // Add headers
        const headers = columnOptions
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        // Add data
        schedules.forEach(schedule => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field === 'created_at' || col.field === 'next_due_date') {
                        return formatDate(schedule[col.field]);
                    } else if (col.field === 'machine.name') {
                        return schedule.machine?.name || '-';
                    } else if (col.field === 'frequency') {
                        return formatFrequency(schedule.frequency);
                    } else if (col.field === 'priority') {
                        return formatPriority(schedule.priority);
                    } else {
                        return schedule[col.field] || '';
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
        if (!schedules.length) {
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
        const data = schedules.map(schedule => {
            return visibleColumns.map(col => {
                if (col.field === 'created_at' || col.field === 'next_due_date') {
                    return formatDate(schedule[col.field]);
                } else if (col.field === 'machine.name') {
                    return schedule.machine?.name || '-';
                } else if (col.field === 'frequency') {
                    return formatFrequency(schedule.frequency);
                } else if (col.field === 'priority') {
                    return formatPriority(schedule.priority);
                } else {
                    return schedule[col.field] || '';
                }
            });
        });

        doc.text('Maintenance Schedules Report', currentConfig.marginLeft, currentConfig.marginTop);

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
                    const headers = ['title', 'machine_id', 'frequency', 'next_due_date', 'priority'];
                    if (headers[colNumber - 1]) {
                        rowData[headers[colNumber - 1]] = cell.value;
                    }
                });

                if (rowData.title && rowData.machine_id && rowData.frequency && rowData.next_due_date) {
                    data.push(rowData);
                }
            });

            for (const item of data) {
                const res = await fetch("/api/admin/schedules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(item),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || "Import gagal");
            }

            showToast("success", "Import Sukses", `${data.length} data berhasil diimpor`);
            fetchSchedules();

        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        }

        // Reset file input
        e.target.value = '';
    };

    const handleDelete = (schedule) => {
        setSelectedSchedule(schedule);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedSchedules.length === 0) {
            showToast("warn", "Warning", "Tidak ada schedule yang dipilih");
            return;
        }

        setSelectedSchedule(null);
        setDeleteOpen(true);
    };

    const handleDetail = (schedule) => {
        setSelectedSchedule(schedule);
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
                        <h3 className="text-2xl font-semibold">Maintenance Schedule Management</h3>
                        <p className="text-sm text-gray-500">Manage routine maintenance schedules for machines.</p>
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
                            setSelectedSchedule(null);
                            setFormOpen(true);
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Generate WO"
                        icon="pi pi-cog"
                        outlined
                        severity="info"
                        onClick={handleGenerateWorkOrders}
                        loading={isGeneratingWO}
                        disabled={isGeneratingWO}
                        tooltip="Generate Work Orders for due schedules"
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
                        label={`Delete${selectedSchedules.length > 0 ? ` (${selectedSchedules.length})` : ''}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={handleDeleteSelected}
                        disabled={selectedSchedules.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={fetchSchedules}
                        disabled={loading}
                    />
                </div>

                <ScheduleTable
                    schedules={schedules}
                    loading={loading}
                    selectedSchedules={selectedSchedules}
                    onSelectionChange={setSelectedSchedules}
                    onEdit={(schedule) => {
                        setSelectedSchedule(schedule);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                />

                <ScheduleFormDialog
                    visible={isFormOpen}
                    onHide={() => {
                        setFormOpen(false);
                        setSelectedSchedule(null);
                    }}
                    schedule={selectedSchedule}
                    machines={machines}
                    fetchSchedules={fetchSchedules}
                    showToast={showToast}
                />

                <ScheduleDetailDialog
                    visible={isDetailOpen}
                    onHide={() => {
                        setDetailOpen(false);
                        setSelectedSchedule(null);
                    }}
                    schedule={selectedSchedule}
                />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    schedule={selectedSchedule}
                    selectedSchedules={selectedSchedules}
                    onHide={() => {
                        setDeleteOpen(false);
                        setSelectedSchedule(null);
                    }}
                    fetchSchedules={fetchSchedules}
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

export default SchedulePage;
