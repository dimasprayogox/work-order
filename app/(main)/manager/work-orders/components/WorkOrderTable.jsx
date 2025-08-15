"use client";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Image } from "primereact/image";
import { Tooltip } from "primereact/tooltip";

const statusFilterOptions = [
    { label: "All Status", value: null },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" }
];

const WorkOrderTable = ({ workOrders, selectedWorkOrders, setSelectedWorkOrders, loading, onDelete, searchText, setSearchText, statusFilter, setStatusFilter, handleViewDetails, handleAssignTechnician, onAssign, onReassign, onUnassign }) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [selectAll, setSelectAll] = useState(false);
    const [currentFirst, setCurrentFirst] = useState(0);
    const [currentRows, setCurrentRows] = useState(10);

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        setFilters((prevFilters) => ({
            ...prevFilters,
            global: { value, matchMode: FilterMatchMode.CONTAINS }
        }));
    };

    const onStatusFilterChange = (e) => {
        const value = e.value;
        setStatusFilter(value);
        setFilters((prevFilters) => ({
            ...prevFilters,
            status: { value, matchMode: FilterMatchMode.EQUALS }
        }));
    };

    const handleSelectAllChange = (e) => {
        const checked = e.checked;

        // Filter data according to global filter and status filter
        let filteredData = workOrders;

        // Apply global filter if exists
        if (filters.global.value) {
            const filterValue = filters.global.value.toLowerCase();
            filteredData = filteredData.filter((wo) => wo.title?.toLowerCase().includes(filterValue) || wo.machine?.name?.toLowerCase().includes(filterValue) || wo.description?.toLowerCase().includes(filterValue));
        }

        // Apply status filter if exists
        if (filters.status.value) {
            filteredData = filteredData.filter((wo) => wo.status === filters.status.value);
        }

        // Get currently visible data on the page
        const visibleData = filteredData.slice(currentFirst, currentFirst + currentRows);
        const selected = checked ? visibleData : [];

        setSelectAll(checked);
        setSelectedWorkOrders(selected);
    };

    const onPageChange = (e) => {
        setCurrentFirst(e.first);
        setCurrentRows(e.rows);
    };

    const Header = (
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

    const titleBodyTemplate = (rowData) => (
        <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }} className="font-medium text-blue-600 cursor-pointer">
            {rowData.title}
        </motion.span>
    );

    const photoBodyTemplate = (rowData) => {
        const photoUrl = rowData.issue?.photo_url;
        if (photoUrl) {
            return (
                <Image
                    src={photoUrl}
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

    const priorityBodyTemplate = (rowData) => {
        let severity = "";
        switch (rowData.priority) {
            case "low":
                severity = "success";
                break;
            case "medium":
                severity = "warning";
                break;
            case "high":
                severity = "danger";
                break;
            default:
                severity = "info";
                break;
        }
        return <Tag value={rowData.priority} severity={severity} style={{ minWidth: "50px", display: "inline-flex", justifyContent: "center" }} />;
    };

    const statusBodyTemplate = (rowData) => {
        const statusMap = {
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            in_progress: { label: "In_Progress", color: "bg-blue-100 text-blue-800" },
            completed: { label: "Completed", color: "bg-green-100 text-green-800" }
        };
        const status = statusMap[rowData.status] || { label: rowData.status, color: "bg-gray-100 text-gray-800" };
        return <Tag value={status.label} className={status.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
    };

    const technicianBodyTemplate = (rowData) => {
        if (!rowData.assignedTo) {
            return <Tag value="Not Assigned" className="bg-red-100 text-red-800" />;
        }

        return (
            <div className="flex flex-col gap-1">
                <Tag value={rowData.assignedTo.full_name} className="bg-green-100 text-green-800" style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />
                {rowData.assignedTo.current_workload !== undefined && (
                    <Tag
                        value={`${rowData.assignedTo.current_workload} tasks`}
                        className={`
                text-xs py-0.5
                ${rowData.assignedTo.current_workload >= 5 ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}
            `}
                        style={{ minWidth: "50px", display: "inline-flex", justifyContent: "center" }}
                    />
                )}
            </div>
        );
    };

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

    const actionBodyTemplate = (rowData) => {
        const canAssign = !rowData.assigned_to_id && rowData.status !== "completed";
        const canReassign = rowData.assigned_to_id && rowData.status !== "completed" && rowData.status !== "in_progress";
        const canUnassign = rowData.assigned_to_id && rowData.status !== "completed" && rowData.status !== "in_progress";

        const handleUnassignClick = () => {
            confirmDialog({
                message: `Apakah Anda yakin ingin membatalkan assignment work order "${rowData.title}"?`,
                header: "Konfirmasi Unassign",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                accept: () => onUnassign(rowData, ""),
                reject: () => {}
            });
        };

        return (
            <div className="flex gap-2">
                {canAssign && <Button icon="pi pi-user-plus" rounded outlined className="p-button-sm" onClick={() => onAssign(rowData)} tooltip="Assign to Technician" tooltipOptions={{ position: "top" }} />}
                {canReassign && <Button icon="pi pi-user-edit" rounded outlined className="p-button-sm" onClick={() => onReassign(rowData)} tooltip="Reassign" tooltipOptions={{ position: "top" }} />}
                {canUnassign && <Button icon="pi pi-user-minus" rounded outlined severity="danger" className="p-button-sm" onClick={handleUnassignClick} tooltip="Unassign Technician" />}
                <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" />
            </div>
        );
    };

    return (
        <div>
            <ConfirmDialog />
            <DataTable
                value={workOrders}
                selectAll={selectAll}
                onSelectAllChange={handleSelectAllChange}
                selection={selectedWorkOrders}
                onSelectionChange={(e) => setSelectedWorkOrders(e.value)}
                dataKey="id"
                paginator
                onPage={onPageChange}
                first={currentFirst}
                rows={currentRows}
                rowsPerPageOptions={[5, 10, 25, 50]}
                header={Header}
                emptyMessage="Tidak ada Work Order ditemukan."
                selectionMode="multiple"
                className="border-round-lg"
                filters={filters}
                filterDisplay="menu"
                globalFilterFields={["title", "machine.name", "description"]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Displays {first} to {last} of {totalRecords} Work Orders"
                loading={loading}
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="title" header="Title" sortable body={titleBodyTemplate} style={{ minWidth: "10rem" }} />
                <Column field="machine.name" header="Machine" sortable body={(rowData) => <Tag value={rowData.machine?.name} className="bg-gray-100 text-gray-800 font-medium" />} />
                <Column field="image" header="Image" body={photoBodyTemplate} />
                <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column header="Assigned" body={technicianBodyTemplate} sortable sortField="assignedTo.full_name" />
                <Column header="Schedule" body={scheduledDateBodyTemplate} style={{ minWidth: "145px" }} sortable sortField="scheduled_date" />
                <Column field="started_at" header="Started" body={dateBodyTemplate("started_at")} style={{ minWidth: "120px" }} sortable />
                <Column field="completed_at" header="Completed" body={dateBodyTemplate("completed_at")} style={{ minWidth: "120px" }} sortable />
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
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "10rem" }} />
            </DataTable>
        </div>
    );
};

export default WorkOrderTable;
