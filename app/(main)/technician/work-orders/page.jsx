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
import { ConfirmDialog } from 'primereact/confirmdialog';
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

const priorityBodyTemplate = (rowData) => {
    const priority = rowData.priority || '';
    const severityMap = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'success'
    };
    const displayValue = priority.charAt(0).toUpperCase() + priority.slice(1);
    const severity = severityMap[priority.toLowerCase()] || 'info';
    return <Tag value={displayValue} severity={severity} />;
};

const partRequestStatusBodyTemplate = (rowData) => {
        const partRequests = rowData.partRequests;

        // Kondisi jika tidak ada part request
        if (!partRequests || partRequests.length === 0) {
            return (
                <div className="flex flex-column align-items-center gap-2 text-center">
                    <span className="text-sm text-gray-500">Belum ada request part</span>
                </div>
            );
        }

        const statusSeverityMap = {
            pending: 'warning',
            approved: 'info',
            fulfilled: 'success',
            rejected: 'danger'
        };

        // Menampilkan semua status part request jika ada
        return (
            <div className="flex flex-column align-items-start gap-1">
                {partRequests.map(req => (
                    <Tag
                        key={req.id}
                        value={req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        severity={statusSeverityMap[req.status.toLowerCase()] || 'info'}
                        className="text-xs"
                    />
                ))}
            </div>
        );
    };

const getStatusLabel = (status) => {
    const statusMap = {
        pending: "Pending",
        in_progress: "In Progress",
        completed: "Completed",
        rejected: "Rejected",
    };
    return statusMap[status] || status;
};

const statusBodyTemplate = (rowData) => {
    const statusConfig = {
        'pending': { bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: 'pi-clock' },
        'in_progress': { bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: 'pi-spin pi-spinner' },
        'completed': { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check-circle' },
        'rejected': { bgColor: 'bg-red-100', textColor: 'text-red-800', icon: 'pi-times-circle' },
    };
    const config = statusConfig[rowData.status] || { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: 'pi-question' };
    return (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                <i className={`pi ${config.icon}`}></i>
                <span className="font-medium">{getStatusLabel(rowData.status)}</span>
            </div>
        </motion.div>
    );
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

    // 👈 Perubahan: State untuk pratinjau gambar
    const [isImageHovered, setIsImageHovered] = useState(false);
    const [hoveredImageId, setHoveredImageId] = useState(null);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

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
    const [tempPrintConfig, setTempPrintConfig] = useState(null);

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

    // 👈 Perubahan: photoBodyTemplate dipindahkan ke dalam komponen dan diperbarui
    const photoBodyTemplate = (rowData) => {
        const handleImageClick = (url) => {
            setPreviewImageUrl(url);
            setImagePreviewVisible(true);
        };

        const handleMouseEnter = (id) => {
            setIsImageHovered(true);
            setHoveredImageId(id);
        };

        const handleMouseLeave = () => {
            setIsImageHovered(false);
            setHoveredImageId(null);
        };

        const overlayStyle = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '0.375rem', // Sesuai dengan rounded-md
            cursor: 'pointer',
        };

        const photoUrl = rowData.issue?.photo_url;

        if (photoUrl) {
            return (
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => handleMouseEnter(rowData.id)}
                    onMouseLeave={handleMouseLeave}
                    className="relative"
                >
                    <img
                        src={photoUrl}
                        alt="Issue Preview"
                        style={{ width: "60px", height: "60px", objectFit: "cover", cursor: "pointer" }}
                        className="shadow-lg rounded-md"
                        onClick={() => handleImageClick(photoUrl)}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/60x60/cccccc/000000?text=No+Image";
                        }}
                    />
                    {isImageHovered && hoveredImageId === rowData.id && (
                        <div
                            style={overlayStyle}
                            onClick={() => handleImageClick(photoUrl)}
                        >
                            <i className="pi pi-eye text-white text-xl"></i>
                        </div>
                    )}
                </motion.div>
            );
        }
        return <div className="flex items-center justify-center h-[60px] w-[60px] bg-gray-100 rounded-md text-gray-400 text-xs">No Photo</div>;
    };

    // --- Export to Excel ---
    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Work Orders');

        const headers = columnOptions
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        workOrders.forEach(wo => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field.includes('_at')) {
                        return dateBodyTemplate(wo[col.field]);
                    } else if (col.field === 'status') {
                        return getStatusLabel(wo.status);
                    } else {
                        return wo[col.field];
                    }
                });

            worksheet.addRow(rowData);
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

        const visibleColumns = columnOptions.filter(col => col.visible);

        const headers = visibleColumns.map(col => col.header);
        const data = workOrders.map(wo => {
            return visibleColumns.map(col => {
                if (col.field.includes('_at')) {
                    return dateBodyTemplate(wo[col.field]);
                } else if (col.field === 'status') {
                    return getStatusLabel(wo.status);
                } else {
                    return wo[col.field];
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

    const handleDialogHide = () => {
        setUpdateDialogVisible(false);
        // Reset selected work order after a short delay to avoid the error
        setTimeout(() => {
            setSelectedWorkOrder(null);
        }, 100);
    };

    const actionBodyTemplate = (rowData) => (
        <Button
            icon="pi pi-pencil"
            rounded
            outlined
            className="p-button-sm"
            onClick={() => handleUpdate(rowData)}
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
                            label="Back"
                            icon="pi pi-arrow-left"
                            outlined
                            onClick={() => router.push("/technician/dashboard")}
                        />
                        <Button
                            size="small"
                            label="New"
                            icon="pi pi-plus"
                            outlined
                            severity="success"
                            disabled
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
                            label="Delete"
                            icon="pi pi-trash"
                            severity="danger"
                            outlined
                            disabled
                        />
                        <Divider layout="vertical" />
                        <Button
                            size="small"
                            label="Refresh"
                            icon="pi pi-refresh"
                            outlined
                            onClick={fetchWorkOrders}
                            disabled={loading}
                        />
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Panel>
                        <DataTable value={filteredData} loading={loading} dataKey="id" paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} header={header} emptyMessage="No work orders found.">
                            <Column header="Photo" body={photoBodyTemplate} style={{ maxwidth: '50px' }} />
                            <Column field="title" header="Title" sortable />
                            <Column field="description" header="Description" style={{ minWidth: '200px' }} />
                            <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
                            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                            <Column header="Part Request" body={partRequestStatusBodyTemplate} style={{ width: '180px' }}/>
                            <Column field="scheduled_date" header="Schedule" body={(rowData) => dateBodyTemplate(rowData.created_at)} sortable />
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
                onHide={handleDialogHide}
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
                key={adjustDialog ? 'open' : 'closed'} // Force re-render
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

            {/* 👈 Perubahan: Tambahkan Dialog untuk pratinjau gambar */}
            <Dialog
                visible={imagePreviewVisible}
                onHide={() => setImagePreviewVisible(false)}
                modal
                header="Pratinjau Gambar"
                style={{ width: '50vw' }}
                contentStyle={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                <img
                    src={previewImageUrl}
                    alt="Pratinjau Isu"
                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400/cccccc/000000?text=Image+Not+Found";
                    }}
                />
            </Dialog>
        </div>
    );
}
