"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from "primereact/dialog";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import {
    statusBodyTemplate as commonStatusBodyTemplate,
    dateBodyTemplate as commonDateBodyTemplate,
    technicianBodyTemplate
} from "./components/WorkOrderTable";

import DelegateTechnicianDialog from "./components/DelegateTechnicianDialog";
import WorkOrderDetailsDialog from "./components/WorkOrderDetailsDialog";
import CreateWorkOrderDialog from "./components/CreateWorkOrderDialog";

const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const statusMapForExport = {
    pending: "Pending",
    in_progress: "Dalam Proses",
    completed: "Selesai",
};

const statusFilterOptions = [
    { label: "Semua Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Dalam Proses", value: "in_progress" },
    { label: "Selesai", value: "completed" },
];

export default function WorkOrderPage() {
    const toast = useRef(null);
    const router = useRouter();
    const [workOrders, setWorkOrders] = useState([]);
    const [selectedWorkOrders, setSelectedWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState("");
    const [assignmentFilter, setAssignmentFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [searchText, setSearchText] = useState("");

    const [assignDialogVisible, setAssignDialogVisible] = useState(false);
    const [createWorkOrderDialogVisible, setCreateWorkOrderDialogVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [viewDetailsDialogVisible, setViewDetailsDialogVisible] = useState(false);

    const fileInputRef = useRef(null);
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

    const columnOptions = [
        { field: 'title', header: 'Judul', visible: true },
        { field: 'description', header: 'Deskripsi', visible: true },
        { field: 'machine.name', header: 'Mesin', visible: true },
        { field: 'priority', header: 'Prioritas', visible: true },
        { field: 'status', header: 'Status', visible: true },
        { field: 'assignedTo.full_name', header: 'Ditugaskan Kepada', visible: true },
        { field: 'scheduled_date', header: 'Tanggal Terjadwal', visible: true },
        { field: 'created_at', header: 'Dibuat Pada', visible: true },
        { field: 'started_at', header: 'Mulai Pada', visible: true },
        { field: 'completed_at', header: 'Selesai Pada', visible: true },
        { field: 'notes', header: 'Catatan', visible: true },
    ];

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

    const handleWorkOrderCreated = useCallback(() => {
        showToast("success", "Berhasil", "Work Order baru berhasil dibuat.");
        setCreateWorkOrderDialogVisible(false);
        fetchWorkOrders();
    }, [showToast, fetchWorkOrders]);

    const handleTechnicianAssigned = useCallback((updatedWorkOrder) => {
        showToast("success", "Berhasil", "Teknisi berhasil ditugaskan.");
        setAssignDialogVisible(false);

        setWorkOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === updatedWorkOrder.id
                    ? { ...updatedWorkOrder }
                    : order
            )
        );
        setSelectedWorkOrders([]);
    }, [showToast]);

    const handleDeleteSelected = () => {
        if (selectedWorkOrders.length === 0) return;
        confirmDialog({
            message: `Anda yakin ingin menghapus ${selectedWorkOrders.length} Work Order terpilih?`,
            header: 'Konfirmasi Hapus',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ya',
            rejectLabel: 'Tidak',
            accept: async () => {
                setLoading(true);
                try {
                    for (const wo of selectedWorkOrders) {
                        const response = await fetch(`/api/manager/work-orders/${wo.id}`, {
                            method: "DELETE",
                            credentials: "include"
                        });
                        if (!response.ok) {
                            const result = await response.json();
                            throw new Error(result.message || `Gagal menghapus Work Order: ${wo.title}`);
                        }
                    }
                    showToast("success", "Berhasil", "Work Order terpilih berhasil dihapus.");
                    fetchWorkOrders();
                    setSelectedWorkOrders([]);
                } catch (error) {
                    showToast("error", "Error", error.message);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleViewDetails = (rowData) => {
        setSelectedWorkOrder(rowData);
        setViewDetailsDialogVisible(true);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-user-plus"
                    className="p-button-rounded p-button-info"
                    tooltip="Tugaskan Teknisi"
                    onClick={() => {
                        setSelectedWorkOrder(rowData);
                        setAssignDialogVisible(true);
                    }}
                    disabled={rowData.status !== 'pending'}
                />
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-secondary"
                    tooltip="Lihat Detail"
                    onClick={() => handleViewDetails(rowData)}
                />
            </div>
        );
    };

    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Work Orders');
        const headers = columnOptions.filter(col => col.visible).map(col => col.header);
        worksheet.addRow(headers);
        workOrders.forEach(wo => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field === 'machine.name') {
                        return wo.machine?.name || 'N/A';
                    } else if (col.field === 'assignedTo.full_name') {
                        return wo.assignedTo?.full_name || 'Belum Ditugaskan';
                    } else if (col.field.includes('_date') || col.field.includes('_at')) {
                        return commonDateBodyTemplate(wo[col.field]);
                    } else if (col.field === 'status') {
                        return statusMapForExport[wo.status] || wo.status;
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
        showToast("success", "Ekspor Berhasil", "Data berhasil diekspor ke Excel.");
    };

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
                if (col.field === 'machine.name') {
                    return wo.machine?.name || 'N/A';
                } else if (col.field === 'assignedTo.full_name') {
                    return wo.assignedTo?.full_name || 'Belum Ditugaskan';
                } else if (col.field.includes('_date') || col.field.includes('_at')) {
                    return commonDateBodyTemplate(wo[col.field]);
                } else if (col.field === 'status') {
                    return statusMapForExport[wo.status] || wo.status;
                } else {
                    return wo[col.field];
                }
            });
        });
        doc.text('Laporan Work Order', printConfig.marginLeft, printConfig.marginTop);
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
                                const fieldName = headerCell.value.toString().toLowerCase().replace(/ /g, '_');
                                rowObject[fieldName] = cell.value;
                            }
                        });
                        jsonData.push(rowObject);
                    }
                });

                for (const item of jsonData) {
                    const payload = {
                        title: item.judul || item.title,
                        description: item.deskripsi || item.description,
                        machine_id: item.machine_id || item.mesin_id,
                        priority: item.priority || 'medium',
                        scheduled_date: item.scheduled_date ? new Date(item.scheduled_date).toISOString() : undefined,
                    };
                    const res = await fetch(`/api/manager/work-orders`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                        credentials: "include"
                    });
                    if (!res.ok) {
                        const body = await res.json();
                        throw new Error(body.message || `Gagal mengimpor item: ${item.title || 'Tidak diketahui'}`);
                    }
                }
                showToast("success", "Impor Berhasil", "Data berhasil diimpor.");
                await fetchWorkOrders();
            };
        } catch (err) {
            showToast("error", "Impor Gagal", err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const assignedTechnicians = workOrders.filter(wo => wo.assignedTo).map(wo => wo.assignedTo);
    const uniqueTechnicians = Array.from(new Set(assignedTechnicians.map(t => t.full_name)))
        .map(name => assignedTechnicians.find(t => t.full_name === name));

    const getAssignedCount = () => workOrders.filter(wo => wo.assignedTo).length;
    const getUnassignedCount = () => workOrders.filter(wo => !wo.assignedTo).length;
    const getActiveTechniciansCount = () => {
        const activeTechnicians = new Set(workOrders.filter(wo => wo.status === 'in_progress').map(wo => wo.assigned_to_id));
        return activeTechnicians.size;
    };
    const getAvgWorkload = () => {
        const assignedWorkOrders = getAssignedCount();
        const activeTechs = getActiveTechniciansCount();
        return activeTechs > 0 ? (assignedWorkOrders / activeTechs).toFixed(1) : 0;
    };

    const assignmentFilterOptions = [
        { label: "All", value: "" },
        { label: "Unassigned", value: "unassigned" },
        { label: "Assigned", value: "assigned" }
    ];

    const priorityFilterOptions = [
        { label: "All Priority", value: "" },
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" }
    ];

    const filteredData = workOrders.filter((wo) => {
        const matchesStatus = !statusFilter || wo.status === statusFilter;
        const matchesAssignment = !assignmentFilter ||
            (assignmentFilter === "unassigned" && !wo.assignedTo) ||
            (assignmentFilter === "assigned" && !!wo.assignedTo);
        const matchesPriority = !priorityFilter || wo.priority === priorityFilter;
        const matchesSearch = !searchText ||
            wo.title.toLowerCase().includes(searchText.toLowerCase()) ||
            (wo.description && wo.description.toLowerCase().includes(searchText.toLowerCase())) ||
            (wo.machine?.name && wo.machine.name.toLowerCase().includes(searchText.toLowerCase())) ||
            (wo.assignedTo?.full_name && wo.assignedTo.full_name.toLowerCase().includes(searchText.toLowerCase()));

        return matchesStatus && matchesAssignment && matchesPriority && matchesSearch;
    });

    const tableHeader = (
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Cari kata kunci"
                className="w-full md:w-auto"
            />
        </span>
    );


    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="card">
                <h3 className="text-2xl font-semibold mb-4">Manajemen Work Order</h3>

                <div className="grid mb-4">
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="bg-white p-4 text-center rounded-md shadow-md">
                            <h5 className="text-xl text-blue-500 font-bold mb-2">{getUnassignedCount()}</h5>
                            <p className="text-sm text-gray-500">Unassigned</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="bg-white p-4 text-center rounded-md shadow-md">
                            <h5 className="text-xl text-green-500 font-bold mb-2">{getAssignedCount()}</h5>
                            <p className="text-sm text-gray-500">Assigned</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="bg-white p-4 text-center rounded-md shadow-md">
                            <h5 className="text-xl text-orange-500 font-bold mb-2">{getActiveTechniciansCount()}</h5>
                            <p className="text-sm text-gray-500">Active Technicians</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="bg-white p-4 text-center rounded-md shadow-md">
                            <h5 className="text-xl text-purple-500 font-bold mb-2">{getAvgWorkload()}</h5>
                            <p className="text-sm text-gray-500">Avg Workload</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 mb-4 bg-gray-100 rounded-md shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Status</label>
                            <Dropdown
                                value={statusFilter}
                                options={statusFilterOptions}
                                onChange={(e) => setStatusFilter(e.value)}
                                placeholder="All Status"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Assignment</label>
                            <Dropdown
                                value={assignmentFilter}
                                options={assignmentFilterOptions}
                                onChange={(e) => setAssignmentFilter(e.value)}
                                placeholder="All"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold mb-1">Priority</label>
                            <Dropdown
                                value={priorityFilter}
                                options={priorityFilterOptions}
                                onChange={(e) => setPriorityFilter(e.value)}
                                placeholder="All Priority"
                            />
                        </div>
                    </div>
                    <Button
                        label="Clear Filters"
                        icon="pi pi-filter-slash"
                        className="mt-4 p-button-outlined"
                        onClick={() => {
                            setStatusFilter("");
                            setAssignmentFilter("");
                            setPriorityFilter("");
                        }}
                    />
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
                            setSelectedWorkOrder(null);
                            setCreateWorkOrderDialogVisible(true);
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
                        label={`Delete${selectedWorkOrders.length > 0 ? ` (${selectedWorkOrders.length})` : ''}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={handleDeleteSelected}
                        disabled={selectedWorkOrders.length === 0}
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

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Panel header="Daftar Work Order" className="shadow-2">
                        {loading ? (
                            <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}>
                                <ProgressSpinner />
                            </div>
                        ) : (
                            <DataTable
                                value={filteredData}
                                selection={selectedWorkOrders}
                                onSelectionChange={(e) => setSelectedWorkOrders(e.value)}
                                dataKey="id"
                                paginator
                                rows={10}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                header={tableHeader}
                                emptyMessage="Tidak ada Work Order ditemukan."
                                selectionMode="multiple"
                                className="p-datatable-gridlines"
                            >
                                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                                <Column field="title" header="Judul" sortable />
                                <Column field="machine.name" header="Mesin" sortable />
                                <Column field="priority" header="Prioritas" body={(rowData) => <Tag value={rowData.priority} />} sortable />
                                <Column field="status" header="Status" body={commonStatusBodyTemplate} sortable />
                                <Column header="Ditugaskan Kepada" body={technicianBodyTemplate} sortable sortField="assignedTo.full_name" />
                                <Column header="Tanggal Terjadwal" body={(rowData) => commonDateBodyTemplate(rowData.scheduled_date)} sortable sortField="scheduled_date" />
                                <Column header="Dibuat Pada" body={(rowData) => commonDateBodyTemplate(rowData.created_at)} sortable sortField="created_at" />
                                <Column field="started_at" header="Mulai Pada" body={(rowData) => commonDateBodyTemplate(rowData.started_at)} sortable />
                                <Column field="completed_at" header="Selesai Pada" body={(rowData) => commonDateBodyTemplate(rowData.completed_at)} sortable />
                                <Column field="notes" header="Catatan" style={{ maxWidth: '200px' }} />
                                <Column
                                    header="Aksi"
                                    body={actionBodyTemplate}
                                    style={{ minWidth: "10rem" }}
                                />
                            </DataTable>
                        )}
                    </Panel>
                </motion.div>
            </div>
            <DelegateTechnicianDialog
                visible={assignDialogVisible}
                onHide={() => setAssignDialogVisible(false)}
                workOrder={selectedWorkOrder}
                showToast={showToast}
                onTechnicianAssigned={handleTechnicianAssigned}
            />
            <WorkOrderDetailsDialog
                visible={viewDetailsDialogVisible}
                onHide={() => setViewDetailsDialogVisible(false)}
                workOrder={selectedWorkOrder}
            />
            <CreateWorkOrderDialog
                visible={createWorkOrderDialogVisible}
                onHide={() => setCreateWorkOrderDialogVisible(false)}
                showToast={showToast}
                onWorkOrderCreated={handleWorkOrderCreated}
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
                printConfig={printConfig}
                setPrintConfig={setPrintConfig}
            />
            <Dialog
                visible={jsPdfPreviewOpen}
                onHide={() => setJsPdfPreviewOpen(false)}
                modal
                style={{ width: '90vw', height: '90vh' }}
                header="Pratinjau PDF"
            >
                <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
            </Dialog>
        </div>
    );
}