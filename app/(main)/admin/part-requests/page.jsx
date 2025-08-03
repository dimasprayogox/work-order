"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { motion } from "framer-motion";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import PartRequestTable from "./components/PartRequestTable";
import PartRequestDetailDialog from "./components/PartRequestDetailDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

// Helper functions for consistent status and priority handling
const getStatusLabel = (status) => {
    const statusMap = {
        pending: "Pending",
        approved: "Approved",
        fulfilled: "Fulfilled",
        rejected: "Rejected",
    };
    return statusMap[status] || status;
};

const getPriorityLabel = (priority) => {
    const priorityMap = {
        low: "Low",
        normal: "Normal",
        high: "High",
        urgent: "Urgent",
    };
    return priorityMap[priority] || priority;
};

// Date formatter helper - consistent with technician page
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

const AdminPartRequestPage = () => {
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    const [partRequests, setPartRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedRequests, setSelectedRequests] = useState([]);

    const [isDetailOpen, setDetailOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("PartRequests");
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
        { field: 'id', header: 'ID', visible: true },
        { field: 'requested_by', header: 'Requested By', visible: true },
        { field: 'work_order_title', header: 'Work Order Title', visible: true },   // tampilkan title
        { field: 'work_order_priority', header: 'WO Priority', visible: true },     // tampilkan priority
        { field: 'status', header: 'Status', visible: true },
        { field: 'priority', header: 'Priority', visible: false }, // sembunyikan jika tidak dipakai
        { field: 'work_order_id', header: 'Work Order ID', visible: false }, // sembunyikan id
        { field: 'items_count', header: 'Items Count', visible: true },
        { field: 'total_quantity', header: 'Total Quantity', visible: true },
        { field: 'created_at', header: 'Created Date', visible: true },
        { field: 'note', header: 'Note', visible: true }
    ]);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchPartRequests = useCallback(async () => {
        setLoading(true);
        try {
            // Menggunakan API route handler
            const res = await fetch("/api/admin/part-requests", {
                credentials: "include"
            });
            const body = await res.json();
            if (res.ok) {
                const processedData = (body.data || []).map(request => ({
                    ...request,
                    items_count: request.items?.length || 0,
                    total_quantity: request.items?.reduce((sum, item) => sum + (item.quantity_requested || 0), 0) || 0,
                    requested_by: request.requestedBy?.name || request.requestedBy?.username || 'Unknown',
                    work_order_title: request.workOrder?.title || 'N/A',         // Ambil title dari workOrder
                    work_order_priority: request.workOrder?.priority || 'N/A',   // Ambil priority dari workOrder
                }));
                setPartRequests(processedData);
            } else {
                showToast("error", "Error", body.message || "Gagal mengambil data part requests");
            }
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data part requests");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPartRequests();
    }, [fetchPartRequests]);

    // --- Export to Excel ---
    const exportExcel = async () => {
        if (!partRequests.length) {
            showToast("warn", "Warning", "Tidak ada data untuk diekspor");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Part Requests');

        // Add headers
        const headers = columnOptions
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        // Add data with consistent formatting
        partRequests.forEach(request => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field === 'created_at') {
                        return formatDate(request[col.field]);
                    } else if (col.field === 'status') {
                        return getStatusLabel(request[col.field]);
                    } else if (col.field === 'priority') {
                        return getPriorityLabel(request[col.field]);
                    } else {
                        return request[col.field] || '';
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
        saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast("success", "Success", "Data berhasil diekspor ke Excel");
    };

    // --- Export to PDF ---
    const exportPdf = (config = null) => {
        if (!partRequests.length) {
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
        const data = partRequests.map(request => {
            return visibleColumns.map(col => {
                if (col.field === 'created_at') {
                    return formatDate(request[col.field]);
                } else if (col.field === 'status') {
                    return getStatusLabel(request[col.field]);
                } else if (col.field === 'priority') {
                    return getPriorityLabel(request[col.field]);
                } else {
                    return request[col.field] || '';
                }
            });
        });

        doc.text('Part Requests Report', currentConfig.marginLeft, currentConfig.marginTop);

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
                    const headers = ['priority', 'work_order_id', 'note'];
                    if (headers[colNumber - 1]) {
                        rowData[headers[colNumber - 1]] = cell.value;
                    }
                });

                if (rowData.priority || rowData.work_order_id) {
                    data.push(rowData);
                }
            });

            for (const item of data) {
                // Menggunakan API route handler
                const res = await fetch("/api/admin/part-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(item),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || "Import gagal");
            }

            showToast("success", "Import Sukses", `${data.length} data berhasil diimpor`);
            fetchPartRequests();

        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        }

        // Reset file input
        e.target.value = '';
    };

    const handleDelete = (request) => {
        setSelectedRequest(request);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedRequests.length === 0) {
            showToast("warn", "Warning", "Tidak ada part request yang dipilih");
            return;
        }

        // Set data untuk ConfirmDeleteDialog dan buka dialog
        setSelectedRequest(null); // Clear single selection karena ini untuk multiple delete
        setDeleteOpen(true); // Buka ConfirmDeleteDialog
    };

    const handleViewDetail = (request) => {
        setSelectedRequest(request);
        setDetailOpen(true);
    };

    // Clear selection after successful operations
    const handleDeleteSuccess = () => {
        setSelectedRequests([]);
        setSelectedRequest(null);
        setDeleteOpen(false);
        fetchPartRequests();
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
                        <h3 className="text-2xl font-semibold">Part Request Management</h3>
                        <p className="text-sm text-gray-500">Manage part requests in the system.</p>
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
                        disabled={true}
                        onClick={() => {
                            setSelectedRequest(null);
                            setDetailOpen(true);
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
                        label={`Delete${selectedRequests.length > 0 ? ` (${selectedRequests.length})` : ''}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={handleDeleteSelected}
                        disabled={selectedRequests.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={fetchPartRequests}
                        disabled={loading}
                    />
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <PartRequestTable
                        partRequests={partRequests}
                        loading={loading}
                        selectedRequests={selectedRequests}
                        onSelectionChange={setSelectedRequests}
                        onViewDetail={handleViewDetail}
                        onDelete={handleDelete}
                    />
                </motion.div>

                <PartRequestDetailDialog
                    visible={isDetailOpen}
                    onHide={() => {
                        setDetailOpen(false);
                        setSelectedRequest(null);
                    }}
                    request={selectedRequest}
                    fetchPartRequests={fetchPartRequests}
                    showToast={showToast}
                />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    request={selectedRequest}
                    selectedRequests={selectedRequests}
                    onHide={() => {
                        setDeleteOpen(false);
                        setSelectedRequest(null);
                    }}
                    fetchPartRequests={fetchPartRequests}
                    showToast={showToast}
                    onDeleteSuccess={handleDeleteSuccess}
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

export default AdminPartRequestPage;
