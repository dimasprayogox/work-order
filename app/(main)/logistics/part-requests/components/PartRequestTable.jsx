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
    fulfilled: "success"
};

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

    const statusTemplate = (rowData) => <Tag value={rowData.status} severity={statusSeverity[rowData.status]} />;

    const requestedByTemplate = (rowData) => rowData.requestedBy?.name || "-";

    const itemsTemplate = (rowData) => (
        <ul className="list-disc">
            {rowData.items.map((item) => (
                <li key={item.id}>
                    {item.part?.name} ({item.quantity_requested}){item.quantity_approved != null && ` → Disetujui: ${item.quantity_approved}`}
                </li>
            ))}
        </ul>
    );

    const actionTemplate = (rowData) => <Button label="Update Status" icon="pi pi-pencil" onClick={() => onUpdateStatus(rowData)} className="p-button-sm" />;

    const header = (
        <div className="flex align-items-center justify-content-between">
            <div>
                <span className="text-xl font-bold mr-3">Parts Request List</span>
                <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={searchText} onChange={(e) => onGlobalFilterChange(e.target.value)} placeholder="Search" />
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
            <Column header="Dibuat Oleh" body={requestedByTemplate} sortable sortField="requestedBy.name" style={{ width: "15%", minWidth: "150px" }} />
            <Column field="note" header="Catatan" sortable style={{ width: "20%", minWidth: "200px" }} />
            <Column header="Items" body={itemsTemplate} style={{ width: "35%", minWidth: "300px" }} />
            <Column header="Status" body={statusTemplate} sortable sortField="status" style={{ width: "15%", minWidth: "120px" }} />
            <Column header="Aksi" body={actionTemplate} style={{ width: "15%", minWidth: "150px" }} />
        </DataTable>
    );
};

export default PartRequestTable;
