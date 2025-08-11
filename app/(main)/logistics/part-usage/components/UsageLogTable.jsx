"use client";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { format } from "date-fns/format";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";

const UsageLogTable = ({ data, loading, error }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <ProgressSpinner />
                <span className="ml-2">Loading log data...</span>
            </div>
        );
    }

    if (error) {
        return <Message severity="error" text={error} className="w-full" />;
    }

    return (
        <DataTable
            value={data}
            loading={loading}
            stripedRows
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            emptyMessage="No usage log data found"
        >
            <Column field="created_at" header="Date" body={(rowData) => (rowData.created_at ? format(new Date(rowData.created_at), "dd/MM/yyyy") : "-")} sortable />
            <Column field="part.name" header="Part Name" body={(rowData) => rowData.part?.name || "Unknown Part"} sortable />
            <Column field="part.part_number" header="Part Number" body={(rowData) => rowData.part?.part_number || "-"} sortable />
            <Column field="quantity_used" header="Used" body={(rowData) => rowData.quantity_used || 0} sortable />
            <Column field="workOrder.title" header="Work Order" body={(rowData) => rowData.workOrder?.title || "-"} sortable />
        </DataTable>
    );
};

export default UsageLogTable;
