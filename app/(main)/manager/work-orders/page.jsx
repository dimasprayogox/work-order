"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Message } from "primereact/message";
import dynamic from "next/dynamic";

import WorkOrderTable from "./components/WorkOrderTable";
import DelegateTechnicianDialog from "./components/DelegateTechnicianDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import AssignmentDialog from "./components/AssignmentDialog";

import BulkAssignmentDialog from "./components/BulkAssignmentDialog";

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
    const [technicians, setTechnicians] = useState([]);
    const [stats, setStats] = useState(null);

    const [assignDialogVisible, setAssignDialogVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [viewDetailsDialogVisible, setViewDetailsDialogVisible] = useState(false);
    const [setEditDialogVisible] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
    const [isBulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);

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
    const [confirmReassignDialog, setConfirmReassignDialog] = useState({
        visible: false,
        assignedCount: 0,
        unassignedCount: 0
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

    const fetchTechnicians = useCallback(async () => {
        try {
            const res = await fetch("/api/manager/work-orders/technicians", {
                credentials: "include"
            });
            const body = await res.json();

            if (res.ok) {
                setTechnicians(body.data || []);
            }
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data teknisi");
        }
    }, [showToast]);

    // Fetch assignment statistics
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/manager/work-orders/stats", {
                credentials: "include"
            });
            const body = await res.json();

            if (res.ok) {
                setStats(body.data);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    }, []);

    useEffect(() => {
        fetchWorkOrders();
        fetchTechnicians();
        fetchStats();
    }, [fetchWorkOrders, fetchTechnicians, fetchStats]);

    // Handle single assignment
    const handleAssign = (workOrder) => {
        setSelectedWorkOrder(workOrder);
        setAssignDialogOpen(true);
    };

    // Handle reassignment
    const handleReassign = (workOrder) => {
        setSelectedWorkOrder(workOrder);
        setAssignDialogOpen(true);
    };

    // Handle unassign
    const handleUnassign = async (workOrder, reason = "") => {
        try {
            const res = await fetch(`/api/manager/work-orders/${workOrder.id}/unassign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ reason })
            });

            const body = await res.json();
            if (!res.ok) throw new Error(body.message);

            showToast("success", "Berhasil", body.message);
            fetchWorkOrders();
            fetchStats();
        } catch (err) {
            showToast("error", "Error", err.message);
        }
    };

    // Handle bulk assignment
    const handleBulkAssign = () => {
        if (selectedWorkOrders.length === 0) {
            showToast("warn", "Warning", "Pilih work order terlebih dahulu");
            return;
        }

        // Hitung jumlah yang sudah dan belum di-assign
        const assignedCount = selectedWorkOrders.filter((wo) => wo.assigned_to_id).length;
        const unassignedCount = selectedWorkOrders.length - assignedCount;

        if (assignedCount > 0) {
            // Tampilkan dialog konfirmasi jika ada yang sudah di-assign
            setConfirmReassignDialog({
                visible: true,
                assignedCount,
                unassignedCount
            });
        } else {
            // Langsung buka bulk assignment jika semua belum di-assign
            setBulkAssignDialogOpen(true);
        }
    };

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

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

            <div className="card">
                <h3 className="mb-4">Work Orders</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button size="small" label="New" icon="pi pi-plus" outlined severity="success" disabled />
                    <Divider layout="vertical" />
                    <Button size="small" label="Assign Selected" icon="pi pi-users" outlined onClick={handleBulkAssign} disabled={selectedWorkOrders.length === 0} />
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
                    loading={loading}
                    setSearchText={setSearchText}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    handleAssignTechnician={(rowData) => {
                        setSelectedWorkOrder(rowData);
                        setAssignDialogVisible(true);
                    }}
                    onDelete={handleDelete}
                    onAssign={handleAssign}
                    onReassign={handleReassign}
                    onUnassign={handleUnassign}
                />
            </div>

            {/* Dialogs */}
            <DelegateTechnicianDialog visible={assignDialogVisible} onHide={() => setAssignDialogVisible(false)} workOrder={selectedWorkOrder} showToast={showToast} fetchWorkOrders={fetchWorkOrders} />

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

            {/* Print configuration dialog */}
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} printConfig={printConfig} setPrintConfig={setPrintConfig} excel={exportExcel} />

            <AssignmentDialog
                visible={isAssignDialogOpen}
                onHide={() => {
                    setAssignDialogOpen(false);
                    setSelectedWorkOrder(null);
                }}
                workOrder={selectedWorkOrder}
                technicians={technicians}
                onSuccess={() => {
                    fetchWorkOrders();
                    fetchStats();
                }}
                showToast={showToast}
            />

            {/* Bulk Assignment Dialog */}
            <BulkAssignmentDialog
                visible={isBulkAssignDialogOpen}
                onHide={() => {
                    setBulkAssignDialogOpen(false);
                    setSelectedWorkOrders([]);
                }}
                workOrders={selectedWorkOrders}
                technicians={technicians}
                onSuccess={() => {
                    fetchWorkOrders();
                    fetchStats();
                    setSelectedWorkOrders([]);
                    showToast("success", "Success", "Work orders berhasil di-assign ulang");
                }}
                showToast={showToast}
            />
            {/* PDF preview dialog */}
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setJsPdfPreviewOpen(false)} modal style={{ width: "90vw", height: "90vh" }} header="Pratinjau PDF">
                <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
            </Dialog>

            {/* Confirm Reassign Dialog */}
            <Dialog
                visible={confirmReassignDialog.visible}
                onHide={() => setConfirmReassignDialog({ ...confirmReassignDialog, visible: false })}
                header="Warning!"
                style={{ width: "500px" }}
                modal
                footer={
                    <div>
                        <Button
                            label="Continue"
                            icon="pi pi-check"
                            onClick={() => {
                                setConfirmReassignDialog({ ...confirmReassignDialog, visible: false });
                                setBulkAssignDialogOpen(true);
                            }}
                            autoFocus
                        />
                    </div>
                }
            >
                <div className="p-fluid">
                    <Message severity="info" text={`${confirmReassignDialog.assignedCount} out of ${selectedWorkOrders.length} selected work orders have already been assigned`} className="mb-4" />
                </div>
            </Dialog>
        </div>
    );
}
