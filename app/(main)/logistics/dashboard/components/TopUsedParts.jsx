"use client";

import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useState, useRef } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";

const TopUsedParts = () => {
    const [partsData, setPartsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useRef(null);

    const fetchTopUsedParts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/logistics/top-used", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error("Failed to fetch top used parts");
            }

            const response = await res.json();

            console.log("DATA AKTUAL DARI API:", response);
            if (response.success && Array.isArray(response.data)) {
                const transformedData = response.data.map((item) => ({
                    id: item.part_id,
                    name: item.part?.name || "Part Tidak Dikenal",
                    part_number: item.part?.part_number || "-",
                    total_used: parseInt(item.total_used) || 0,
                    current_stock: item.part?.quantity_in_stock || 0,
                    min_stock: item.part?.min_stock || 0,
                    location: item.part?.location || "-"
                }));
                setPartsData(transformedData);
            } else {
                throw new Error("Format data yang diterima tidak valid");
            }
        } catch (err) {
            console.error("Error fetching top used parts:", err);
            setError(err.message);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: err.message // Tampilkan pesan error yang lebih dinamis
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopUsedParts();
    }, []);

    const rowNumberTemplate = (rowData, { rowIndex }) => {
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
            <div className="card flex flex-column p-3 ">
                <h5 className="font-bold mb-4 self-start pt-2 pb-4 text-center">Top 10 Used Parts</h5>
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
                    <Column field="part_number" header="Kode Part" sortable style={{ width: "20%" }} />
                    <Column field="name" header="Nama Part" sortable style={{ width: "25%" }} />
                    <Column field="total_used" header="Digunakan" sortable body={(rowData) => rowData.total_used.toLocaleString("id-ID")} style={{ width: "15%" }} />
                    <Column field="location" header="Lokasi" sortable style={{ width: "10%" }} />
                </DataTable>
            </div>
        </div>
    );
};

export default TopUsedParts;
