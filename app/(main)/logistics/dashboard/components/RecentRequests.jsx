"use client";

import { useEffect, useState, useRef } from "react";
import { Card, DataTable, Column } from "primereact";
import StatusBadge from "./status/StatusBadge";
import { InputText } from "primereact/inputtext";
import { API_ENDPOINTS } from "../../../../api/api";
import { Toast } from "primereact/toast";

const RecentRequests = () => {
    const [searchText, setSearchText] = useState("");
    const [data, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.PART_REQUESTS, { credentials: "include" });
            const data = await res.json();

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const recentData = (data.data || []).filter((item) => {
                const itemDate = new Date(item.created_at);
                return itemDate >= oneWeekAgo;
            });

            setRequests(recentData);
            
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Error", detail: "Gagal mengambil data request" });
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const filteredData = data.filter((item) => {
        const searchLower = searchText.toLowerCase();
        return (
            item.requestedBy?.full_name?.toLowerCase().includes(searchLower) || formatDate(item.created_at).toLowerCase().includes(searchLower) || item.status?.toLowerCase().includes(searchLower) || item.part_name?.toLowerCase().includes(searchLower)
        );
    });

        const requestedByTemplate = (rowData) => rowData.requestedBy?.full_name || "-";

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div className="col-12 md:col-6">
            <Toast ref={toast} />
            <div className="card flex flex-column p-3 " style={{ minHeight: "420px", maxHeight: "420px", height: "100%" }}>
                <h5 className="font-bold mb-4 self-start pt-2 pb-4 text-center">Recent Requests</h5>
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
