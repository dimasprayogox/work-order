"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";

const statusSeverity = {
    pending: "info",
    approved: "success",
    rejected: "danger",
    fulfilled: "success",
    false: "success" // Add false as a success status
};

const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Fulfilled", value: "fulfilled" },
    { label: "Completed", value: "false" } // Changed label to "Completed"
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

    const itemsTemplate = (rowData) => (
        <ul className="list-disc ">
            {rowData.items.map((item) => (
                <li key={item.id}>
                    {item.part?.name} ({item.quantity_requested}){item.quantity_approved != null && ` → Disetujui: ${item.quantity_approved}`}
                </li>
            ))}
        </ul>
    );

    const statusTemplate = (rowData) => {
        if (rowData.status === "false") {
            return (
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-check-circle text-green-500" style={{ fontSize: "1.25rem" }}></i>
                    <span className="font-medium text-green-600">Completed</span>
                </div>
            );
        }
        return <Tag value={rowData.status} severity={statusSeverity[rowData.status]} />;
    };

    const actionTemplate = (rowData) => {
        if (rowData.status === "fulfilled" || rowData.status === "false") {
            return null;
        }
        return <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onUpdateStatus(rowData)} tooltip="Edit" />;
    };

    const header = (
        <div className="flex align-items-center justify-content-between">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Parts Request List</span>
                <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} className="w-10rem" />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={searchText} onChange={(e) => onGlobalFilterChange(e.target.value)} placeholder="Search" className="w-20rem" />
            </span>
        </div>
    );

    return (
        <DataTable
            value={requests}
            loading={loading}
            paginator
            rows={10}
            stripedRows
            emptyMessage="Tidak ada permintaan parts ditemukan"
            filters={filters}
            globalFilterFields={["requestedBy.name", "note", "status", "items.part.name"]}
            className="border-round-lg"
            rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} permintaan"
            rowsPerPageOptions={[5, 10, 25]}
            header={header}
        >
            <Column header="Teknisi" body={requestedByTemplate} sortable sortField="requestedBy.name" style={{ width: "15%", minWidth: "150px" }} />
            <Column field="note" header="Catatan" sortable style={{ width: "20%", minWidth: "200px" }} />
            <Column header="Items" body={itemsTemplate} style={{ width: "35%", minWidth: "300px" }} />
            <Column header="Status" body={statusTemplate} sortable sortField="status" bodyClassName={(rowData) => (rowData.status === "false" ? "font-bold" : "")} style={{ width: "15%", minWidth: "120px" }} />
            <Column header="Aksi" body={actionTemplate}  />
        </DataTable>
    );
};

export default PartRequestTable;
