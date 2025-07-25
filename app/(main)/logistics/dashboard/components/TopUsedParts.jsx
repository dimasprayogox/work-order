"use client";

import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";

const TopUsedParts = ({ data }) => {
    const [partsData, setPartsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (data) {
            try {
                // Transformasi data sesuai struktur response
                const transformedData = data.map((item) => ({
                    id: item.part_id,
                    name: item.part?.name || "Part Tidak Dikenal",
                    part_number: item.part?.part_number || "-",
                    total_used: parseInt(item.total_used) || 0,
                    current_stock: item.part?.quantity_in_stock || 0,
                    min_stock: item.part?.min_stock || 0,
                    location: item.part?.location || "-"
                }));

                setPartsData(transformedData);
                setLoading(false);
            } catch (err) {
                console.error("Error processing parts data:", err);
                setError(err.message || "Terjadi kesalahan saat memproses data");
                setLoading(false);
            }
        }
    }, [data]);

    const stockStatusTemplate = (rowData) => {
        if (rowData.current_stock <= rowData.min_stock) {
            return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Kritis</span>;
        } else if (rowData.current_stock <= rowData.min_stock * 2) {
            return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Sedikit</span>;
        }
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Baik</span>;
    };

    const stockLevelTemplate = (rowData) => {
        const percentage = (rowData.current_stock / (rowData.min_stock * 3)) * 100;
        return (
            <div className="flex align-items-center gap-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full ${rowData.current_stock <= rowData.min_stock ? "bg-red-500" : rowData.current_stock <= rowData.min_stock * 2 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                </div>
                <span>
                    {rowData.current_stock}/{rowData.min_stock * 3}
                </span>
            </div>
        );
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
        <Card title="Part Paling Sering Digunakan" className="shadow-md h-full">
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
                <Column field="part_number" header="Kode Part" sortable style={{ width: "20%" }} />
                <Column field="name" header="Nama Part" sortable style={{ width: "25%" }} />
                <Column field="total_used" header="Digunakan" sortable body={(rowData) => rowData.total_used.toLocaleString("id-ID")} style={{ width: "15%" }} />
                <Column header="Level Stok" body={stockLevelTemplate} sortable sortField="current_stock" style={{ width: "20%" }} />
                <Column header="Status" body={stockStatusTemplate} style={{ width: "10%" }} />
                <Column field="location" header="Lokasi" sortable style={{ width: "10%" }} />
            </DataTable>
        </Card>
    );
};

export default TopUsedParts;
