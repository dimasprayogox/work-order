"use client";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";

const TopUsedPartsTable = ({ data, loading, error }) => {
    const rowNumberTemplate = (_, { rowIndex }) => {
        return rowIndex + 1;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <ProgressSpinner />
                <span className="ml-2">Loading part data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-yellow-700 font-medium">
                <i className="pi pi-info-circle mr-2"></i>
                {error}
            </div>
        );
    }

    return (
        <DataTable value={data} paginator rows={5} stripedRows className="p-datatable-sm" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink" emptyMessage="No part usage data found" scrollable scrollHeight="flex">
            <Column header="No" body={rowNumberTemplate} style={{ width: "5%", textAlign: "center" }} />
            <Column field="part.part_number" header="Part Code" sortable style={{ width: "20%" }} body={(rowData) => rowData.part?.part_number || "-"} />
            <Column field="part.name" header="Part Name" sortable style={{ width: "25%" }} body={(rowData) => rowData.part?.name || "Unknown Part"} />
            <Column field="part.location" header="Location" sortable style={{ width: "10%" }} body={(rowData) => rowData.part?.location || "-"} />
            <Column field="total_used" header="Used" sortable body={(rowData) => rowData.total_used?.toLocaleString("en-US") || 0} style={{ width: "15%" }} />
        </DataTable>
    );
};

export default TopUsedPartsTable;
