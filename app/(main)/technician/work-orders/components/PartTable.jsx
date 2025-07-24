"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

const PartTable = ({ parts, loading, onEdit, onDelete }) => {
    return (
        <DataTable value={parts} loading={loading} paginator rows={10} stripedRows>
            <Column field="name" header="Nama" />
            <Column field="part_number" header="Part Number" />
            <Column field="quantity_in_stock" header="Stok" />
            <Column field="min_stock" header="Min Stok" />
            <Column field="location" header="Lokasi" />
            <Column
                header="Aksi"
                body={(rowData) => (
                    <div className="flex gap-2">
                        <Button icon="pi pi-pencil" onClick={() => onEdit(rowData)} />
                        <Button icon="pi pi-trash" severity="danger" onClick={() => onDelete(rowData)} />
                    </div>
                )}
            />
        </DataTable>
    );
};

export default PartTable;
