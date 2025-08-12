"use client";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";
import { useState, useEffect } from "react";

const frequencyOptions = [
    { label: "All Frequency", value: "" },
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" }
];

const ScheduleTable = ({ schedules, loading, selectedSchedules, setSelectedSchedules, onEdit, onDelete, handleViewDetails }) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        frequency: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const [frequencyFilter, setFrequencyFilter] = useState("");
    const [selectAll, setSelectAll] = useState(false);
    const [currentFirst, setCurrentFirst] = useState(0);
    const [currentRows, setCurrentRows] = useState(10);

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        setGlobalFilterValue(value);
        setFilters((prevFilters) => ({
            ...prevFilters,
            global: { value, matchMode: FilterMatchMode.CONTAINS }
        }));
    };

    const onFrequencyFilterChange = (e) => {
        const value = e.value;
        setFrequencyFilter(value);
        setFilters((prevFilters) => ({
            ...prevFilters,
            frequency: { value, matchMode: FilterMatchMode.EQUALS }
        }));
    };

    const handleSelectAllChange = (e) => {
        const checked = e.checked;

        // Filter data according to global filter and frequency filter
        let filteredData = schedules;

        // Apply global filter if exists
        if (filters.global.value) {
            const filterValue = filters.global.value.toLowerCase();
            filteredData = filteredData.filter((schedule) => schedule.title?.toLowerCase().includes(filterValue) || schedule.machine?.name?.toLowerCase().includes(filterValue) || schedule.description?.toLowerCase().includes(filterValue));
        }

        // Apply frequency filter if exists
        if (filters.frequency.value) {
            filteredData = filteredData.filter((schedule) => schedule.frequency === filters.frequency.value);
        }

        // Get currently visible data on the page
        const visibleData = filteredData.slice(currentFirst, currentFirst + currentRows);
        const selected = checked ? visibleData : [];

        setSelectAll(checked);
        setSelectedSchedules(selected);
    };

    const onPageChange = (e) => {
        setCurrentFirst(e.first);
        setCurrentRows(e.rows);
    };

    const titleBodyTemplate = (rowData) => (
        <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }} className="font-medium text-blue-600 cursor-pointer">
            {rowData.title}
        </motion.span>
    );

    const machineBodyTemplate = (rowData) => (
        <motion.span whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} className="text-gray-800">
            {rowData.machine?.name || "N/A"}
        </motion.span>
    );

    const createdByBodyTemplate = (rowData) => (
        <motion.span whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} className="text-gray-800">
            {rowData.createdBy?.full_name || rowData.createdBy?.username || "N/A"}
        </motion.span>
    );

    const frequencyBodyTemplate = (rowData) => {
        const frequencyMap = {
            daily: { label: "Daily", color: "bg-blue-100 text-blue-800" },
            weekly: { label: "Weekly", color: "bg-green-100 text-green-800" },
            monthly: { label: "Monthly", color: "bg-purple-100 text-purple-800" },
            yearly: { label: "Yearly", color: "bg-orange-100 text-orange-800" }
        };
        const frequency = frequencyMap[rowData.frequency] || { label: rowData.frequency, color: "bg-gray-100 text-gray-800" };
        return <Tag value={frequency.label} className={frequency.color} style={{ minWidth: "60px", display: "inline-flex", justifyContent: "center" }} />;
    };

    const nextDueDateBodyTemplate = (rowData) => {
        return rowData.next_due_date ? new Date(rowData.next_due_date).toLocaleDateString("id-ID") : "N/A";
    };

    const priorityBodyTemplate = (rowData) => {
        let severity;
        switch (rowData.priority) {
            case "high":
                severity = "danger";
                break;
            case "medium":
                severity = "warning";
                break;
            case "low":
                severity = "success";
                break;
            default:
                severity = "secondary";
                break;
        }
        return (
            <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
                <Tag value={rowData.priority.toUpperCase()} severity={severity} />
            </motion.div>
        );
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-eye" rounded outlined className="p-button-sm" onClick={() => handleViewDetails(rowData)} tooltip="View Details" />
            <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onEdit(rowData)} tooltip="Edit" />
            <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Schedule List</span>
                <Dropdown value={frequencyFilter} options={frequencyOptions} onChange={onFrequencyFilterChange} placeholder="All Frequency" className="w-12rem" />
            </div>
            <span className="p-input-icon-left w-full md:w-auto">
                <i className="pi pi-search" />
                <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Search" className="w-full" />
            </span>
        </div>
    );

    return (
        <div>
            <ConfirmDialog />
            <DataTable
                value={schedules}
                selection={selectedSchedules}
                onSelectionChange={(e) => setSelectedSchedules(e.value)}
                dataKey="id"
                paginator
                stripedRows
                rows={currentRows}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="Tidak ada Jadwal Perawatan ditemukan"
                selectionMode="multiple"
                className="border-round-lg"
                header={header}
                filters={filters}
                globalFilterFields={["title", "description", "machine.name", "frequency", "priority"]}
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Displays {first} to {last} of {totalRecords} schedules"
                loading={loading}
                selectAll={selectAll}
                onSelectAllChange={handleSelectAllChange}
                onPage={onPageChange}
                first={currentFirst}
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="title" header="Title" sortable body={titleBodyTemplate} />
                <Column field="machine.name" header="Machine" body={machineBodyTemplate} sortable />
                <Column field="frequency" header="Frequency" body={frequencyBodyTemplate} sortable filterField="frequency" />
                <Column field="next_due_date" header="Due_Date" body={nextDueDateBodyTemplate} sortable />
                <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
                <Column header="Created" body={createdByBodyTemplate} sortable sortField="created_by.full_name" />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default ScheduleTable;
