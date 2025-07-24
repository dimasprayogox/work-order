"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

const statusSeverity = {
    pending: "info",
    approved: "success",
    rejected: "danger",
    fulfilled: "success"
};

const PartRequestTable = ({ requests, loading, onUpdateStatus }) => {
    const statusTemplate = (rowData) => (
        <Tag value={rowData.status} severity={statusSeverity[rowData.status]} />
    );

    const requestedByTemplate = (rowData) => rowData.requestedBy?.name || "-";

    const itemsTemplate = (rowData) => (
        <ul className="list-disc ml-4">
            {rowData.items.map(item => (
                <li key={item.id}>
                    {item.part?.name} ({item.quantity_requested})
                    {item.quantity_approved != null && ` → Disetujui: ${item.quantity_approved}`}
                </li>
            ))}
        </ul>
    );

    return (
        <DataTable value={requests} loading={loading} paginator rows={10} stripedRows>
            <Column field="id" header="ID" />
            <Column header="Dibuat Oleh" body={requestedByTemplate} />
            <Column field="note" header="Catatan" />
            <Column header="Items" body={itemsTemplate} />
            <Column header="Status" body={statusTemplate} />
            <Column
                header="Aksi"
                body={(rowData) => (
                    <Button
                        label="Update Status"
                        icon="pi pi-pencil"
                        onClick={() => onUpdateStatus(rowData)}
                    />
                )}
            />
        </DataTable>
    );
};

export default PartRequestTable;
