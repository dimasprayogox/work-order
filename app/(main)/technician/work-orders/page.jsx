"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Panel } from "primereact/panel";
import { motion } from "framer-motion";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import UpdateWorkOrderDialog from "./components/UpdateWorkOrderDialog";
import WorkOrderTable from "./components/WorkOrderTable";
import WorkOrderDetailDialog from "./components/WorkOrderDetailDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

export default function TechnicianWorkOrderPage() {
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(null);
    const toast = useRef(null);
    const fileInputRef = useRef(null);
    const router = useRouter();
    const [searchText, setSearchText] = useState("");

    const [isUpdateDialogVisible, setUpdateDialogVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [isViewDialogVisible, setViewDialogVisible] = useState(false);
    const [selectedWorkOrderForView, setSelectedWorkOrderForView] = useState(null);
    const [workOrders, setWorkOrders] = useState([]);

    // 👈 Perubahan: State untuk pratinjau gambar
    const [isImageHovered, setIsImageHovered] = useState(false);
    const [hoveredImageId, setHoveredImageId] = useState(null);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState("");

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("WorkOrders");
    const [printConfig, setPrintConfig] = useState({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });

    const columnOptions = [
        { field: "title", header: "Title", visible: true },
        { field: "description", header: "Description", visible: true },
        { field: "priority", header: "Priority", visible: true },
        { field: "status", header: "Status", visible: true },
        { field: "created_at", header: "Schedule", visible: true },
        { field: "started_at", header: "Started At", visible: true },
        { field: "completed_at", header: "Completed At", visible: true },
        { field: "notes", header: "Notes", visible: true }
    ];

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchWorkOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/technician/work-orders");
            if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch data.");
            const result = await res.json();
            console.log("Work orders received:", result.data); // Debug log
            setWorkOrders(result.data || []);
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchWorkOrders();
    }, [fetchWorkOrders]);

    // --- Export to Excel ---
    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Work Orders");

        const headers = ["No", ...columnOptions.filter((col) => col.visible).map((col) => col.header)];
        worksheet.addRow(headers);

        workOrders.forEach((wo, index) => {
            const rowData = columnOptions
                .filter((col) => col.visible)
                .map((col) => {
                    if (col.field.includes("_at")) {
                        return wo[col.field];
                    } else if (col.field === "status") {
                        return wo.status;
                    } else {
                        return wo[col.field];
                    }
                });
            worksheet.addRow([index + 1, ...rowData]);
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // --- Export to PDF ---
    const exportPdf = (config = null) => {
        const currentConfig = config || printConfig;

        const doc = new jsPDF({
            orientation: currentConfig.orientation,
            unit: currentConfig.unit,
            format: currentConfig.format
        });

        const visibleColumns = columnOptions.filter((col) => col.visible);
        const headers = ["No", ...visibleColumns.map((col) => col.header)];

        const data = workOrders.map((wo, index) => {
            const rowData = visibleColumns.map((col) => {
                if (col.field.includes("_at")) {
                    return (wo[col.field]);
                } else if (col.field === "status") {
                    return (wo.status);
                } else {
                    return wo[col.field] ?? ""; 
                }
            });
            return [index + 1, ...rowData];
        });

        doc.text("Work Orders Report", currentConfig.marginLeft, currentConfig.marginTop);

        autoTable(doc, {
            startY: currentConfig.marginTop + 10,
            head: [headers],
            body: data,
            margin: {
                left: currentConfig.marginLeft,
                right: currentConfig.marginRight,
                top: currentConfig.marginTop + 10,
                bottom: currentConfig.marginBottom
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setJsPdfPreviewOpen(true);
    };

    // --- Adjust Print Margins ---
    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        exportPdf(newConfig);
    };

    // --- Import Handler ---
    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async () => {
                const buffer = reader.result;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.getWorksheet(1);
                const jsonData = [];
                const headerRow = worksheet.getRow(1);

                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber > 1) {
                        let rowObject = {};
                        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                            const headerCell = headerRow.getCell(colNumber);
                            if (headerCell && headerCell.value) {
                                rowObject[headerCell.value.toString()] = cell.value;
                            }
                        });
                        jsonData.push(rowObject);
                    }
                });

                for (const item of jsonData) {
                    const res = await fetch("/api/technician/work-orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(item)
                    });
                    if (!res.ok) {
                        const body = await res.json();
                        throw new Error(body.message || `Failed to import item: ${item.title || "Unknown"}`);
                    }
                }

                showToast("success", "Import Success", "Data imported successfully.");
                await fetchWorkOrders();
            };
        } catch (err) {
            showToast("error", "Import Failed", err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleUpdate = (workOrder) => {
        setSelectedWorkOrder(workOrder);
        setUpdateDialogVisible(true);
    };

    const handleView = (workOrder) => {
        setSelectedWorkOrderForView(workOrder);
        setViewDialogVisible(true);
    };

    const handleDialogHide = () => {
        setUpdateDialogVisible(false);
        // Reset selected work order after a short delay to avoid the error
        setTimeout(() => {
            setSelectedWorkOrder(null);
        }, 100);
    };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />

            <div className="card">
                <h3 className="mb-4">Technician Work Orders</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined onClick={() => router.push("/technician/dashboard")} />
                    <Button size="small" label="New" icon="pi pi-plus" outlined severity="success" disabled />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined onClick={() => fileInputRef.current?.click()} />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined onClick={exportExcel} />
                    <Button size="small" label="Print" icon="pi pi-print" outlined onClick={() => setAdjustDialog(true)} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Delete" icon="pi pi-trash" severity="danger" outlined disabled />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchWorkOrders} disabled={loading} />
                </div>
                <WorkOrderTable workOrders={workOrders} loading={loading} setSearchText={setSearchText} onUpdate={handleUpdate} onView={handleView} searchText={searchText} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
            </div>
            <UpdateWorkOrderDialog visible={isUpdateDialogVisible} onHide={handleDialogHide} workOrder={selectedWorkOrder} fetchWorkOrders={fetchWorkOrders} showToast={showToast} />
            <WorkOrderDetailDialog visible={isViewDialogVisible} onHide={() => { setViewDialogVisible(false); setTimeout(()=>setSelectedWorkOrderForView(null), 100); }} workOrder={selectedWorkOrderForView} />

            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleImport} accept=".xlsx,.xls" />

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

            {/* 👈 Perubahan: Tambahkan Dialog untuk pratinjau gambar */}
            <Dialog visible={imagePreviewVisible} onHide={() => setImagePreviewVisible(false)} modal header="Pratinjau Gambar" style={{ width: "50vw" }} contentStyle={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <img
                    src={previewImageUrl}
                    alt="Pratinjau Isu"
                    style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400/cccccc/000000?text=Image+Not+Found";
                    }}
                />
            </Dialog>
        </div>
    );
}
