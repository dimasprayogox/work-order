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
import { Tooltip } from "primereact/tooltip";

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
   const partRequestBodyTemplate = (rowData) => {
       const { partRequests } = rowData;

       // 1. Filter partRequests untuk hanya mengambil yang statusnya 'fulfilled'
       const fulfilledRequests = partRequests?.filter((request) => request.status === "fulfilled");

        if (!fulfilledRequests || fulfilledRequests.length === 0) {
            return <span className="text-sm text-gray-500">No part request</span>;
        }

       // 3. Mengumpulkan semua 'items' dari request yang sudah difilter
       const allItems = fulfilledRequests.flatMap((request) => request.items || []);

       // 4. Jika tidak ada item sama sekali setelah digabungkan, jangan tampilkan apapun
       if (allItems.length === 0) {
           return null;
       }

       return (
           <div className="flex flex-column align-items-start gap-1">
               {allItems.map((item) => {
                   // Pastikan item dan part di dalamnya ada sebelum dirender
                   if (item && item.part) {
                       return (
                           <div key={item.id} className="flex align-items-center gap-2 text-xs p-1 bg-gray-100 border-round">
                               <i className="pi pi-wrench text-gray-600"></i>

                               {/* Menampilkan nama part */}
                               <span className="font-medium">{item.part.name || "Unknown Part"}</span>

                               {/* Menampilkan kuantitas (prioritaskan yg disetujui, fallback ke yg diminta) */}
                               <span className="text-gray-500">(x{item.quantity_approved ?? item.quantity_requested})</span>
                           </div>
                       );
                   }
                   return null; // Jangan render apapun jika data item/part tidak lengkap
               })}
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
        const statusMap = {
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
            completed: { label: "Completed", color: "bg-green-100 text-green-800" },
            rejected: { label: "Rejected", color: "bg-red-100 text-red-800" }
        };
        const status = statusMap[rowData.status] || { label: rowData.status, color: "bg-gray-100 text-gray-800" };
        return <Tag value={status.label} className={status.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
    };

    const repairableBodyTemplate = (rowData) => {
        // Show repairable status for all work orders that have this information
        // Handle both boolean and integer values from different environments
        let val = null;

        if (typeof rowData.repairable === "boolean") {
            val = rowData.repairable;
        } else if (rowData.repairable === 1 || rowData.repairable === "1") {
            val = true;
        } else if (rowData.repairable === 0 || rowData.repairable === "0") {
            val = false;
        } else if (typeof rowData.issue?.repairable === "boolean") {
            val = rowData.issue.repairable;
        } else if (rowData.issue?.repairable === 1 || rowData.issue?.repairable === "1") {
            val = true;
        } else if (rowData.issue?.repairable === 0 || rowData.issue?.repairable === "0") {
            val = false;
        }

        const config =
            val === true
                ? { bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check", label: "Repairable" }
                : val === false
                ? { bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi-times-circle", label: "Not Repairable" }
                : { bgColor: "bg-gray-100", textColor: "text-gray-600", icon: "pi-minus", label: "N/A" };

        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{config.label}</span>
                </div>
            </motion.div>
        );
    };

    const photoBodyTemplate = (rowData) => {
        // WorkOrder may not have a direct photo_url but its related issue can
        const src = rowData.photo_url || rowData.issue?.photo_url || null;
        if (src) {
            return (
                <Image
                    src={src}
                    alt={rowData.title || "Work Order Photo"}
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
                        {getName(machine) || "Unnamed Machine"}
                    </div>
                    {getCode(machine) && <div className="text-sm text-gray-500">{getCode(machine)}</div>}
                    <div className="text-xs text-blue-600">Machine{rowData.issue && !rowData.machine ? " (from Issue)" : ""}</div>
                </div>
            );
        }

        if (asset) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-box text-green-500"></i>
                        {getName(asset) || "Unnamed Asset"}
                    </div>
                    {getCode(asset) && <div className="text-sm text-gray-500">{getCode(asset)}</div>}
                    <div className="text-xs text-green-600">Asset{rowData.issue && !rowData.asset ? " (from Issue)" : ""}</div>
                </div>
            );
        }

        return <span className="text-gray-500">N/A</span>;
    };

    const titleBodyTemplate = (rowData) => (
        <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }} className="font-medium text-blue-600 cursor-pointer">
            {rowData.title}
        </motion.span>
    );

    const dateBodyTemplate = (field) => (rowData) => {
        if (!rowData[field]) return "N/A";
        return new Date(rowData[field]).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const scheduledDateBodyTemplate = (rowData) => {
        if (!rowData.scheduled_date) return "N/A";

        const scheduleDate = new Date(rowData.scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isOverdue = scheduleDate < today && rowData.status !== "completed";
        const isToday = scheduleDate.toDateString() === today.toDateString();

        return (
            <div className={`flex align-items-center gap-1 ${isOverdue ? "text-red-500" : isToday ? "text-blue-500" : ""}`}>
                <i className={`pi ${isOverdue ? "pi-exclamation-triangle" : isToday ? "pi-clock" : "pi-calendar"}`}></i>
                <span className={isOverdue ? "font-semibold" : ""}>
                    {scheduleDate.toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    })}
                </span>
            </div>
        );
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
            <DataTable
                value={filteredWorkOrders}
                loading={loading}
                dataKey="id"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                header={header}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Displays {first} to {last} of {totalRecords} Work Orders"
                emptyMessage="No work orders found."
            >
                <Column field="title" header="Title" sortable body={titleBodyTemplate} style={{ minWidth: "10rem" }} />
                <Column field="target" header="Machine/Asset" body={machineOrAssetBodyTemplate} style={{ minWidth: "180px" }} sortable />
                <Column header="Photo" body={photoBodyTemplate} />
                <Column
                    field="description"
                    header="Description"
                    sortable
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
                <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />

                <Column header="Requested Parts" body={partRequestBodyTemplate} style={{ minWidth: "200px" }} />
                <Column header="Schedule" body={scheduledDateBodyTemplate} style={{ minWidth: "145px" }} sortable sortField="scheduled_date" />
                <Column field="started_at" header="Started" body={dateBodyTemplate("started_at")} style={{ minWidth: "120px" }} sortable />
                <Column field="completed_at" header="Completed" body={dateBodyTemplate("completed_at")} style={{ minWidth: "120px" }} sortable />
                <Column
                    field="notes"
                    header="Notes"
                    sortable
                    body={(rowData) => (
                        <>
                            <Tooltip target={`.notes-tooltip-${rowData.id}`} position="bottom" />
                            <span
                                className={`notes-tooltip-${rowData.id}`}
                                data-pr-tooltip={rowData.notes}
                                style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block",
                                    maxWidth: "200px"
                                }}
                            >
                                {rowData.notes}
                            </span>
                        </>
                    )}
                />
                <Column header="Repairable" body={repairableBodyTemplate} style={{ width: "150px", textAlign: "center" }} />
                <Column header="Actions" body={actionBodyTemplate} style={{ width: "6rem", textAlign: "center" }} />
            </DataTable>
        </div>
    );
};

export default WorkOrderTable;
