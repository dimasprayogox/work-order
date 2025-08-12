"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import WorkOrderTable from "./components/WorkOrderTable";
import DelegateTechnicianDialog from "./components/DelegateTechnicianDialog";
import WorkOrderDetailsDialog from "./components/WorkOrderDetailsDialog";
import WorkOrderFormDialog from "./components/WorkOrderFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const statusMapForExport = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed"
};

export default function WorkOrderPage() {
    const toast = useRef(null);
    const [workOrders, setWorkOrders] = useState([]);
    const [selectedWorkOrders, setSelectedWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);

    const [assignDialogVisible, setAssignDialogVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [viewDetailsDialogVisible, setViewDetailsDialogVisible] = useState(false);
    const [isFormOpen, setFormOpen] = useState(false);
    const [setEditDialogVisible] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);

    const fileInputRef = useRef(null);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName] = useState("WorkOrders");
    const [printConfig, setPrintConfig] = useState({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchWorkOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/manager/work-orders`, {
                credentials: "include"
            });
            if (!response.ok) throw new Error((await response.json()).message || "Gagal mengambil daftar Work Order.");
            const result = await response.json();
            setWorkOrders(result.data || []);
        } catch (err) {
            showToast("error", "Error", err.message);
            setWorkOrders([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchWorkOrders();
    }, [fetchWorkOrders]);

    const handleEditWorkOrder = (rowData) => {
        setSelectedWorkOrder(rowData);
        setEditDialogVisible(true);
    };

    const handleViewDetails = (rowData) => {
        setSelectedWorkOrder(rowData);
        setViewDetailsDialogVisible(true);
    };

    const handleDelete = (workOrder) => {
        setSelectedWorkOrder(workOrder);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedWorkOrders.length === 0) {
            showToast("warn", "Peringatan", "Tidak ada work order yang dipilih");
            return;
        }
        setSelectedWorkOrder(null);
        setDeleteOpen(true);
    };

    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Work Orders");
        const headers = ["No", "Title", "Machine", "Priority", "Status", "Assigned To", "Schedule", "Created", "Started", "Completed", "Description"];
        worksheet.addRow(headers);

        workOrders.forEach((wo, index) => {
            const rowData = [
                index + 1,
                wo.title,
                wo.machine?.name || "N/A",
                wo.priority,
                statusMapForExport[wo.status] || wo.status,
                wo.assignedTo?.full_name || "Not Assigned",
                wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleString("id-ID") : "N/A",
                wo.created_at ? new Date(wo.created_at).toLocaleString("id-ID") : "N/A",
                wo.started_at ? new Date(wo.started_at).toLocaleString("id-ID") : "N/A",
                wo.completed_at ? new Date(wo.completed_at).toLocaleString("id-ID") : "N/A",
                wo.notes || ""
            ];
            worksheet.addRow(rowData);
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast("success", "Export Success", "Data berhasil diekspor ke Excel.");
    };

    const exportPdf = () => {
        const doc = new jsPDF({
            orientation: printConfig.orientation,
            unit: printConfig.unit,
            format: printConfig.format
        });

        const headers = ["No", "Title", "Machine", "Status", "Assigned To", "Schedule", "Priority"];

        const data = workOrders.map((wo, index) => [
            index + 1,
            wo.title,
            wo.machine?.name || "N/A",
            statusMapForExport[wo.status] || wo.status,
            wo.assignedTo?.full_name || "Not Assigned",
            wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString("id-ID") : "N/A",
            wo.priority
        ]);

        doc.text("Work Orders Report", printConfig.marginLeft, printConfig.marginTop);
        autoTable(doc, {
            startY: printConfig.marginTop + 10,
            head: [headers],
            body: data,
            margin: {
                left: printConfig.marginLeft,
                right: printConfig.marginRight,
                top: printConfig.marginTop + 10,
                bottom: printConfig.marginBottom
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setJsPdfPreviewOpen(true);
        showToast("success", "Ekspor Berhasil", "Laporan berhasil dibuat dalam format PDF.");
    };

    const handlePrint = () => {
        setAdjustDialog(true);
    };

    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        setAdjustDialog(false);
        exportPdf();
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const buffer = await file.arrayBuffer();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.getWorksheet(1);
            const data = [];

            const parseCustomDate = (dateString) => {
                if (!dateString) return null;

                // Coba parse format Excel serial number
                if (typeof dateString === "number") {
                    return new Date(Math.round((dateString - 25569) * 86400 * 1000));
                }

                // Format: "13/08/2025, 10.02.15" atau "1/8/2025, 1.02.15"
                const match = dateString.toString().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2})\.(\d{2})\.(\d{2})$/);
                if (match) {
                    const [_, day, month, year, hours, minutes, seconds] = match;
                    return new Date(year, month - 1, day, hours, minutes, seconds);
                }

                // Fallback ke parsing default
                const date = new Date(dateString);
                return isNaN(date.getTime()) ? null : date;
            };

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row

                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    const headers = ["title", "machine_id", "priority", "scheduled_date", "description"];
                    if (headers[colNumber - 1]) {
                        if (headers[colNumber - 1] === "scheduled_date") {
                            const dateValue = parseCustomDate(cell.value);
                            rowData[headers[colNumber - 1]] = dateValue ? dateValue.toISOString() : null;
                        } else {
                            rowData[headers[colNumber - 1]] = cell.value;
                        }
                    }
                });

                if (rowData.title) {
                    if (!rowData.priority) rowData.priority = "medium";
                    data.push(rowData);
                }
            });

            // Proses import ke API
            const importResults = await Promise.allSettled(
                data.map((item) =>
                    fetch(`/api/manager/work-orders`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(item)
                    })
                )
            );

            // Cek hasil import
            const failedImports = importResults.filter((r) => r.status === "rejected" || !r.value.ok);
            if (failedImports.length > 0) {
                const errorMessages = failedImports.map((r, i) => `Baris ${i + 2}: ${r.reason?.message || r.value?.statusText || "Error tidak diketahui"}`);
                throw new Error(`Beberapa data gagal diimpor:\n${errorMessages.join("\n")}`);
            }

            showToast("success", "Import Sukses", `${data.length} work order berhasil diimpor`);
            fetchWorkOrders();
        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        } finally {
            setLoading(false);
            e.target.value = "";
        }
    };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
            <ConfirmDialog />
            <div className="card">
                <h3 className="mb-4">Work Orders</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button
                        size="small"
                        label="New"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => {
                            setSelectedWorkOrder(null);
                            setFormOpen(true);
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined onClick={() => fileInputRef.current?.click()} />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined onClick={exportExcel} />
                    <Button size="small" label="Print" icon="pi pi-print" outlined onClick={handlePrint} />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label={`Delete${selectedWorkOrders.length > 0 ? ` (${selectedWorkOrders.length})` : ""}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={handleDeleteSelected}
                        disabled={selectedWorkOrders.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchWorkOrders} disabled={loading} />
                </div>

                {/* Work Order Table */}
                <WorkOrderTable
                    workOrders={workOrders}
                    selectedWorkOrders={selectedWorkOrders}
                    setSelectedWorkOrders={setSelectedWorkOrders}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    handleViewDetails={handleViewDetails}
                    handleAssignTechnician={(rowData) => {
                        setSelectedWorkOrder(rowData);
                        setAssignDialogVisible(true);
                    }}
                    handleEditWorkOrder={handleEditWorkOrder}
                    onEdit={(p) => {
                        setSelectedWorkOrder(p);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                />
            </div>

            {/* Dialogs */}
            <DelegateTechnicianDialog visible={assignDialogVisible} onHide={() => setAssignDialogVisible(false)} workOrder={selectedWorkOrder} showToast={showToast} fetchWorkOrders={fetchWorkOrders} />

            <WorkOrderDetailsDialog visible={viewDetailsDialogVisible} onHide={() => setViewDetailsDialogVisible(false)} workOrder={selectedWorkOrder} />

            <WorkOrderFormDialog visible={isFormOpen} onHide={() => setFormOpen(false)} workOrder={selectedWorkOrder} fetchWorkOrders={fetchWorkOrders} showToast={showToast} />

            <ConfirmDeleteDialog
                visible={isDeleteOpen}
                onHide={() => {
                    setDeleteOpen(false);
                    setSelectedWorkOrders([]);
                }}
                workOrder={selectedWorkOrder}
                selectedWorkOrders={selectedWorkOrders}
                fetchWorkOrders={() => {
                    fetchWorkOrders();
                    setSelectedWorkOrders([]);
                }}
                showToast={showToast}
            />

            {/* Hidden file input for import */}
            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleImport} accept=".xlsx,.xls" />

            {/* Print configuration dialog */}
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} printConfig={printConfig} setPrintConfig={setPrintConfig} excel={exportExcel} />

            {/* PDF preview dialog */}
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setJsPdfPreviewOpen(false)} modal style={{ width: "90vw", height: "90vh" }} header="Pratinjau PDF">
                <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
            </Dialog>
        </div>
    );
}
