"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { FilterMatchMode } from "primereact/api";
import { Tooltip } from "primereact/tooltip";
import { Dropdown } from "primereact/dropdown";

const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Fulfilled", value: "fulfilled" }
];

const PartRequestTable = ({ partRequests, loading, onViewDetail, onDelete, selectedRequests = [], onSelectionChange = () => {}, onSearch = () => {}, searchText = "" }) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);
    const [statusFilterValue, setStatusFilterValue] = useState(null);

    // useEffect yang diperbaiki - sama seperti MachineCategoryTable
    useEffect(() => {
        setGlobalFilterValue(searchText);
        setFilters((prevFilters) => ({
            ...prevFilters,
            global: { ...prevFilters.global, value: searchText }
        }));
    }, [searchText]);

    const onGlobalFilterChange = (value) => {
        // Update filter DataTable secara lokal
        const _filters = { ...filters };
        _filters["global"].value = value;
        setFilters(_filters);

        // Informasikan ke parent component tentang perubahan search text
        onSearch(value);
    };

    const onStatusFilterChange = (e) => {
        const value = e.value;
        setStatusFilterValue(value);

        const _filters = { ...filters };
        _filters["status"].value = value;
        setFilters(_filters);
    };

    const handleSelectionChange = (e) => {
        onSelectionChange(e.value);
    };

    const StatusBadge = ({ status }) => {
        const statusConfig = {
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
            approved: { label: "Approved", color: "bg-yellow-100 text-yellow-800" },
            fulfilled: { label: "Fulfilled", color: "bg-green-100 text-green-800" },
            rejected: { label: "Rejected", color: "bg-red-100 text-red-800" }
        };

        const config = statusConfig[status.toLowerCase()] || {
            label: status,
            color: "bg-gray-100 text-gray-800"
        };

        return <Tag value={config.label} className={config.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
    };

    // WO Priority template (same as priorityBodyTemplate)
    const woPriorityBodyTemplate = (rowData) => {
        const priority = rowData.work_order_priority || "medium";
        const priorityConfig = {
            high: { label: "High", color: "bg-red-100 text-red-800" },
            medium: { label: "Medium", color: "bg-orange-100 text-orange-800" },
            low: { label: "Low", color: "bg-yellow-100 text-yellow-800" }
        };

        const config = priorityConfig[priority] || { label: priority, color: "bg-gray-100 text-gray-800" };

        return <Tag value={config.label} className={config.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onViewDetail(rowData)} tooltip="View Detail" tooltipOptions={{ position: "top" }} severity="info" />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Part Requests</span>

            <div className="flex flex-wrap items-center gap-2">
                {/* 5. Tambahkan Dropdown ke header */}
                <Dropdown value={statusFilterValue} options={statusOptions} onChange={onStatusFilterChange} placeholder="All Status" className="w-full sm:w-auto" />

                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            setGlobalFilterValue(value);
                            onGlobalFilterChange(value);
                        }}
                        placeholder="Search"
                    />
                </span>
            </div>
        </div>
    );

    // Helper functions for consistent labeling
    const getStatusLabel = (status) => {
        const statusMap = {
            pending: "Pending",
            approved: "Approved",
            fulfilled: "Fulfilled",
            rejected: "Rejected"
        };
        return statusMap[status] || status;
    };

    const itemsTemplate = (rowData) => {
        // Mengambil array 'items' langsung dari rowData
        const { items } = rowData;

        // Menampilkan pesan jika tidak ada item yang diminta
        if (!items || items.length === 0) {
            return <span className="text-sm text-gray-500">No parts requested</span>;
        }

        return (
            <div className="flex flex-column align-items-start gap-1">
                {items.map((item) => {
                    // Pastikan item dan data part di dalamnya ada sebelum ditampilkan
                    if (item && item.part) {
                        return (
                            <div key={item.id} className="flex align-items-center gap-2 text-xs p-1 bg-gray-100 border-round">
                                <i className="pi pi-wrench text-gray-600"></i>

                                {/* Menampilkan nama part */}
                                <span className="font-medium">{item.part.name || "Unknown Part"}</span>

                                {/* Menampilkan kuantitas yang diminta */}
                                <span className="text-gray-500">(x{item.quantity_requested})</span>

                                {/* Menampilkan kuantitas yang disetujui HANYA JIKA ada nilainya */}
                                {item.quantity_approved != null && <span className="font-semibold text-green-600">→ Approved: {item.quantity_approved}</span>}
                            </div>
                        );
                    }
                    // Jangan tampilkan apa pun jika data item/part tidak lengkap
                    return null;
                })}
            </div>
        );
    };

    const statusTemplate = (rowData) => {
        if (rowData.status === "false") {
            return (
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-check-circle text-green-500" style={{ fontSize: "1.25rem" }}></i>
                    <span className="font-medium text-green-600">Completed</span>
                </div>
            );
        }
        return <StatusBadge status={rowData.status} />; // Using your custom StatusBadge
    };

    const dateBodyTemplate = (field) => {
        return (rowData) => {
            if (!rowData[field]) return "N/A";
            return new Date(rowData[field]).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        };
    };

    const requestedByTemplate = (rowData) => rowData.requestedBy?.full_name || "-";

    return (
        <div>
            <DataTable
                value={partRequests}
                selection={selectedRequests}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                rows={10}
                loading={loading}
                emptyMessage="No part requests found."
                filters={filters}
                globalFilterFields={["id", "requested_by", "status", "work_order_id", "note"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requests"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column header="Requested" body={requestedByTemplate} sortable sortField="requestedBy.name" style={{ width: "15%", minWidth: "150px" }} />
                <Column
                    field="work_order_title"
                    header="Work Order"
                    sortable
                    style={{ minWidth: "12rem" }}
                    body={(rowData) => (
                        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                            {rowData.work_order_title}
                        </motion.div>
                    )}
                />

                <Column field="status" header="Status" body={statusTemplate} style={{ width: "140px" }} sortable />
                <Column header="Items" body={itemsTemplate} style={{ width: "35%", minWidth: "280px" }} />
                <Column field="work_order_priority" header="Priority" body={woPriorityBodyTemplate} style={{ width: "120px" }} sortable />
                <Column
                    field="note"
                    header="Notes"
                    sortable
                    body={(rowData) => (
                        <>
                            <Tooltip target={`.note-tooltip-${rowData.id}`} position="bottom" />
                            <span
                                className={`text-sm note-tooltip-${rowData.id}`}
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
                <Column field="created_at" header="Created" body={dateBodyTemplate("created_at")} sortable style={{ minWidth: "12rem" }} />
                <Column header="Actions" body={actionBodyTemplate} />
            </DataTable>
        </div>
    );
};

export default PartRequestTable;
