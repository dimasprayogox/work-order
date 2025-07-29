"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { format } from "date-fns/format";
import { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { API_ENDPOINTS } from "../../../../api/api";

const UsageLogTable = () => {
    const [usageLogs, setUsageLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useRef(null);

    const fetchUsageLog = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.USAGE_LOG}`, { credentials: "include" });
            if (!res.ok) {
                throw new Error("Failed to fetch usage logs");
            }
            const response = await res.json();

            if (response.success && response.data) {
                  setUsageLogs(response.data);
            } else {
                throw new Error("Invalid data format received");
            }
        } catch (err) {
            console.error("Error fetching usage logs:", err);
            setError(err.message);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Gagal mengambil data log penggunaan part"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsageLog();
    }, []);

    return (
        <div>
            <Toast ref={toast} />
            <DataTable
                value={usageLogs}
                loading={loading}
                stripedRows
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} entri"
            >
                <Column field="created_at" header="Tanggal" body={(rowData) => (rowData.created_at ? format(new Date(rowData.created_at), "dd/MM/yyyy") : "-")} sortable />
                <Column field="part.name" header="Nama Part" body={(rowData) => rowData.part?.name || "Part Tidak Dikenal"} sortable />
                <Column field="part.part_number" header="Part Number" body={(rowData) => rowData.part?.part_number || "-"} sortable />
                <Column field="quantity_used" header="Digunakan" body={(rowData) => rowData.quantity_used || 0} sortable />
                <Column field="workOrder.title" header="Work Order" body={(rowData) => rowData.workOrder?.title || "-"} sortable />
            </DataTable>
        </div>
    );
};

export default UsageLogTable;
