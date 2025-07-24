"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { useState } from "react";

// Template untuk menampilkan status dengan warna
const statusBodyTemplate = (rowData) => {
    const getStatusSeverity = (status) => {
        switch (status) {
            case "open": return "danger";
            case "in_progress": return "info";
            case "resolved": case "completed": return "success";
            default: return "warning";
        }
    };
    const formattedStatus = rowData.status ? rowData.status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "";
    return <Tag value={formattedStatus} severity={getStatusSeverity(rowData.status)} />;
};

// Template untuk tanggal
const dateBodyTemplate = (rowData) => {
    return rowData.created_at ? new Date(rowData.created_at).toLocaleDateString("id-ID") : "N/A";
};

export default function WorkOrderTable({ workOrders, loading, onUpdate }) {
    const [globalFilter, setGlobalFilter] = useState('');

    // Template untuk tombol aksi
    const actionBodyTemplate = (rowData) => {
        return (
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-success"
                tooltip="Update Work Order"
                tooltipOptions={{ position: 'top' }}
                onClick={() => onUpdate(rowData)}
            />
        );
    };

    const header = (
        <div className="flex justify-content-between align-items-center">
            <h5 className="m-0">My Work Orders</h5>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search..."
                />
            </span>
        </div>
    );

    return (
        <DataTable
            value={workOrders}
            loading={loading}
            dataKey="id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} work orders"
            globalFilter={globalFilter}
            header={header}
            emptyMessage="No work orders found."
        >
            <Column field="title" header="Title" sortable />
            <Column field="machine.name" header="Machine" body={(rowData) => rowData.machine?.name || 'N/A'} sortable />
            <Column field="priority" header="Priority" body={(rowData) => <Tag value={rowData.priority} />} sortable />
            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
            <Column field="created_at" header="Date Created" body={dateBodyTemplate} sortable />
            <Column header="Actions" body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
    );
}
