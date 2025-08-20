"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, useEffect, useCallback } from "react";
import { FilterMatchMode } from "primereact/api";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { Tooltip } from "primereact/tooltip";

const statusFilterOptions = [
    { label: "All Status", value: null },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Fulfilled", value: "fulfilled" },
    { label: "Rejected", value: "rejected" }
];

const PartRequestTable = ({ partRequests, loading, onDetail, onDelete, setSelectedRequests, selectedRequests = [], onSelectionChange = () => {}, onSearch, searchText }) => {
    const [filters, setFilters] = useState({
        global: { value: searchText || null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS }
    });

    const [statusFilter, setStatusFilter] = useState(null);
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText || "");
    const [selectAll, setSelectAll] = useState(false);
    const [currentFirst, setCurrentFirst] = useState(0);
    const [currentRows, setCurrentRows] = useState(10);

    const onGlobalFilterChange = useCallback(
        (e) => {
            const value = e.target.value;
            setGlobalFilterValue(value);
            setFilters((prevFilters) => ({
                ...prevFilters,
                global: { ...prevFilters.global, value }
            }));
            onSearch(value);
        },
        [onSearch]
    );

    const onStatusFilterChange = (e) => {
        const value = e.value;
        setStatusFilter(value);
        setFilters((prevFilters) => ({
            ...prevFilters,
            status: { value, matchMode: FilterMatchMode.EQUALS }
        }));
    };

    useEffect(() => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            global: { ...prevFilters.global, value: searchText || null }
        }));
        setGlobalFilterValue(searchText || "");
    }, [searchText]);

    const handleSelectionChange = (e) => {
        onSelectionChange(e.value);
        setSelectAll(e.value.length > 0 && e.value.length === partRequests.length);
    };

    const handleSelectAllChange = (e) => {
        const checked = e.checked;

        // Filter data according to global filter and status filter
        let filteredData = partRequests;

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
        setSelectedRequests(selected);
    };

    const onPageChange = (e) => {
        setCurrentFirst(e.first);
        setCurrentRows(e.rows);
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            pending: "Pending",
            approved: "Approved",
            fulfilled: "Fulfilled",
            rejected: "Rejected"
        };
        return statusMap[status] || status;
    };

    const statusBodyTemplate = (rowData) => {
        const statusConfig = {
            pending: { color: "#f97316", bgColor: "bg-orange-100", textColor: "text-orange-800", icon: "pi-clock" },
            approved: { color: "#06b6d4", bgColor: "bg-cyan-100", textColor: "text-cyan-800", icon: "pi-spin pi-spinner" },
            fulfilled: { color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" },
            rejected: { color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi-times-circle" }
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

    const safeDateBodyTemplate = (rowData, fieldPath) => {
        try {
            const value = fieldPath.split(".").reduce((obj, key) => obj?.[key], rowData);
            if (!value) return "N/A";

            const date = new Date(value);
            if (isNaN(date.getTime())) return "Invalid Date";

            return date.toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch (error) {
            return "N/A";
        }
    };
    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-eye" rounded outlined className="p-button-sm" onClick={() => onDetail(rowData.items)} tooltip="View Items" tooltipOptions={{ position: "top" }} />
            <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: "top" }} />
        </div>
    );

    const itemsTemplate = (rowData) => (
        <ul className="list-disc pl-4">
            {rowData.items?.map((item) => (
                <li key={item.id}>
                    {item.part?.name} ({item.quantity_requested}){item.quantity_approved != null && ` → Approved: ${item.quantity_approved}`}
                </li>
            )) || <li>No items</li>}
        </ul>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Part Requests</span>
                <Dropdown value={statusFilter} options={statusFilterOptions} onChange={onStatusFilterChange} placeholder="All Status" className="w-full md:w-auto" />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Search" className="w-full md:w-auto" />
            </span>
        </div>
    );

    return (
        <DataTable
            value={partRequests}
            loading={loading}
            dataKey="id"
            paginator
            rows={currentRows}
            rowsPerPageOptions={[5, 10, 25, 50]}
            header={header}
            filters={filters}
            filterDisplay="menu"
            selectionMode="multiple"
            className="border-round-lg"
            emptyMessage="No part requests found."
            selection={selectedRequests}
            selectAll={selectAll}
            onSelectionChange={(e) => setSelectedRequests(e.value)}
            onSelectAllChange={handleSelectAllChange}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Displays {first} to {last} of {totalRecords} Part Requests"
            onPage={onPageChange}
        >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column field="workOrder.title" header="Title" sortable filter filterField="workOrder.title" />
            <Column
                field="note"
                header="Notes"
                sortable
                body={(rowData) => (
                    <>
                        <Tooltip target={`.note-tooltip-${rowData.id}`} position="bottom" />
                        <span
                            className={`note-tooltip-${rowData.id}`}
                            data-pr-tooltip={rowData.note}
                            style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "block",
                                maxWidth: "200px"
                            }}
                        >
                            {rowData.note}
                        </span>
                    </>
                )}
            />
            <Column field="workOrder.priority" header="Priority" body={(rowData) => <Tag value={rowData.workOrder?.priority} />} sortable />
            <Column field="status" header="Status" body={statusBodyTemplate} sortable filter filterField="status" />
            <Column header="Scheduled" body={(rowData) => safeDateBodyTemplate(rowData, "workOrder.scheduled_date")} sortable />
            <Column header="Items" body={itemsTemplate} style={{ minWidth: "200px" }} />
            <Column header="Actions" body={actionBodyTemplate} style={{ textAlign: "center", width: "120px" }} />
        </DataTable>
    );
};

export default PartRequestTable;
