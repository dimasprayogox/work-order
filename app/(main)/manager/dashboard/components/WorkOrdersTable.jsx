import React, { useState, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { motion } from "framer-motion";

const WorkOrdersTable = ({ workOrders, getStatusStyle, technicians }) => {
    const [woStatusFilter, setWoStatusFilter] = useState("");
    const [woSearchText, setSearchText] = useState("");

    const woStatusOptions = [
        { label: "Semua Status", value: "" },
        { label: "Pending", value: "pending" },
        { label: "In Progress", value: "in_progress" },
        { label: "COmpleted", value: "completed" }
    ];

    // Calculate technician workload
    const technicianWorkload = useMemo(() => {
        const workload = technicians.map((tech) => {
            const assignedWorkOrders = workOrders.filter((wo) => wo.assignedTo && wo.assignedTo.id === tech.id);

            const activeWorkOrders = assignedWorkOrders.filter((wo) => wo.status !== "completed");

            return {
                ...tech,
                totalAssignments: assignedWorkOrders.length,
                activeAssignments: activeWorkOrders.length,
                completedAssignments: assignedWorkOrders.filter((wo) => wo.status === "completed").length
            };
        });

        // Sort by active assignments (busiest first)
        return workload.sort((a, b) => b.activeAssignments - a.activeAssignments);
    }, [technicians, workOrders]);

    const statusBodyTemplate = (rowData) => {
        const config = getStatusStyle(rowData.status);

        const customStyle = {
            backgroundColor: config.color,
            color: "white",
            borderRadius: "0.5rem",
            padding: "0.25rem 0.75rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
        };

        return (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} whileHover={{ scale: 1.05 }}>
                <div style={customStyle}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{config.label}</span>
                </div>
            </motion.div>
        );
    };

    const machineOrAssetBodyTemplate = (rowData) => {
        // First check work order direct relations
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

        // Then check issue relations
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

    const dateBodyTemplate = (field) => (rowData) => {
        if (!rowData[field]) return "N/A";
        return new Date(rowData[field]).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const filteredWorkOrders = workOrders.filter((wo) => {
        const matchesStatus = !woStatusFilter || wo.status === woStatusFilter;
        const matchesSearch = !woSearchText || wo.title.toLowerCase().includes(woSearchText.toLowerCase()) || (wo.description && wo.description.toLowerCase().includes(woSearchText.toLowerCase()));

        // hanya tampilkan WO yang belum ada assignment
        const matchesAssignment = !wo.assignedTo;

        return matchesStatus && matchesSearch && matchesAssignment;
    });

    // Technician workload template
    const workloadBodyTemplate = (rowData) => {
        return (
            <div className="flex flex-column gap-1">
                <div className="flex align-items-center gap-2">
                    <span className="font-semibold text-blue-600">{rowData.activeAssignments}</span>
                    <span className="text-sm">Work Order Now</span>
                </div>
            </div>
        );
    };

    // Technician status template (available/busy)
    const availabilityBodyTemplate = (rowData) => {
        const isAvailable = rowData.activeAssignments === 0;

        return <Tag value={isAvailable ? "Available" : "Busy"} severity={isAvailable ? "success" : "warning"} icon={isAvailable ? "pi pi-check-circle" : "pi pi-clock"} />;
    };

    return (
        <div className="grid mt-4">
            <div className="col-12">
                {/* Technician Workload Table */}
                <div className="card overflow-hidden mb-4">
                    <h5 className="font-bold mb-4">Technician Workload</h5>
                    <DataTable
                        value={technicianWorkload}
                        className="border-round-lg"
                        emptyMessage="No technicians found"
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginator
                        rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Displays {first} to {last} of {totalRecords} Technicians"
                    >
                        <Column field="full_name" header="Technician" sortable />
                        <Column header="Workload" body={workloadBodyTemplate} sortable sortField="activeAssignments" />
                        <Column header="Availability" body={availabilityBodyTemplate} sortable />
                    </DataTable>
                </div>

                {/* Unassigned Work Orders Table */}
                <div className="card overflow-hidden">
                    <h5 className="font-bold mb-4">Unassigned Work Orders</h5>

                    <DataTable
                        value={filteredWorkOrders}
                        className="border-round-lg"
                        emptyMessage="Tidak ada work order ditemukan"
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginator
                        rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Displays {first} to {last} of {totalRecords} Work Orders"
                    >
                        <Column
                            field="title"
                            header="Title"
                            sortable
                            body={(rowData) => (
                                <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                                    {rowData.title}
                                </motion.div>
                            )}
                        />
                        <Column field="target" header="Machine/Asset" body={machineOrAssetBodyTemplate} style={{ minWidth: "180px" }} sortable />
                        <Column field="scheduled_date" header="Schedule" body={dateBodyTemplate("scheduled_date")} style={{ minWidth: "160px" }} sortable />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default WorkOrdersTable;
