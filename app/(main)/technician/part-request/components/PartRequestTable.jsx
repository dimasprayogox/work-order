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
        const statusMap = {
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            approved: { label: "Approved", color: "bg-blue-100 text-blue-800" },
            fulfilled: { label: "Fulfilled", color: "bg-green-100 text-green-800" },
            rejected: { label: "Rejected", color: "bg-red-100 text-red-800"}
        };
        const status = statusMap[rowData.status] || { label: rowData.status, color: "bg-gray-100 text-gray-800" };
        return <Tag value={status.label} className={status.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
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

     const partRequestBodyTemplate = (rowData) => {
         const { partRequests } = rowData;

         // Cek jika tidak ada part request sama sekali
         if (!partRequests || partRequests.length === 0) {
             return <span className="text-sm text-gray-500">No parts requested</span>;
         }

         // Mengumpulkan semua 'items' dari semua 'partRequests' menjadi satu array
         const allItems = partRequests.flatMap((request) => request.items || []);

         // Cek jika setelah digabungkan ternyata tidak ada item sama sekali
         if (allItems.length === 0) {
             return <span className="text-sm text-gray-500">No parts requested</span>;
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

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Part Requests</span>
            </div>
            <div className="flex align-items-center gap-3">
                <Dropdown value={statusFilter} options={statusFilterOptions} onChange={onStatusFilterChange} placeholder="All Status" className="w-full md:w-auto" />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Search" className="w-full md:w-auto" />
                </span>
            </div>
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
            <Column header="Items" body={itemsTemplate} style={{ minWidth: "250px" }} />
            <Column header="Actions" body={actionBodyTemplate} style={{ textAlign: "center", width: "120px" }} />
        </DataTable>
    );
};

export default PartRequestTable;
