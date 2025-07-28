"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Accordion, AccordionTab } from "primereact/accordion";
import Link from "next/link";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";
import { motion } from "framer-motion";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import WorkOrderEditModal from "./components/WorkOrderEditModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

const statusBodyTemplate = (rowData) => {
    const getStatusSeverity = (status) => {
        switch (status) {
            case "open":
                return "danger";
            case "in_progress":
                return "info";
            case "resolved":
                return "success";
            case "closed":
                return "secondary";
            default:
                return "warning";
        }
    };

    const formattedStatus = rowData.status ? rowData.status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "";

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

const WorkOrderPage = () => {
    const toast = useRef(null);
    const [addWorkOrderDialogVisible, setAddWorkOrderDialogVisible] = useState(false);
    const [editWorkOrderDialogVisible, setEditWorkOrderDialogVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingWorkRequests, setLoadingWorkRequests] = useState(true);
    const [myWorkRequests, setMyWorkRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [machines, setMachines] = useState([]);

    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const [continent, setContinent] = useState([]);

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
            const response = await fetch(`${API_BASE_URL}/employee/issues`, {
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
            const response = await fetch(`${API_BASE_URL}/machines`, {
                method: "GET",
                credentials: "include"
            });
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

    const getContinent = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/continents`, { method: "GET" });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();
            setContinent(data);
        } catch (err) {
            console.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = myWorkRequests.filter((item) => {
        const matchesStatus = status === "" || item.status.toLowerCase() === status.toLowerCase();
        const matchesSearch = search === "" || item.title.toLowerCase().includes(search.toLowerCase()) || (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const handleEditWorkOrder = (rowData) => {
        setSelectedWorkOrder(rowData);
        setEditWorkOrderDialogVisible(true);
    };

    const handleDeleteWorkOrder = (rowData) => {
        confirmDialog({
            message: `Are you sure you want to delete the work order "${rowData.title}"?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/employee/issues/${rowData.id}`, {
                        method: "DELETE",
                        credentials: "include"
                    });

                    if (!response.ok) {
                        const errorResult = await response.json();
                        throw new Error(errorResult.message || "Failed to delete work order.");
                    }

                    showToast("success", "Deleted", `Work order "${rowData.title}" has been deleted.`);
                    fetchMyWorkRequests();
                } catch (error) {
                    console.error("Error deleting work order:", error);
                    showToast("error", "Error", `Failed to delete work order: ${error.message}`);
                }
            },
            reject: () => {
                showToast("info", "Cancelled", "Work order deletion cancelled.");
            }
        });
    };

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
                try {
                    const deletePromises = selectedRequests.map(request =>
                        fetch(`${API_BASE_URL}/employee/issues/${request.id}`, {
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
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    outlined
                    severity="danger"
                    tooltip="Delete"
                    tooltipOptions={{ position: 'right' }}
                    onClick={() => handleDeleteWorkOrder(rowData)}
                />
            </div>
        );
    };

    useEffect(() => {
        fetchMyWorkRequests();
        fetchMachines();
        getContinent();
    }, [fetchMyWorkRequests, fetchMachines]);

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" className="opacity-90" />
            <ConfirmDialog />

            <div className="card">
                <h3>Work Order Page</h3>

                <div className="flex flex-row gap-2">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button size="small" label="New" icon="pi pi-plus" outlined severity="success" onClick={() => setAddWorkOrderDialogVisible(true)} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined />
                    <Button size="small" label="Print" icon="pi pi-print" outlined />
                    <Divider layout="vertical" />
                    <Button size="small" label="Delete" icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedRequests.length === 0} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchMyWorkRequests} />
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
                                emptyMessage="You haven't submitted any work requests yet."
                                className="border-round-lg"
                                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requests"
                                rowsPerPageOptions={[5, 10, 25]}
                                header={
                                    <div className="flex align-items-center justify-content-between gap-2">
                                        <div>
                                            <span className="text-xl font-bold mr-3">Work Requests</span>
                                            <Dropdown placeholder="Filter Status" value={status} options={["", "open", "in_progress", "resolved", "closed"]} onChange={(e) => setStatus(e.value)} />
                                        </div>
                                        <InputText placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
                                    </div>
                                }
                            >
                                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                                <Column
                                    field="title"
                                    header="Issue Title"
                                    style={{ width: "200px" }}
                                    body={(rowData) => (
                                        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                                            {rowData.title}
                                        </motion.div>
                                    )}
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
                                                    whiteWhiteSpace: "nowrap",
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
                                <Column field="created_at" header="Submitted" body={dateBodyTemplate} />
                                <Column header="Actions" body={actionBodyTemplate} alignFrozen="right" frozen />
                            </DataTable>
                        )}
                    </Panel>
                </motion.div>

                <Dialog
                    header="Pick a site for work order"
                    visible={addWorkOrderDialogVisible}
                    style={{ width: "50vw" }}
                    onHide={() => {
                        if (!addWorkOrderDialogVisible) return;
                        setAddWorkOrderDialogVisible(false);
                    }}
                >
                    <Accordion activeIndex={activeIndex}>
                        {continent.map((item, index) => (
                            <AccordionTab key={index} header={item.continent}>
                                <ul className="list-disc pl-4">
                                    {item.cities.map((city, idx) => (
                                        <li key={idx}>
                                            <Link href={`/employee/work-orders/request/add?city=${city}`}>{city}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionTab>
                        ))}
                    </Accordion>
                </Dialog>

                <WorkOrderEditModal
                    visible={editWorkOrderDialogVisible}
                    onHide={() => {
                        setEditWorkOrderDialogVisible(false);
                        setSelectedWorkOrder(null);
                    }}
                    workOrder={selectedWorkOrder}
                    machines={machines}
                    onUpdateSuccess={() => {
                        showToast("success", "Success", "Work order updated successfully.");
                        fetchMyWorkRequests();
                    }}
                    showToast={showToast}
                />
            </div>
        </div>
    );
};

export default WorkOrderPage;