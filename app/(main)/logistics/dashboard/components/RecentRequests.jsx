"use client";
import { useEffect, useState, useRef } from "react";
import { DataTable, Column } from "primereact";
import StatusBadge from "./status/StatusBadge";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";

const RecentRequests = () => {
    const [searchText, setSearchText] = useState("");
    const [allData, setAllData] = useState([]); // Simpan semua data
    const [filteredData, setFilteredData] = useState([]); // Data yang difilter
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/logistics/part-requests");
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Gagal mengambil data request");
            }
            const result = await res.json();
            setAllData(result.data || []);
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Filter data 1 minggu terakhir + search text
    useEffect(() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const filtered = allData.filter((item) => {
            // Filter tanggal (1 minggu terakhir)
            const itemDate = new Date(item.created_at);
            const isWithinWeek = itemDate >= oneWeekAgo;

            // Filter search text
            const searchLower = searchText.toLowerCase();
            const matchesSearch =
                item.requestedBy?.full_name?.toLowerCase().includes(searchLower) ||
                itemDate.toLocaleDateString().toLowerCase().includes(searchLower) ||
                item.status?.toLowerCase().includes(searchLower) ||
                item.part_name?.toLowerCase().includes(searchLower);

            return isWithinWeek && matchesSearch;
        });

        setFilteredData(filtered);
    }, [allData, searchText]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const requestedByTemplate = (rowData) => rowData.requestedBy?.full_name || "-";

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div className="col-12 md:col-6">
            <Toast ref={toast} />
            <div className="card flex flex-column p-3" style={{ minHeight: "420px", maxHeight: "420px", height: "100%" }}>
                <h5 className="font-bold mb-4 self-start pt-2 pb-4 text-center">Recent Requests (1 Week)</h5>
                <DataTable
                    loading={loading}
                    value={filteredData}
                    paginator
                    rows={3}
                    emptyMessage="Tidak ada recent request ditemukan."
                    className="border-round-lg"
                    rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                    header={
                        <div className="flex align-items-center justify-content-between gap-2">
                            <div className="flex gap-2">
                                <span className="p-input-icon-left">
                                    <i className="pi pi-search" />
                                    <InputText placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-15rem" />
                                </span>
                            </div>
                        </div>
                    }
                >
                    <Column header="Teknisi" body={requestedByTemplate} sortable />
                    <Column field="date" header="Date" body={(data) => formatDate(data.created_at)} />
                    <Column field="status" header="Status" body={(data) => <StatusBadge status={data.status} />} />
                </DataTable>
            </div>
        </div>
    );
};

export default RecentRequests;
