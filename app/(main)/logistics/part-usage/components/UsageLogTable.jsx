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
                <span className="ml-2">Memuat data log...</span>
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
            currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} entri"
            emptyMessage="Tidak ada data log penggunaan"
        >
            <Column field="created_at" header="Tanggal" body={(rowData) => (rowData.created_at ? format(new Date(rowData.created_at), "dd/MM/yyyy") : "-")} sortable />
            <Column field="part.name" header="Nama Part" body={(rowData) => rowData.part?.name || "Part Tidak Dikenal"} sortable />
            <Column field="part.part_number" header="Part Number" body={(rowData) => rowData.part?.part_number || "-"} sortable />
            <Column field="quantity_used" header="Digunakan" body={(rowData) => rowData.quantity_used || 0} sortable />
            <Column field="workOrder.title" header="Work Order" body={(rowData) => rowData.workOrder?.title || "-"} sortable />
        </DataTable>
    );
};

export default UsageLogTable;
