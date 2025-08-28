"use client";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import StatusBadge from "../../dashboard/components/status/StatusBadge";
import { Tooltip } from "primereact/tooltip";

const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Fulfilled", value: "fulfilled" }
];

const PartRequestTable = ({ requests, loading, onUpdateStatus, onSearch, searchText }) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        setFilters({
            global: { value: searchText, matchMode: FilterMatchMode.CONTAINS },
            status: { value: statusFilter || null, matchMode: FilterMatchMode.EQUALS }
        });
    }, [searchText, statusFilter]);

    const onGlobalFilterChange = (value) => {
        setFilters({
            global: { value, matchMode: FilterMatchMode.CONTAINS }
        });
        onSearch(value);
    };

    const requestedByTemplate = (rowData) => rowData.requestedBy?.full_name || "-";

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

    const actionTemplate = (rowData) => {
        return <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onUpdateStatus(rowData)} tooltip="Edit" tooltipOptions={{ position: "top" }} />;
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Parts Request List</span>
            </div>
            <div className="flex align-items-center gap-3">
                <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} className="w-10rem" />
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={searchText} onChange={(e) => onGlobalFilterChange(e.target.value)} placeholder="Search" className="w-full" />
                </span>
            </div>
        </div>
    );

    return (
        <DataTable
            value={requests}
            loading={loading}
            paginator
            rows={10}
            stripedRows
            emptyMessage="No part requests found"
            filters={filters}
            globalFilterFields={["requestedBy.full_name", "note", "status", "items.part.name"]}
            className="border-round-lg"
            rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requests"
            rowsPerPageOptions={[5, 10, 25]}
            header={header}
        >
            <Column header="Technician" body={requestedByTemplate} sortable sortField="requestedBy.name" style={{ width: "15%", minWidth: "150px" }} />
            <Column header="Items" body={itemsTemplate} style={{ width: "35%", minWidth: "300px" }} />
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
            <Column header="Status" body={statusTemplate} sortable sortField="status" bodyClassName={(rowData) => (rowData.status === "false" ? "font-bold" : "")} style={{ width: "15%", minWidth: "120px" }} />
            <Column header="Actions" body={actionTemplate} style={{ width: "10%", minWidth: "80px" }} />
        </DataTable>
    );
};

export default PartRequestTable;
