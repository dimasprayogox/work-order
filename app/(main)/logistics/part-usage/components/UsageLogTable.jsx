"use client";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { format } from "date-fns/format";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";

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

    const titleBodyTemplate = (rowData) => (
        <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }} className="font-medium text-blue-600 cursor-pointer">
            {rowData.workOrder?.title}
        </motion.span>
    );

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
            <Column field="part.part_number" header="Part Number" style={{ width: "150px" }} sortable body={(rowData) => <Tag value={rowData.part?.part_number} className="bg-gray-100 text-gray-800 font-medium" />} />
            <Column field="created_at" header="Date" body={(rowData) => (rowData.created_at ? format(new Date(rowData.created_at), "dd/MM/yyyy") : "-")} sortable />
            <Column field="part.name" header="Part Name" body={(rowData) => rowData.part?.name || "Unknown Part"} sortable />
            <Column field="quantity_used" header="Used" body={(rowData) => rowData.quantity_used || 0} sortable />
            <Column field="part.location" header="Work Order" body={titleBodyTemplate} style={{ width: "200px" }} sortable />
        </DataTable>
    );
};

export default UsageLogTable;
