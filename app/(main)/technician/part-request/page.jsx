"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { motion } from "framer-motion";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import ItemDetailDialog from "./components/ItemDetailDialog";
import CreatePartRequestDialog from "./components/CreatePartRequestDialog";
import PartRequestTable from "./components/PartRequestTable";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const statusMapForExport = {
    pending: "Pending",
    approved: "Approved",
    fulfilled: "Fulfilled",
    rejected: "Rejected"
};

export default function PartRequestPage() {
    const [partRequests, setPartRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);

    const [isDetailVisible, setDetailVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isFormLoading, setFormLoading] = useState(false);
    const [formInitialData, setFormInitialData] = useState({ workOrders: [], parts: [] });

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("PartRequests");
    const [printConfig, setPrintConfig] = useState({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });
    const [columnOptions, setColumnOptions] = useState([
        { header: "No", key: "no", visible: true },
        { field: "workOrder.title", header: "Title", visible: true },
        { field: "status", header: "Status", visible: true },
        { field: "note", header: "Notes", visible: true },
        { field: "created_at", header: "Requested At", visible: true }
    ]);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchPartRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/technician/part-request");
            if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch data.");
            const result = await res.json();
            setPartRequests(result.data || []);
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPartRequests();
    }, [fetchPartRequests]);

    const handleRefresh = () => {
        fetchPartRequests();
        setSearchText("");
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleDelete = (partRequest) => {
        setSelectedRequest(partRequest);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedRequests.length === 0) {
            showToast("warn", "Peringatan", "No parts selected");
            return;
        }
        setSelectedRequest(null);
        setDeleteOpen(true);
    };

    const handleDetail = (items) => {
        setSelectedItems(items || []);
        setDetailVisible(true);
    };

    // --- Export to Excel ---
    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Part Requests");

        const headers = ["No", "Title", "Notes", "Priority", "Status", "Schedule", "Items"];
        worksheet.addRow(headers);

        // Add data
        partRequests.forEach((request, index) => {
            const itemsDetails = request.items?.map((item) => `• ${item.part?.name || "Unknown Part"} (Qty: ${item.quantity_requested}${item.quantity_approved ? `, Approved: ${item.quantity_approved}` : ""})`).join("\n") || "No items";
            const rowData = [
                index + 1,
                request.workOrder?.title,
                request.Note,
                request.workOrder?.priority,
                statusMapForExport[request.status] || request.status,
                request.workOrder?.scheduled_date ? new Date(request.workOrder.scheduled_date).toLocaleString("id-ID") : "N/A",
                itemsDetails
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

    const exportPdf = (config = null) => {
        const currentConfig = config || printConfig;

        const doc = new jsPDF({
            orientation: currentConfig.orientation,
            unit: currentConfig.unit,
            format: currentConfig.format
        });

        const headers = [["No", "Title", "Notes", "Priority", "Status", "Schedule", "Items Requested"]];

        const data = partRequests.map((request, index) => {
            const itemsText = request.items?.map((item) => `${item.part?.name || "Unknown Part"} (Qty: ${item.quantity_requested}${item.quantity_approved ? `, Approved: ${item.quantity_approved}` : ""})`).join("\n") || "No items";
            return [
                index + 1,
                request.workOrder?.title || "N/A",
                request.note || "",
                request.workOrder?.priority || "N/A",
                statusMapForExport[request.status] || request.status,
                request.workOrder?.scheduled_date ? new Date(request.workOrder.scheduled_date).toLocaleString("id-ID") : "N/A", // Mengambil dari 'workOrder'
                itemsText
            ];
        });

        doc.text("Part Requests Report", currentConfig.marginLeft, currentConfig.marginTop);

        autoTable(doc, {
            startY: currentConfig.marginTop + 10,
            head: headers,
            body: data,
            margin: {
                left: currentConfig.marginLeft,
                right: currentConfig.marginRight,
                top: currentConfig.marginTop,
                bottom: currentConfig.marginBottom
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setJsPdfPreviewOpen(true);
        showToast("success", "Ekspor Berhasil", "Laporan berhasil dibuat dalam format PDF.");
    };

    // --- Adjust Print Margins ---
    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        exportPdf(newConfig);
    };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />
            <div className="card">
                <h3 className="mb-4">Part Requests Management</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined onClick={() => (window.location.href = "/main/technician/dashboard")} />
                    <Button size="small" label="New" icon="pi pi-plus" outlined severity="success" onClick={() => setFormOpen(true)} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined onClick={() => fileInputRef.current?.click()} disabled />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined onClick={exportExcel} disabled={partRequests.length === 0} />
                    <Button size="small" label="Print" icon="pi pi-print" outlined onClick={() => setAdjustDialog(true)} disabled={partRequests.length === 0} />
                    <Divider layout="vertical" />
                    <Button size="small" label={`Delete ${selectedRequests.length > 0 ? ` (${selectedRequests.length})` : ""}`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedRequests.length === 0} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchPartRequests} disabled={loading} />
                </div>

                <PartRequestTable
                    partRequests={partRequests}
                    loading={loading}
                    selectedRequests={selectedRequests}
                    setSelectedRequests={setSelectedRequests}
                    onDetail={handleDetail}
                    onDelete={handleDelete}
                    searchText={searchText}
                    onSearch={handleSearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                />
            </div>

            <ConfirmDeleteDialog
                visible={isDeleteOpen}
                onHide={() => {
                    setDeleteOpen(false);
                    setSelectedRequests([]);
                }}
                request={selectedRequest}
                selectedRequests={selectedRequests}
                fetchRequests={() => {
                    fetchPartRequests();
                    setSelectedRequests([]);
                }}
                showToast={showToast}
            />

            <ItemDetailDialog visible={isDetailVisible} onHide={() => setDetailVisible(false)} items={selectedItems} />

            <CreatePartRequestDialog visible={isFormOpen} onHide={() => setFormOpen(false)} fetchPartRequests={fetchPartRequests} showToast={showToast} initialData={formInitialData} />
            <AdjustPrintMarginLaporan
                key={adjustDialog ? "open" : "closed"}
                adjustDialog={adjustDialog}
                setAdjustDialog={setAdjustDialog}
                handleAdjust={handleAdjust}
                excel={exportExcel}
                columnOptions={columnOptions}
                printConfig={printConfig}
                setPrintConfig={setPrintConfig}
            />

            <Dialog visible={jsPdfPreviewOpen} onHide={() => setJsPdfPreviewOpen(false)} modal style={{ width: "90vw", height: "90vh" }} header="PDF Preview">
                <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
            </Dialog>
        </div>
    );
}
