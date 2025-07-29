"use client";

import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useState, useRef } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { API_ENDPOINTS } from "../../../../api/api";

const TopUsedPartsTable = () => {
    const [partsData, setPartsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useRef(null);

    const fetchTopUsedParts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.TOP_USED_PARTS}`, { credentials: "include" });
            if (!res.ok) {
                throw new Error("Failed to fetch top used parts");
            }
            const response = await res.json();

            if (response.success && response.data) {
                setPartsData(response.data);
            } else {
                throw new Error("Invalid data format received");
            }
        } catch (err) {
            console.error("Error fetching top used parts:", err);
            setError(err.message);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Gagal mengambil data part yang sering digunakan"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopUsedParts();
    }, []);

    const rowNumberTemplate = (_, { rowIndex }) => {
        return rowIndex + 1;
    };

    if (loading) {
        return (
            <Card title="Part Paling Sering Digunakan" className="shadow-md h-full">
                <div className="flex justify-center p-4">
                    <ProgressSpinner />
                    <span className="ml-2">Memuat data part...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card title="Part Paling Sering Digunakan" className="shadow-md h-full">
                <div className="p-4 text-yellow-700 font-medium">
                    <i className="pi pi-info-circle mr-2"></i>
                    {error}
                </div>
            </Card>
        );
    }

    return (
        <div className="col-12 md:col-12">
            <Toast ref={toast} />
                <DataTable
                    value={partsData}
                    paginator
                    rows={5}
                    stripedRows
                    className="p-datatable-sm"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                    emptyMessage="Tidak ada data penggunaan part"
                    scrollable
                    scrollHeight="flex"
                >
                    <Column header="No" body={rowNumberTemplate} style={{ width: "5%", textAlign: "center" }} />
                    <Column field="part.part_number" header="Kode Part" sortable style={{ width: "20%" }} body={(rowData) => rowData.part?.part_number || "-"} />
                    <Column field="part.name" header="Nama Part" sortable style={{ width: "25%" }} body={(rowData) => rowData.part?.name || "Part Tidak Dikenal"} />
                    <Column field="part.location" header="Lokasi" sortable style={{ width: "10%" }} body={(rowData) => rowData.part?.location || "-"} />
                    <Column field="total_used" header="Digunakan" sortable body={(rowData) => rowData.total_used?.toLocaleString("id-ID") || 0} style={{ width: "15%" }} />
                </DataTable>
            </div>
    );
};

export default TopUsedPartsTable;
