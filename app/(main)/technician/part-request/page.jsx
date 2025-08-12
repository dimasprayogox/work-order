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
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import ItemDetailDialog from "./components/ItemDetailDialog";
import CreatePartRequestDialog from "./components/CreatePartRequestDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const getStatusLabel = (status) => {
    const statusMap = {
        pending: "Pending",
        approved: "Approved",
        fulfilled: "Fulfilled",
        rejected: "Rejected", // Menambahkan 'rejected' jika ada
    };
    return statusMap[status] || status;
};

// 2. PERBAIKI statusBodyTemplate
const statusBodyTemplate = (rowData) => {
    // Gunakan nilai data asli (e.g., 'in_progress') sebagai kunci
    const statusConfig = {
        'pending': { color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: 'pi-clock' },
        'approved': { color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: 'pi-spin pi-spinner' },
        'fulfilled': { color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check-circle' },
        'rejected': { color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: 'pi-times-circle' },
    };

    const config = statusConfig[rowData.status] || { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: 'pi-question' };

    return (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                <i className={`pi ${config.icon}`}></i>
                {/* Gunakan helper untuk menampilkan label yang benar */}
                <span className="font-medium">{getStatusLabel(rowData.status)}</span>
            </div>
        </motion.div>
    );
};

const dateBodyTemplate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function PartRequestPage() {
    const [partRequests, setPartRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    const [isDetailVisible, setDetailVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isCreateVisible, setCreateVisible] = useState(false);
    const [isFormLoading, setFormLoading] = useState(false);
    const [formInitialData, setFormInitialData] = useState({ workOrders: [], parts: [] });

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
    const [columnOptions, setColumnOptions] = useState([
        { field: 'workOrder.title', header: 'Title', visible: true },
        { field: 'status', header: 'Status', visible: true },
        { field: 'note', header: 'Notes', visible: true },
        { field: 'created_at', header: 'Requested At', visible: true }
    ]);

    const [tempPrintConfig, setTempPrintConfig] = useState(null);
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

    // --- Export to Excel ---
    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Part Requests');

        // Add headers
        const headers = columnOptions
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        // Add data
        partRequests.forEach(request => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field === 'created_at') {
                        return dateBodyTemplate(request.created_at);
                    } else if (col.field === 'status') {
                        const statusMap = {
                            pending: "Pending",
                            approved: "Approved",
                            fulfilled: "Fulfilled",
                            rejected: "Rejected"
                        };
                        return statusMap[request.status] || request.status.toUpperCase();
                    } else if (col.field.includes('.')) {
                        // Handle nested properties
                        const fields = col.field.split('.');
                        let value = request;
                        fields.forEach(field => {
                            value = value?.[field];
                        });
                        return value;
                    } else {
                        return request[col.field];
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
    const exportPdf = (config = null) => {
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
                        return dateBodyTemplate(request.created_at);
                    } else if (col.field === 'status') {
                        const statusMap = {
                            pending: "Pending",
                            approved: "Approved",
                            fulfilled: "Fulfilled",
                            rejected: "Rejected"
                        };
                        return statusMap[request.status] || request.status.toUpperCase();
                    } else if (col.field.includes('.')) {
                        // Handle nested properties
                        const fields = col.field.split('.');
                        let value = request;
                        fields.forEach(field => {
                            value = value?.[field];
                        });
                        return value;
                    } else {
                        return request[col.field];
                    }
                });
            });

            doc.text('Work Orders Report', currentConfig.marginLeft, currentConfig.marginTop);

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

            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            setPdfUrl(pdfUrl);
            setJsPdfPreviewOpen(true);
        };

    // --- Adjust Print Margins ---
     const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        setTempPrintConfig(newConfig);
        exportPdf(newConfig); // Immediately generate PDF with new config
    };

    // --- Delete multiple requests ---
    const deleteSelectedRequests = async () => {
        setLoading(true);
        try {
            const idsToDelete = selectedRequests.map(req => req.id);
            const res = await fetch(`/api/technician/part-request`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: idsToDelete }),
            });

            if (!res.ok) throw new Error((await res.json()).message || "Failed to delete selected requests.");

            showToast('success', 'Success', `${selectedRequests.length} requests have been deleted.`);
            await fetchPartRequests();
            setSelectedRequests([]);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteSelected = () => {
        confirmDialog({
            message: `Are you sure you want to delete the ${selectedRequests.length} selected requests?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: deleteSelectedRequests,
        });
    };

    const isDeleteDisabled = selectedRequests.length === 0 || selectedRequests.some(req => req.status !== 'pending');

    // --- Delete single request ---
    const confirmDeleteSingle = (request) => {
        confirmDialog({
            message: `Are you sure you want to delete the request for Work Order "${request.workOrder?.title}"?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/technician/part-request/${request.id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error((await res.json()).message || "Failed to delete request.");
                    showToast('success', 'Success', 'Part request has been deleted.');
                    await fetchPartRequests();
                } catch (err) {
                    showToast('error', 'Error', err.message);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleShowItems = (items) => {
        setSelectedItems(items || []);
        setDetailVisible(true);
    };

    const handleCreate = async () => {
        setFormLoading(true);
        try {
            const [woRes, partsRes] = await Promise.all([
                fetch('/api/technician/work-orders?status=open'),
                fetch('/api/technician/part')
            ]);

            if (!woRes.ok || !partsRes.ok) {
                throw new Error('Failed to load data for the form.');
            }

            const [woResult, partsResult] = await Promise.all([
                woRes.json(),
                partsRes.json()
            ]);

            setFormInitialData({
                workOrders: woResult.data || [],
                parts: partsResult.data || []
            });
            setCreateVisible(true);
        } catch (err) {
            showToast("error", "Data Preparation Error", err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-eye"
                rounded
                outlined
                className="p-button-sm"
                onClick={() => handleShowItems(rowData.items)}
                tooltip="View Items"
                tooltipOptions={{ position: "top" }}
                disabled={!rowData.items || rowData.items.length === 0}
            />
            <Button
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                className="p-button-sm"
                onClick={() => confirmDeleteSingle(rowData)}
                tooltip="Delete"
                tooltipOptions={{ position: "top" }}
                disabled={rowData.status !== 'pending'}
            />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="card">
                <div className="flex justify-content-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-semibold">My Part Requests</h3>
                        <p className="text-sm text-gray-500">Manage the part requests you have created.</p>
                    </div>
                </div>

                <div className="flex flex-row flex-wrap items-center gap-2 mb-4">
                    <Button
                        size="small"
                        label="Back"
                        icon="pi pi-arrow-left"
                        outlined
                        onClick={() => window.location.href = '/main/technician/dashboard'}
                    />
                    <Button
                        size="small"
                        label="New"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={handleCreate}
                        loading={isFormLoading}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Import"
                        icon="pi pi-file-import"
                        outlined
                        onClick={() => fileInputRef.current?.click()}
                        disabled
                    />
                    <Button
                        size="small"
                        label="Export"
                        icon="pi pi-file-export"
                        outlined
                        onClick={exportExcel}
                        disabled={partRequests.length === 0}
                    />
                    <Button
                        size="small"
                        label="Print"
                        icon="pi pi-print"
                        outlined
                        onClick={() => setAdjustDialog(true)}
                        disabled={partRequests.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label={`Delete${selectedRequests.length > 0 ? ` (${selectedRequests.length})` : ''}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={confirmDeleteSelected}
                        disabled={isDeleteDisabled}
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
                    <Panel>
                        <DataTable
                            value={partRequests}
                            loading={loading}
                            dataKey="id"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            selection={selectedRequests}
                            onSelectionChange={(e) => setSelectedRequests(e.value)}
                            emptyMessage="No part requests found."
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                            <Column field="workOrder.title" header="Title" sortable style={{ minWidth: '16rem' }} />
                            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                            <Column field="note" header="Notes" style={{ maxWidth: '200px' }} />
                            <Column field="created_at" header="Requested At" body={(rowData) => dateBodyTemplate(rowData.created_at)} sortable />
                            <Column header="Actions" body={actionBodyTemplate} style={{ width: '8rem', textAlign: 'center' }} />
                        </DataTable>
                    </Panel>
                </motion.div>
            </div>

            <ItemDetailDialog
                visible={isDetailVisible}
                onHide={() => setDetailVisible(false)}
                items={selectedItems}
            />

            <CreatePartRequestDialog
                visible={isCreateVisible}
                onHide={() => setCreateVisible(false)}
                fetchPartRequests={fetchPartRequests}
                showToast={showToast}
                initialData={formInitialData}
                loading={isFormLoading}
            />

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                    // Handle file import logic here
                }}
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
    );
}
