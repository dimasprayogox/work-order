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
import { Image } from "primereact/image";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from "primereact/dialog";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import UpdateWorkOrderDialog from "./components/UpdateWorkOrderDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

// Status filter options
const statusFilterOptions = [
    { label: "All Statuses", value: "" },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Resolved", value: "resolved" },
    { label: "Completed", value: "completed" },
];

// Column options for export/print
const columnOptions = [
    { field: 'title', header: 'Title', visible: true },
    { field: 'description', header: 'Description', visible: true },
    { field: 'priority', header: 'Priority', visible: true },
    { field: 'status', header: 'Status', visible: true },
    { field: 'created_at', header: 'Schedule', visible: true },
    { field: 'started_at', header: 'Started At', visible: true },
    { field: 'completed_at', header: 'Completed At', visible: true },
    { field: 'notes', header: 'Notes', visible: true },
];

const statusBodyTemplate = (rowData) => {
    const statusMap = {
        pending: { label: "Pending", severity: "danger" },
        in_progress: { label: "In Progress", severity: "info" },
        resolved: { label: "Resolved", severity: "success" },
        completed: { label: "Completed", severity: "success" },
    };
    const statusInfo = statusMap[rowData.status] || { label: rowData.status, severity: "warning" };
    return <Tag value={statusInfo.label} severity={statusInfo.severity} />;
};

const dateBodyTemplate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("id-ID", {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const photoBodyTemplate = (rowData) => {
    const photoUrl = rowData.issue?.photo_url;
    if (photoUrl) {
        return (
            <Image
                src={photoUrl}
                alt="Issue Photo"
                width="60"
                height="60"
                preview
                imageClassName="rounded-md object-cover"
            />
        );
    }
    return <div className="flex items-center justify-center h-[60px] w-[60px] bg-gray-100 rounded-md text-gray-400 text-xs">No Photo</div>;
};

export default function TechnicianWorkOrderPage() {
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const toast = useRef(null);
    const fileInputRef = useRef(null);
    const router = useRouter();

    const [isUpdateDialogVisible, setUpdateDialogVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("WorkOrders");
    const [printConfig, setPrintConfig] = useState({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
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
            const res = await fetch("/api/technician/work-orders");
            if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch data.");
            const result = await res.json();
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
        const worksheet = workbook.addWorksheet('Work Orders');

        // Add headers
        const headers = columnOptions
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        // Add data
        workOrders.forEach(wo => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field.includes('_at')) {
                        return dateBodyTemplate(wo[col.field]);
                    } else if (col.field === 'status') {
                        const statusMap = {
                            pending: "Pending",
                            in_progress: "In Progress",
                            resolved: "Resolved",
                            completed: "Completed"
                        };
                        return statusMap[wo.status] || wo.status;
                    } else {
                        return wo[col.field];
                    }
                });

            worksheet.addRow(rowData);
        });

        // Style headers
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // --- Export to PDF ---
    const exportPdf = () => {
        const doc = new jsPDF({
            orientation: printConfig.orientation,
            unit: printConfig.unit,
            format: printConfig.format
        });

        const visibleColumns = columnOptions.filter(col => col.visible);

        const headers = visibleColumns.map(col => col.header);
        const data = workOrders.map(wo => {
            return visibleColumns.map(col => {
                if (col.field.includes('_at')) {
                    return dateBodyTemplate(wo[col.field]);
                } else if (col.field === 'status') {
                    const statusMap = {
                        pending: "Pending",
                        in_progress: "In Progress",
                        resolved: "Resolved",
                        completed: "Completed"
                    };
                    return statusMap[wo.status] || wo.status;
                } else {
                    return wo[col.field];
                }
            });
        });

        doc.text('Work Orders Report', printConfig.marginLeft, printConfig.marginTop);

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

        const pdfBlob = doc.output('blob');
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
        exportPdf();
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
                    const res = await fetch('/api/technician/work-orders', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(item)
                    });
                    if (!res.ok) {
                        const body = await res.json();
                        throw new Error(body.message || `Failed to import item: ${item.title || 'Unknown'}`);
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

    const actionBodyTemplate = (rowData) => (
        <Button
            icon="pi pi-pencil"
            rounded
            outlined
            className="p-button-sm"
            onClick={() => handleUpdate(rowData)}
            tooltip="Update"
            tooltipOptions={{ position: "top" }}
        />
    );

    const filteredData = workOrders.filter((wo) => {
        const searchMatch = globalFilter ? Object.values(wo).some(val =>
            String(val).toLowerCase().includes(globalFilter.toLowerCase())
        ) : true;
        const statusMatch = statusFilter ? wo.status === statusFilter : true;
        return searchMatch && statusMatch;
    });

    const header = (
        <div className="flex flex-column md:flex-row justify-content-between gap-2">
            <div>
                <Dropdown
                    value={statusFilter}
                    options={statusFilterOptions}
                    onChange={(e) => setStatusFilter(e.value)}
                    placeholder="Filter by Status"
                    className="w-full md:w-auto"
                />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search keyword"
                    className="w-full md:w-auto"
                />
            </span>
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="card">
                <div className="flex justify-content-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-semibold">Technician Work Orders</h3>
                        <p className="text-sm text-gray-500">View and update tasks assigned to you.</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-content-between gap-2 mb-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="small"
                            label="Import"
                            icon="pi pi-file-import"
                            outlined
                            onClick={() => fileInputRef.current?.click()}
                            tooltip="Import from Excel"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <Button
                            size="small"
                            label="Export"
                            icon="pi pi-file-export"
                            outlined
                            onClick={exportExcel}
                            tooltip="Export to Excel"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <Button
                            size="small"
                            label="Print"
                            icon="pi pi-print"
                            outlined
                            onClick={() => setAdjustDialog(true)}
                            tooltip="Print Report"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <Divider layout="vertical" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="small"
                            label="Refresh"
                            icon="pi pi-refresh"
                            outlined
                            onClick={fetchWorkOrders}
                            disabled={loading}
                            tooltip="Refresh Data"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Panel>
                        <DataTable
                            value={filteredData}
                            loading={loading}
                            dataKey="id"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            header={header}
                            emptyMessage="No work orders found."
                        >
                            <Column header="Photo" body={photoBodyTemplate} style={{ width: '100px' }} />
                            <Column field="title" header="Title" sortable />
                            <Column field="description" header="Description" style={{ minWidth: '200px' }} />
                            <Column field="priority" header="Priority" body={(rowData) => <Tag value={rowData.priority} />} sortable />
                            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                            <Column field="created_at" header="Schedule" body={(rowData) => dateBodyTemplate(rowData.created_at)} sortable />
                            <Column field="started_at" header="Started At" body={(rowData) => dateBodyTemplate(rowData.started_at)} sortable />
                            <Column field="completed_at" header="Completed At" body={(rowData) => dateBodyTemplate(rowData.completed_at)} sortable />
                            <Column field="notes" header="Notes" style={{ maxWidth: '200px' }} />
                            <Column header="Actions" body={actionBodyTemplate} style={{ width: '6rem', textAlign: 'center' }} />
                        </DataTable>
                    </Panel>
                </motion.div>
            </div>

            <UpdateWorkOrderDialog
                visible={isUpdateDialogVisible}
                onHide={() => setUpdateDialogVisible(false)}
                workOrder={selectedWorkOrder}
                fetchWorkOrders={fetchWorkOrders}
                showToast={showToast}
            />

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImport}
                accept=".xlsx,.xls"
            />

            <AdjustPrintMarginLaporan
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
    );
}
