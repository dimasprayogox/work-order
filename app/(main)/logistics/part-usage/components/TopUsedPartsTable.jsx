"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const TopUsedPartsTable = ({ data, loading }) => {
    return (
        <DataTable value={data} loading={loading} stripedRows>
            <Column field="part.name" header="Nama Part" />
            <Column field="part.part_number" header="Part Number" />
            <Column field="total_used" header="Total Digunakan" />
        </DataTable>
    );
};

export default TopUsedPartsTable;
