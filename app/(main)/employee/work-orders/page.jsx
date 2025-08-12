"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import WorkRequestTable from "./components/WorkRequestTable";
import WorkRequestFormDialog from "./components/WorkRequestFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

// Dynamic imports
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const statusMapForExport = {
    open: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed"
};

const columnOptionsForExport = [
    { field: "title", header: "Judul Isu", visible: true },
    { field: "description", header: "Deskripsi", visible: true },
    { field: "machine.name", header: "Mesin", visible: true },
    { field: "status", header: "Status", visible: true },
    { field: "created_at", header: "Dikirim", visible: true }
];

const WorkOrderPage = () => {
    const router = useRouter();
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    // State management
    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [selectedWorkOrders, setSelectedWorkOrders] = useState([]);
    const [workOrders, setWorkOrders] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState("");

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("WorkOrderReport");
    const [printConfig, setPrintConfig] = useState({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });

    const showToast = useCallback((sev, sum, det) => {
        toast.current?.show({ severity: sev, summary: sum, detail: det });
    }, []);

    const fetchWorkOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/employee/issues`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to fetch work orders");
            setWorkOrders(result.data || []);
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchMachines = useCallback(async () => {
        try {
            const response = await fetch(`/api/employee/machines/available`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to fetch machines");
            setMachines(result.data || []);
        } catch (error) {
            showToast("error", "Error", error.message);
        }
    }, [showToast]);

    useEffect(() => {
        fetchWorkOrders();
        fetchMachines();
    }, [fetchWorkOrders, fetchMachines]);

    const handleRefresh = () => {
        fetchWorkOrders();
        fetchMachines();
        setSearchText("");
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleDelete = (workOrder) => {
        setSelectedWorkOrders(workOrder);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedWorkOrders.length === 0) {
            showToast("warn", "Peringatan", "Tidak ada work order yang dipilih");
            return;
        }
        setDeleteOpen(true);
    };

    const exportExcel = async () => {
        if (!workOrders.length) {
            showToast("warn", "No Data", "There are no work orders to export");
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Work Orders");

            // Add headers
            const headers = columnOptionsForExport.filter((col) => col.visible).map((col) => col.header);
            worksheet.addRow(headers);

            // Add data
            workOrders.forEach((wo) => {
                const rowData = columnOptionsForExport
                    .filter((col) => col.visible)
                    .map((col) => {
                        if (col.field === "machine.name") return wo.machine?.name || "N/A";
                        if (col.field.includes("_at")) return wo[col.field] ? new Date(wo[col.field]).toLocaleString("id-ID") : "N/A";
                        if (col.field === "status") return statusMapForExport[wo.status] || wo.status;
                        return wo[col.field];
                    });
                worksheet.addRow(rowData);
            });

            // Style headers
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
            });

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast("success", "Success", "Data exported successfully");
        } catch (error) {
            showToast("error", "Error", `Export failed: ${error.message}`);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const buffer = await file.arrayBuffer();
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
                        if (headerCell?.value) {
                            const fieldName = headerCell.value.toString().toLowerCase().replace(/ /g, "_");
                            rowObject[fieldName] = cell.value;
                        }
                    });
                    jsonData.push(rowObject);
                }
            });

            // Process import data
            for (const item of jsonData) {
                const payload = {
                    title: item.judul_isu || item.issue_title || item.title,
                    description: item.deskripsi || item.description,
                    machine_id: item.id_mesin || item.machine_id,
                    priority: item.prioritas || item.priority || "medium",
                    status: "open"
                };

                const res = await fetch("/api/employee/issues", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const body = await res.json();
                    throw new Error(body.message || `Failed to import item: ${item.title || "Unknown"}`);
                }
            }

            showToast("success", "Success", "Data imported successfully");
            await fetchWorkOrders();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

const exportPdf = (config = null) => {
        const currentConfig = config || printConfig;

       if (!workOrders.length) {
            showToast("warn", "No Data", "There are no work orders to print");
            return;
        }

        const doc = new jsPDF({
            orientation: currentConfig.orientation,
            unit: currentConfig.unit,
            format: currentConfig.format
        });

        const headers = ["No", "Title", "Description", "Machine", "Status", "Created"];

        const data = workOrders.map((wo, index) => [(index + 1).toString(), wo.title || "-", wo.description || "-", wo.machine?.name || "-",  statusMapForExport[wo.status] || wo.status || "-", wo.created_at ? new Date(wo.created_at).toLocaleDateString("id-ID") : "-"]);

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

    // --- Print Handler ---
    const handlePrint = () => {
        exportPdf();
    };

    // --- Adjust Print Margins ---
    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        exportPdf(newConfig);
    };

    const handleImagePreview = (url) => {
        setPreviewImageUrl(url);
        setIsImagePreviewOpen(true);
    };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
            <ConfirmDialog />

            <div className="card">
                <h3 className="mb-4">Work Order Management</h3>

                <div className="flex flex-row gap-2 mb-4">
                    <Button label="Back" icon="pi pi-arrow-left" outlined onClick={() => router.push("/dashboard")} />
                    <Button
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
                    <Button label="Import" icon="pi pi-file-import" outlined onClick={() => fileInputRef.current?.click()} />
                    <Button label="Export" icon="pi pi-file-export" outlined onClick={exportExcel} />
                    <Button label="Print" icon="pi pi-print" outlined onClick={() => setAdjustDialog(true)} />
                    <Divider layout="vertical" />
                    <Button label={`Delete (${selectedWorkOrders.length})`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedWorkOrders.length === 0} />
                    <Divider layout="vertical" />
                    <Button label="Refresh" icon="pi pi-refresh" outlined onClick={handleRefresh} />
                </div>

                <WorkRequestTable
                    workOrders={workOrders}
                    loading={loading}
                    selectedWorkOrders={selectedWorkOrders}
                    onSelectionChange={setSelectedWorkOrders}
                    onEdit={(wo) => {
                        setSelectedWorkOrder(wo);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                    searchText={searchText}
                    onSearch={handleSearch}
                    onImagePreview={handleImagePreview}
                />

                {/* Dialog Components */}
                <WorkRequestFormDialog visible={isFormOpen} onHide={() => setFormOpen(false)} workOrder={selectedWorkOrder} fetchWorkOrders={fetchWorkOrders} machines={machines} fetchMachines={fetchMachines} showToast={showToast} />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    onHide={() => {
                        setDeleteOpen(false);
                        setSelectedWorkOrder(null);
                    }}
                    workOrder={selectedWorkOrder}
                    selectedWorkOrders={selectedWorkOrders}
                    fetchWorkOrders={() => {
                        fetchWorkOrders();
                        setSelectedWorkOrders([]);
                    }}
                    showToast={showToast}
                />

                <AdjustPrintMarginLaporan
                    key={adjustDialog ? "open" : "closed"}
                    adjustDialog={adjustDialog}
                    setAdjustDialog={setAdjustDialog}
                    handleAdjust={handleAdjust}
                    printConfig={printConfig}
                    setPrintConfig={setPrintConfig}
                    excel={exportExcel}
                />

                {/* PDF Preview Dialog */}
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setJsPdfPreviewOpen(false)} modal style={{ width: "90vw", height: "90vh" }} header="PDF Preview">
                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                </Dialog>

                <Dialog visible={isImagePreviewOpen} onHide={() => setIsImagePreviewOpen(false)} modal header="Image Preview">
                    <img src={previewImageUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "80vh" }} />
                </Dialog>
            </div>
        </div>
    );
};

export default WorkOrderPage;
