"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { format } from "date-fns/format";

const UsageLogTable = ({ data, loading }) => {
    return (
        <DataTable value={data} loading={loading} stripedRows paginator rows={10}>
            <Column field="created_at" header="Tanggal" body={(row) => format(new Date(row.created_at), "dd/MM/yyyy HH:mm")} />
            <Column field="part.name" header="Nama Part" />
            <Column field="part.part_number" header="Part Number" />
            <Column field="quantity_used" header="Jumlah Digunakan" />
            <Column field="workOrder.code" header="Work Order" />
        </DataTable>
    );
};

export default UsageLogTable;
