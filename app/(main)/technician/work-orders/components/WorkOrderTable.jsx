"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { Dropdown } from "primereact/dropdown";
import { Image } from "primereact/image";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";

const statusFilterOptions = [
    { label: "All Statuses", value: null },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Resolved", value: "resolved" },
    { label: "Completed", value: "completed" }
];

const WorkOrderTable = ({ workOrders, loading, searchText, onUpdate, setSearchText, statusFilter, setStatusFilter }) => {
    const [filteredWorkOrders, setFilteredWorkOrders] = useState([]);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS }
    });

    // Apply filters whenever workOrders, searchText, or statusFilter changes
    useEffect(() => {
        const applyFilters = () => {
            let result = [...workOrders];

            // Apply status filter first
            if (statusFilter) {
                result = result.filter((item) => item.status === statusFilter);
            }

            // Then apply global search
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                result = result.filter((item) => {
                    // Check all relevant fields for search
                    const searchFields = [
                        item.title,
                        item.description,
                        item.priority,
                        item.status,
                        item.notes,
                        item.machine?.name,
                        item.machine?.machine_code,
                        item.asset?.name,
                        item.asset?.asset_code,
                        item.issue?.machine?.name,
                        item.issue?.machine?.machine_code,
                        item.issue?.asset?.name,
                        item.issue?.asset?.asset_code
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return searchFields.includes(searchLower);
                });
            }

            setFilteredWorkOrders(result);
        };

        applyFilters();
    }, [workOrders, searchText, statusFilter]);

    const onGlobalFilterChange = (e) => {
        setSearchText(e.target.value);
    };

    const onStatusFilterChange = (e) => {
        setStatusFilter(e.value);
    };

    const priorityBodyTemplate = (rowData) => {
        const priority = rowData.priority || "";
        const severityMap = {
            high: "danger",
            medium: "warning",
            low: "success"
        };
        const displayValue = priority.charAt(0).toUpperCase() + priority.slice(1);
        const severity = severityMap[priority.toLowerCase()] || "info";
        return <Tag value={displayValue} severity={severity} />;
    };

    const partRequestStatusBodyTemplate = (rowData) => {
        const partRequests = rowData.partRequests;

        if (!partRequests || partRequests.length === 0) {
            return (
                <div className="flex flex-column align-items-center gap-2 text-center">
                    <span className="text-sm text-gray-500">Belum ada request part</span>
                </div>
            );
        }

        const statusSeverityMap = {
            pending: "warning",
            approved: "info",
            fulfilled: "success",
            rejected: "danger"
        };

        return (
            <div className="flex flex-column align-items-start gap-1">
                {partRequests.map((req) => (
                    <Tag key={req.id} value={req.status.charAt(0).toUpperCase() + req.status.slice(1)} severity={statusSeverityMap[req.status.toLowerCase()] || "info"} className="text-xs" />
                ))}
            </div>
        );
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            pending: "Pending",
            in_progress: "In Progress",
            completed: "Completed",
            rejected: "Rejected"
        };
        return statusMap[status] || status;
    };

    const statusBodyTemplate = (rowData) => {
        const statusConfig = {
            pending: { bgColor: "bg-orange-100", textColor: "text-orange-800", icon: "pi-clock" },
            in_progress: { bgColor: "bg-cyan-100", textColor: "text-cyan-800", icon: "pi-spin pi-spinner" },
            completed: { bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" },
            rejected: { bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi-times-circle" }
        };
        const config = statusConfig[rowData.status] || { bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi-question" };
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
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const photoBodyTemplate = (rowData) => {
        if (rowData.photo_url) {
            return (
                <Image
                    src={rowData.photo_url}
                    alt="Work Order Photo"
                    width="50"
                    height="50"
                    preview
                    className="border-round"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                    }}
                />
            );
        }
        return <span className="text-gray-400">No photo</span>;
    };

    const actionBodyTemplate = (rowData) => <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onUpdate(rowData)} />;

    const machineOrAssetBodyTemplate = (rowData) => {
        if (rowData.machine) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-cog text-blue-500"></i>
                        {rowData.machine.name}
                    </div>
                    {rowData.machine.machine_code && <div className="text-sm text-gray-500">{rowData.machine.machine_code}</div>}
                    <div className="text-xs text-blue-600">Machine</div>
                </div>
            );
        }

        if (rowData.asset) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-box text-green-500"></i>
                        {rowData.asset.name}
                    </div>
                    {rowData.asset.asset_code && <div className="text-sm text-gray-500">{rowData.asset.asset_code}</div>}
                    <div className="text-xs text-green-600">Asset</div>
                </div>
            );
        }

        if (rowData.issue) {
            if (rowData.issue.machine) {
                return (
                    <div>
                        <div className="font-medium flex align-items-center gap-2">
                            <i className="pi pi-cog text-blue-500"></i>
                            {rowData.issue.machine.name}
                        </div>
                        {rowData.issue.machine.machine_code && <div className="text-sm text-gray-500">{rowData.issue.machine.machine_code}</div>}
                        <div className="text-xs text-blue-600">Machine (from Issue)</div>
                    </div>
                );
            }

            if (rowData.issue.asset) {
                return (
                    <div>
                        <div className="font-medium flex align-items-center gap-2">
                            <i className="pi pi-box text-green-500"></i>
                            {rowData.issue.asset.name}
                        </div>
                        {rowData.issue.asset.asset_code && <div className="text-sm text-gray-500">{rowData.issue.asset.asset_code}</div>}
                        <div className="text-xs text-green-600">Asset (from Issue)</div>
                    </div>
                );
            }
        }

        return <span className="text-gray-500">N/A</span>;
    };

    
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Work Order List</span>
                <Dropdown value={statusFilter} options={statusFilterOptions} onChange={onStatusFilterChange} placeholder="All Status" className="w-full md:w-auto" />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={searchText} onChange={onGlobalFilterChange} placeholder="Search" className="w-full md:w-auto" />
            </span>
        </div>
    );

    return (
        <div>
            <DataTable value={filteredWorkOrders} loading={loading} dataKey="id" paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} header={header} emptyMessage="No work orders found.">
                <Column header="Photo" body={photoBodyTemplate} />
                <Column field="title" header="Title" sortable />
                <Column field="target" header="Machine/Asset" body={machineOrAssetBodyTemplate} style={{ minWidth: "180px" }} sortable />
                <Column field="description" header="Description" style={{ minWidth: "200px" }} />
                <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column header="Part Request" body={partRequestStatusBodyTemplate} style={{ width: "180px" }} />
                <Column field="scheduled_date" header="Schedule" body={(rowData) => dateBodyTemplate(rowData.created_at)} sortable />
                <Column field="started_at" header="Started At" body={(rowData) => dateBodyTemplate(rowData.started_at)} sortable />
                <Column field="completed_at" header="Completed At" body={(rowData) => dateBodyTemplate(rowData.completed_at)} sortable />
                <Column field="notes" header="Notes" style={{ maxWidth: "200px" }} />
                <Column header="Actions" body={actionBodyTemplate} style={{ width: "6rem", textAlign: "center" }} />
            </DataTable>
        </div>
    );
};

export default WorkOrderTable;
