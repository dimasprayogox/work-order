"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";
import { motion } from "framer-motion";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import WorkOrderEditModal from "./components/WorkOrderEditModal";
import WorkOrderAddModal from "./components/WorkOrderAddModal";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const statusBodyTemplate = (rowData) => {
    let severity = "info";
    let icon = "";
    let displayText = "";

    switch (rowData.status) {
        case "open":
            severity = "danger";
            icon = "pi pi-exclamation-circle";
            displayText = "Pending";
            break;
        case "in_progress":
            severity = "info";
            icon = "pi pi-spin pi-spinner";
            displayText = "In Progress";
            break;
        case "resolved":
            severity = "success";
            icon = "pi pi-check-circle";
            displayText = "Resolved";
            break;
        case "closed":
            severity = "secondary";
            icon = "pi pi-lock";
            displayText = "Closed";
            break;
        default:
            severity = "warning";
            icon = "pi pi-question-circle";
            displayText = "Unknown";
    }

    return (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <Tag
                value={<span className="flex align-items-center gap-1"><i className={icon}></i> {displayText}</span>}
                severity={severity}
                className="font-medium"
            />
        </motion.div>
    );
};

const dateBodyTemplate = (rowData) => {
    return rowData.created_at ? new Date(rowData.created_at).toLocaleString("id-ID") : "N/A";
};

const columnOptionsForExport = [
    { field: 'title', header: 'Judul Isu', visible: true },
    { field: 'description', header: 'Deskripsi', visible: true },
    { field: 'machine.name', header: 'Mesin', visible: true },
    { field: 'status', header: 'Status', visible: true },
    { field: 'created_at', header: 'Dikirim', visible: true },
];

const statusMapForExport = {
    open: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
};

const WorkOrderPage = () => {
    const toast = useRef(null);
    const [addWorkOrderDialogVisible, setAddWorkOrderDialogVisible] = useState(false);
    const [editWorkOrderDialogVisible, setEditWorkOrderDialogVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [deleteWorkOrderDialogVisible, setDeleteWorkOrderDialogVisible] = useState(false);
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [isImageHovered, setIsImageHovered] = useState(false);
    const [hoveredImageId, setHoveredImageId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [loadingWorkRequests, setLoadingWorkRequests] = useState(true);
    const [myWorkRequests, setMyWorkRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [machines, setMachines] = useState([]);

    const [statusFilter, setStatusFilter] = useState("");
    const [searchText, setSearchText] = useState("");

    const fileInputRef = useRef(null);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("EmployeeWorkOrders");
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
        toast.current.show({
            severity,
            summary,
            detail,
            life: 3000,
            style: {
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }
        });
    }, []);

    const fetchMyWorkRequests = useCallback(async () => {
        setLoadingWorkRequests(true);
        try {
            const response = await fetch(`/api/employee/issues`, {
                method: "GET",
                credentials: "include"
            });
            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Failed to load work requests.";
                throw new Error(`Failed to load work requests: ${errorDetail}`);
            }
            setMyWorkRequests(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error("Error fetching work requests:", error);
            showToast("error", "Error", `${error.message}`);
            setMyWorkRequests([]);
        } finally {
            setLoadingWorkRequests(false);
        }
    }, [showToast]);

    const fetchMachines = useCallback(async () => {
        try {
            const response = await fetch(`/api/employee/machines/available`, {
                method: "GET",
                credentials: "include"
            });
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(`Expected JSON but received: ${text.substring(0, 100)}...`);
            }

            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Failed to load machines.";
                throw new Error(`Failed to load machines: ${errorDetail}`);
            }
            setMachines(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error("Error fetching machines:", error);
            showToast("error", "Error", `Failed to load machines: ${error.message}`);
            setMachines([]);
        }
    }, [showToast]);

    // 👈 Perubahan di sini
    const photoBodyTemplate = (rowData) => {
        const handleImageClick = (e, url) => {
            e.stopPropagation(); // Mencegah event klik "naik" ke baris tabel
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
            borderRadius: '6px',
            cursor: 'pointer',
        };

        if (rowData.photo_url) {
            return (
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => handleMouseEnter(rowData.id)}
                    onMouseLeave={handleMouseLeave}
                    className="relative"
                >
                    <img
                        src={rowData.photo_url}
                        alt="Issue Preview"
                        style={{ width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" }}
                        className="shadow-lg border-round"
                        onClick={(e) => handleImageClick(e, rowData.photo_url)} // Kirim event (e)
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                        }}
                    />
                    {isImageHovered && hoveredImageId === rowData.id && (
                        <div
                            style={overlayStyle}
                            onClick={(e) => handleImageClick(e, rowData.photo_url)} // Kirim event (e)
                        >
                            <i className="pi pi-eye text-white text-xl"></i>
                        </div>
                    )}
                </motion.div>
            );
        }
        return <img src="https://placehold.co/50x50/cccccc/000000?text=No+Image" alt="No photo" style={{ width: "50px", height: "50px", objectFit: "cover" }} className="shadow-lg border-round" />;
    };

    const filteredData = myWorkRequests.filter((item) => {
        const matchesStatus = statusFilter === "" || item.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesSearch = searchText === "" || item.title.toLowerCase().includes(searchText.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const handleEditWorkOrder = (rowData) => {
        setSelectedWorkOrder(rowData);
        setEditWorkOrderDialogVisible(true);
    };

    const handleDeleteWorkOrder = (rowData) => {
        setSelectedWorkOrder(rowData);
        setDeleteWorkOrderDialogVisible(true);
    };

    const onWorkOrderDeleted = useCallback(() => {
        setDeleteWorkOrderDialogVisible(false);
        fetchMyWorkRequests();
    }, [fetchMyWorkRequests]);

    const handleDeleteSelected = () => {
        if (selectedRequests.length === 0) {
            showToast("warn", "No Selection", "Please select work requests to delete.");
            return;
        }

        confirmDialog({
            message: `Are you sure you want to delete ${selectedRequests.length} selected work orders?`,
            header: 'Confirm Bulk Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setLoading(true);
                try {
                    const deletePromises = selectedRequests.map(request =>
                        fetch(`/api/employee/issues/${request.id}`, {
                            method: "DELETE",
                            credentials: "include"
                        })
                    );

                    const results = await Promise.allSettled(deletePromises);
                    const successfulDeletes = results.filter(res => res.status === 'fulfilled' && res.value.ok).length;
                    const failedDeletes = selectedRequests.length - successfulDeletes;

                    if (successfulDeletes > 0) {
                        showToast("success", "Deleted", `${successfulDeletes} work orders deleted successfully.`);
                    }
                    if (failedDeletes > 0) {
                        showToast("warn", "Partial Deletion", `${failedDeletes} work orders failed to delete.`);
                    }

                    setSelectedRequests([]);
                    fetchMyWorkRequests();
                } catch (error) {
                    console.error("Error during bulk delete:", error);
                    showToast("error", "Error", `Failed to perform bulk deletion: ${error.message}`);
                } finally {
                    setLoading(false);
                }
            },
            reject: () => {
                showToast("info", "Cancelled", "Bulk deletion cancelled.");
            }
        });
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex flex-row gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    severity="info"
                    tooltip="Edit"
                    tooltipOptions={{ position: 'left' }}
                    onClick={() => handleEditWorkOrder(rowData)}
                    disabled={loading}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    outlined
                    severity="danger"
                    tooltip="Delete"
                    tooltipOptions={{ position: 'right' }}
                    onClick={() => handleDeleteWorkOrder(rowData)}
                    disabled={loading}
                />
            </div>
        );
    };

    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Work Orders');

        const headers = columnOptionsForExport
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        myWorkRequests.forEach(wo => {
            const rowData = columnOptionsForExport
                .filter(col => col.visible)
                .map(col => {
                    if (col.field === 'machine.name') {
                        return wo.machine?.name || 'N/A';
                    } else if (col.field.includes('_at')) {
                        return wo[col.field] ? new Date(wo[col.field]).toLocaleString("id-ID") : "N/A";
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

    const exportPdf = (config = null) => {
        const currentConfig = config || printConfig;

        const doc = new jsPDF({
            orientation: currentConfig.orientation,
            unit: currentConfig.unit,
            format: currentConfig.format
        });

        const visibleColumns = columnOptionsForExport.filter(col => col.visible);

        const headers = visibleColumns.map(col => col.header);
        const data = myWorkRequests.map(wo => {
            return visibleColumns.map(col => {
                if (col.field === 'machine.name') {
                    return wo.machine?.name || 'N/A';
                } else if (col.field.includes('_at')) {
                    return wo[col.field] ? new Date(wo[col.field]).toLocaleString("id-ID") : "N/A";
                } else if (col.field === 'status') {
                    return statusMapForExport[wo.status] || wo.status;
                } else {
                    return wo[col.field];
                }
            });
        });

        doc.text('Laporan Work Order Karyawan', currentConfig.marginLeft, currentConfig.marginTop);

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
        showToast("success", "Ekspor Berhasil", "Laporan berhasil dibuat dalam format PDF.");
    };

    const handlePrint = () => {
        setAdjustDialog(true);
    };

    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        setAdjustDialog(false);
        exportPdf(newConfig);
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
                        title: item.judul_isu || item.issue_title || item.title,
                        description: item.deskripsi || item.description,
                        machine_id: item.id_mesin || item.machine_id,
                        priority: item.prioritas || item.priority || 'medium',
                        status: 'open',
                    };

                    const res = await fetch('/api/employee/issues', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                        const body = await res.json();
                        throw new Error(body.message || `Gagal mengimpor item: ${item.title || 'Tidak diketahui'}`);
                    }
                }

                showToast("success", "Impor Berhasil", "Data berhasil diimpor.");
                await fetchMyWorkRequests();
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


    useEffect(() => {
        fetchMyWorkRequests();
        fetchMachines();
    }, [fetchMyWorkRequests, fetchMachines]);

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" className="opacity-90" />
            <ConfirmDialog />

            <div className="card">
                <h3>Halaman Work Order Saya</h3>

                <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <Button size="small" label="Buat Permintaan Baru" icon="pi pi-plus" outlined severity="success" onClick={() => setAddWorkOrderDialogVisible(true)} />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Impor"
                        icon="pi pi-file-import"
                        outlined
                        onClick={() => fileInputRef.current?.click()}
                        tooltip="Impor dari Excel"
                        tooltipOptions={{ position: 'bottom' }}
                        disabled={loading}
                    />
                    <Button
                        size="small"
                        label="Ekspor"
                        icon="pi pi-file-export"
                        outlined
                        onClick={exportExcel}
                        tooltip="Ekspor ke Excel"
                        tooltipOptions={{ position: 'bottom' }}
                        disabled={loading}
                    />
                    <Button
                        size="small"
                        label="Cetak"
                        icon="pi pi-print"
                        outlined
                        onClick={handlePrint}
                        tooltip="Cetak Laporan PDF"
                        tooltipOptions={{ position: 'bottom' }}
                        disabled={loading}
                    />
                    <Divider layout="vertical" />
                    <Button size="small" label="Hapus Terpilih" icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedRequests.length === 0 || loading} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchMyWorkRequests} disabled={loadingWorkRequests || loading} />
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
                    <Panel header="Daftar Permintaan Work Order Saya">
                        {loadingWorkRequests ? (
                            <div className="flex justify-content-center py-6">
                                <ProgressSpinner />
                            </div>
                        ) : (
                            <DataTable
                                value={filteredData}
                                selection={selectedRequests}
                                onSelectionChange={(e) => setSelectedRequests(e.value)}
                                dataKey="id"
                                paginator
                                rows={10}
                                loading={loadingWorkRequests}
                                emptyMessage="Anda belum mengirim permintaan work order."
                                className="border-round-lg"
                                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} permintaan"
                                rowsPerPageOptions={[5, 10, 25]}
                                header={
                                    <div className="flex align-items-center justify-content-between gap-2">
                                        <div>
                                            <span className="text-xl font-bold mr-3">Permintaan Work Order</span>
                                            <Dropdown placeholder="Filter Status" value={statusFilter} options={["", "open", "in_progress", "resolved", "closed"]} onChange={(e) => setStatusFilter(e.value)} />
                                        </div>
                                        <InputText placeholder="Cari" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                                    </div>
                                }
                            >
                                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                                <Column
                                    field="title"
                                    header="Judul Isu"
                                    style={{ width: "200px" }}
                                    body={(rowData) => (
                                        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                                            {rowData.title}
                                        </motion.div>
                                    )}
                                />
                                <Column
                                    field="description"
                                    header="Deskripsi"
                                    body={(rowData) => (
                                        <>
                                            <Tooltip target={`.description-tooltip-${rowData.id}`} position="bottom" />
                                            <span
                                                className={`description-tooltip-${rowData.id}`}
                                                data-pr-tooltip={rowData.description}
                                                style={{
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "block",
                                                    maxWidth: "200px"
                                                }}
                                            >
                                                {rowData.description}
                                            </span>
                                        </>
                                    )}
                                />
                                <Column field="machine.name" header="Mesin" body={(rowData) => <Tag value={rowData.machine?.name} className="bg-gray-100 text-gray-800 font-medium" />} />
                                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                                <Column header="Foto" body={photoBodyTemplate} />
                                <Column field="created_at" header="Dikirim" body={dateBodyTemplate} />
                                <Column header="Aksi" body={actionBodyTemplate} alignFrozen="right" frozen />
                            </DataTable>
                        )}
                    </Panel>
                </motion.div>

                <WorkOrderAddModal
                    visible={addWorkOrderDialogVisible}
                    onHide={() => setAddWorkOrderDialogVisible(false)}
                    machines={machines}
                    onAddSuccess={() => {
                        showToast("success", "Berhasil", "Permintaan work order berhasil dibuat.");
                        fetchMyWorkRequests();
                    }}
                    showToast={showToast}
                />

                <WorkOrderEditModal
                    visible={editWorkOrderDialogVisible}
                    onHide={() => {
                        setEditWorkOrderDialogVisible(false);
                        setSelectedWorkOrder(null);
                    }}
                    workOrder={selectedWorkOrder}
                    machines={machines}
                    onUpdateSuccess={() => {
                        showToast("success", "Berhasil", "Permintaan work order berhasil diperbarui.");
                        fetchMyWorkRequests();
                    }}
                    showToast={showToast}
                />

                <ConfirmDeleteDialog
                    visible={deleteWorkOrderDialogVisible}
                    onHide={() => setDeleteWorkOrderDialogVisible(false)}
                    workOrder={selectedWorkOrder}
                    onDeleted={onWorkOrderDeleted}
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
                    key={adjustDialog ? 'open' : 'closed'}
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
                    header="Pratinjau Laporan PDF"
                >
                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                </Dialog>

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
        </div>
    );
};

export default WorkOrderPage;
