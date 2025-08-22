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

const WorkOrderTable = ({ workOrders, loading, searchText, onUpdate, onView, setSearchText, statusFilter, setStatusFilter }) => {
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

    const repairableBodyTemplate = (rowData) => {
        // Show repairable status for all work orders that have this information
        // Handle both boolean and integer values from different environments
        let val = null;
        
        if (typeof rowData.repairable === 'boolean') {
            val = rowData.repairable;
        } else if (rowData.repairable === 1 || rowData.repairable === '1') {
            val = true;
        } else if (rowData.repairable === 0 || rowData.repairable === '0') {
            val = false;
        } else if (typeof rowData.issue?.repairable === 'boolean') {
            val = rowData.issue.repairable;
        } else if (rowData.issue?.repairable === 1 || rowData.issue?.repairable === '1') {
            val = true;
        } else if (rowData.issue?.repairable === 0 || rowData.issue?.repairable === '0') {
            val = false;
        }

        const config = val === true
            ? { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check' , label: 'Repairable'}
            : val === false
                ? { bgColor: 'bg-red-100', textColor: 'text-red-800', icon: 'pi-times-circle', label: 'Not Repairable'}
                : { bgColor: 'bg-gray-100', textColor: 'text-gray-600', icon: 'pi-minus', label: 'N/A'};

        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{config.label}</span>
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
        // WorkOrder may not have a direct photo_url but its related issue can
        const src = rowData.photo_url || rowData.issue?.photo_url || null;
        if (src) {
            return (
                <Image
                    src={src}
                    alt={rowData.title || 'Work Order Photo'}
                    width="50"
                    height="50"
                    preview
                    className="border-round"
                    onError={(e) => {
                        // PrimeReact Image forwards the native event; guard for target
                        const target = e?.target || e;
                        if (target) {
                            target.onerror = null;
                            target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                        }
                    }}
                />
            );
        }

        return <span className="text-gray-400">No photo</span>;
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-eye" rounded outlined className="p-button-sm" onClick={() => onView && onView(rowData)} tooltip="View" />
            <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onUpdate(rowData)} tooltip="Update" />
        </div>
    );

    const machineOrAssetBodyTemplate = (rowData) => {
        // Helper to pick common name/code keys used in different responses
        const getName = (entity) => {
            if (!entity) return null;
            return entity.name || entity.title || entity.machine_name || entity.asset_name || entity.display_name || null;
        };
        const getCode = (entity) => {
            if (!entity) return null;
            return entity.machine_code || entity.asset_code || entity.code || null;
        };

        const machine = rowData.machine || rowData.issue?.machine || null;
        const asset = rowData.asset || rowData.issue?.asset || null;

        if (machine) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-cog text-blue-500"></i>
                        {getName(machine) || 'Unnamed Machine'}
                    </div>
                    {getCode(machine) && <div className="text-sm text-gray-500">{getCode(machine)}</div>}
                    <div className="text-xs text-blue-600">Machine{rowData.issue && !rowData.machine ? ' (from Issue)' : ''}</div>
                </div>
            );
        }

        if (asset) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-box text-green-500"></i>
                        {getName(asset) || 'Unnamed Asset'}
                    </div>
                    {getCode(asset) && <div className="text-sm text-gray-500">{getCode(asset)}</div>}
                    <div className="text-xs text-green-600">Asset{rowData.issue && !rowData.asset ? ' (from Issue)' : ''}</div>
                </div>
            );
        }

        return <span className="text-gray-500">N/A</span>;
    };


    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Work Order List</span>
            </div>
            <div className="flex align-items-center gap-3">
                <Dropdown value={statusFilter} options={statusFilterOptions} onChange={onStatusFilterChange} placeholder="All Status" className="w-full md:w-auto" />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText value={searchText} onChange={onGlobalFilterChange} placeholder="Search" className="w-full md:w-auto" />
                </span>
            </div>
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
                <Column header="Repairable" body={repairableBodyTemplate} style={{ width: '150px', textAlign: 'center' }} />
                <Column header="Actions" body={actionBodyTemplate} style={{ width: "6rem", textAlign: "center" }} />
            </DataTable>
        </div>
    );
};

export default WorkOrderTable;
