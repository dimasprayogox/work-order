"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";
import { motion } from "framer-motion";
import { Dialog } from "primereact/dialog";
import NewRequestDialog from "./add/page";
import EditRequestDialog from "./edit/page";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "resolved" }
];

const statusBodyTemplate = (rowData) => {
    const getStatusSeverity = (status) => {
        switch (status) {
            case "open":
                return "danger";
            case "in_progress":
                return "info";
            case "resolved":
                return "success";
            default:
                return null;
        }
    };
    const statusDisplayMap = {
        open: "Pending",
        in_progress: "In Progress",
        resolved: "Completed"
    };

    const displayStatus = statusDisplayMap[rowData.status] || rowData.status;
    const formattedStatus = displayStatus.replace(/_/g, " ");

    return (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <Tag value={formattedStatus} severity={getStatusSeverity(rowData.status)} className="font-medium" />
        </motion.div>
    );
};

const photoBodyTemplate = (rowData) => {
    const handleImageClick = (url) => {
        console.log("Image clicked:", url);
    };

    if (rowData.photo_url) {
        return (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <img
                    src={rowData.photo_url}
                    alt="Issue Preview"
                    style={{ width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" }}
                    className="shadow-lg border-round transition-all hover:shadow-xl"
                    onClick={() => handleImageClick(rowData.photo_url)}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                    }}
                />
            </motion.div>
        );
    }
    return <img src="https://placehold.co/50x50/cccccc/000000?text=No+Image" alt="No photo" style={{ width: "50px", height: "50px", objectFit: "cover" }} className="shadow-lg border-round" />;
};

const dateBodyTemplate = (rowData) => {
    return rowData.created_at ? new Date(rowData.created_at).toLocaleString("id-ID") : "N/A";
};

const WorkRequestPage = () => {
    const toast = useRef(null);
    const [loadingWorkRequests, setLoadingWorkRequests] = useState(true);
    const [workRequests, setWorkRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [isNewRequestDialogVisible, setIsNewRequestDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isPreviewDialogVisible, setIsPreviewDialogVisible] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState("");

    const openImagePreview = (url) => {
        setSelectedImageUrl(url);
        setIsPreviewDialogVisible(true);
    };


    const photoBodyTemplate = (rowData) => {
        if (rowData.photo_url) {
            return (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <img
                        src={rowData.photo_url}
                        alt="Issue Preview"
                        style={{ width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" }}
                        className="shadow-lg border-round transition-all hover:shadow-xl"
                        onClick={() => openImagePreview(rowData.photo_url)} // REVISED: Added onClick handler
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                        }}
                    />
                </motion.div>
            );
        }
        return <img src="https://placehold.co/50x50/cccccc/000000?text=No+Image" alt="No photo" style={{ width: "50px", height: "50px", objectFit: "cover" }} className="shadow-lg border-round" />;
    };

    const showToast = useCallback((severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchWorkRequests = useCallback(async () => {
        setLoadingWorkRequests(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues/my-issues`, {
                method: "GET",
                credentials: "include"
            });
            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Failed to load work requests.";
                throw new Error(`Failed to load work requests: ${errorDetail}`);
            }
            setWorkRequests(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error("Error fetching work requests:", error);
            showToast("error", "Error", `${error.message}`);
            setWorkRequests([]);
        } finally {
            setLoadingWorkRequests(false);
        }
    }, [showToast]);

    const filteredData = workRequests.filter((request) => {
        const matchesStatus = !status || request.status === status;
        const matchesSearch = !search || request.title.toLowerCase().includes(search.toLowerCase()) || (request.description && request.description.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const openEditDialog = (rowData) => {
        setSelectedRequest(rowData);
        setEditDialogVisible(true);
    };


   const handleDelete = async (id) => {
       try {
           const response = await fetch(`${API_BASE_URL}/employee/issues/${id}`, {
               method: "DELETE",
               credentials: "include"
           });
           return response.ok;
       } catch (error) {
           console.error("Delete error:", error);
           return false;
       }
   };

    const deleteRequest = async (id) => {
        const success = await handleDelete(id);
        if (success) {
            showToast("success", "Success", "Request deleted successfully.");
            fetchWorkRequests(); // Refresh data
        } else {
            showToast("error", "Error", "Failed to delete the request.");
        }
    };

    // NEW FUNCTION: Handles bulk deletion logic
    const deleteSelectedRequests = async () => {
        const promises = selectedRequests.map((req) => handleDelete(req.id));
        const results = await Promise.all(promises);

        const failedDeletes = results.filter((res) => !res).length;

        if (failedDeletes > 0) {
            showToast("warn", "Partial Success", `${selectedRequests.length - failedDeletes} requests deleted. ${failedDeletes} failed.`);
        } else {
            showToast("success", "Success", "All selected requests have been deleted.");
        }

        fetchWorkRequests(); // Refresh data
        setSelectedRequests([]); // Clear selection
    };

    const confirmDelete = (rowData) => {
        confirmDialog({
            message: `Are you sure you want to delete "${rowData.title}"?`,
            header: "Confirm Deletion",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => deleteRequest(rowData.id), // FIXED: Call the new function
            reject: () => {}
        });
    };

    const handleDeleteSelected = () => {
        confirmDialog({
            message: `Are you sure you want to delete ${selectedRequests.length} selected ${selectedRequests.length > 1 ? "requests" : "request"}?`,
            header: "Confirm Deletion",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: deleteSelectedRequests, // FIXED: Call the new function
            reject: () => {}
        });
    };

   const actionBodyTemplate = (rowData) => (
       <div className="flex gap-2">
           <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => openEditDialog(rowData)} tooltip="Edit" tooltipOptions={{ position: "top" }} />
           <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => confirmDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: "top" }} />
       </div>
   );
    

    useEffect(() => {
        fetchWorkRequests();
    }, [fetchWorkRequests]);


    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" className="opacity-90" />
            <ConfirmDialog />

            <Dialog header="Pratinjau Gambar" visible={isPreviewDialogVisible} style={{ width: "min(90vw, 700px)" }} onHide={() => setIsPreviewDialogVisible(false)} modal className="border-round-lg" contentClassName="p-0">
                <img src={selectedImageUrl} alt="Pratinjau Isu" className="w-full h-auto border-round-bottom" style={{ maxHeight: "80vh", objectFit: "contain" }} />
            </Dialog>

            <div className="card">
                <h3>Work Request Page</h3>

                <div className="flex flex-row gap-2">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button size="small" label="New" icon="pi pi-plus" outlined severity="success" onClick={() => setIsNewRequestDialogVisible(true)} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined />
                    <Button size="small" label="Print" icon="pi pi-print" outlined />
                    <Divider layout="vertical" />
                    <Button size="small" label="Delete" icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedRequests.length === 0} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchWorkRequests} />
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
                    <Panel>
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
                                emptyMessage="No work requests found."
                                className="border-round-lg"
                                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requests"
                                rowsPerPageOptions={[5, 10, 25]}
                                header={
                                    <div className="flex align-items-center justify-content-between gap-2">
                                        <div>
                                            <span className="text-xl font-bold mr-3">Work Requests</span>
                                            <Dropdown placeholder="Filter Status" value={status} options={statusOptions} onChange={(e) => setStatus(e.value)} />
                                        </div>
                                        <InputText placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
                                    </div>
                                }
                            >
                                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                                <Column
                                    field="title"
                                    header="Title"
                                    style={{ width: "200px" }}
                                    body={(rowData) => (
                                        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                                            {rowData.title}
                                        </motion.div>
                                    )}
                                    sortable
                                />
                                <Column
                                    field="description"
                                    header="Description"
                                    body={(rowData) => (
                                        <>
                                            <Tooltip target=".description-tooltip" position="bottom" />
                                            <span
                                                className="description-tooltip"
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
                                <Column field="machine.name" header="Machine" body={(rowData) => <Tag value={rowData.machine?.name} className="bg-gray-100 text-gray-800 font-medium" />} />
                                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                                <Column header="Photo" body={photoBodyTemplate} />
                                <Column field="created_at" header="Submitted" body={dateBodyTemplate} sortable />
                                <Column header="Actions" body={actionBodyTemplate} exportable={false} style={{ minWidth: "8rem" }} />
                            </DataTable>
                        )}
                    </Panel>
                </motion.div>

                <NewRequestDialog visible={isNewRequestDialogVisible} onHide={() => setIsNewRequestDialogVisible(false)} fetchWorkRequests={fetchWorkRequests} showToast={showToast} />

                <EditRequestDialog visible={editDialogVisible} onHide={() => setEditDialogVisible(false)} request={selectedRequest} fetchWorkRequests={fetchWorkRequests} showToast={showToast} />

                <NewRequestDialog visible={isNewRequestDialogVisible} onHide={() => setIsNewRequestDialogVisible(false)} fetchWorkRequests={fetchWorkRequests} showToast={showToast} />
            </div>
        </div>
    );
};

export default WorkRequestPage;
