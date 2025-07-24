"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

// Template untuk tanggal
const dateBodyTemplate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID");
};

// Template untuk status Part Request
const statusBodyTemplate = (rowData) => {
    const statusMap = {
        pending: { label: "Pending", severity: "warning" },
        approved: { label: "Approved", severity: "success" },
        rejected: { label: "Rejected", severity: "danger" },
    };
    const statusInfo = statusMap[rowData.status] || { label: rowData.status, severity: "info" };
    return <Tag value={statusInfo.label} severity={statusInfo.severity} />;
};

export default function PartRequestTable({ requests, loading, onShowItems, onDelete }) {
    // Template untuk tombol "lihat item"
    const itemsBodyTemplate = (rowData) => {
        return (
            <Button
                icon="pi pi-eye"
                rounded
                text
                onClick={() => onShowItems(rowData.items)}
                tooltip="View Items"
                tooltipOptions={{ position: "top" }}
            />
        );
    };

    // Template untuk tombol aksi (delete)
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2 justify-content-center">
                 <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    onClick={() => onDelete(rowData)}
                    disabled={rowData.status !== "pending"} // Hanya bisa delete jika status 'pending'
                    tooltip="Delete Request"
                    tooltipOptions={{ position: "top" }}
                />
            </div>
        );
    };

    return (
        <DataTable
            value={requests}
            loading={loading}
            dataKey="id"
            paginator
            rows={10}
            emptyMessage="No part requests found."
            responsiveLayout="scroll"
        >
            <Column field="workOrder.title" header="Title" sortable />
            <Column field="workOrder.description" header="Description" style={{ minWidth: "250px" }} />
            <Column field="workOrder.priority" header="Priority" body={(rowData) => <Tag value={rowData.workOrder?.priority} />} sortable />
            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
            <Column field="workOrder.scheduled_date" header="Scheduled" body={(rowData) => dateBodyTemplate(rowData.workOrder?.scheduled_date)} sortable />
            <Column header="Items" body={itemsBodyTemplate} style={{ textAlign: "center" }} />
            <Column header="Actions" body={actionBodyTemplate} style={{ textAlign: "center" }} />
        </DataTable>
    );
}
