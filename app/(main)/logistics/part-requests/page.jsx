"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import PartRequestTable from "./components/PartRequestTable";
import UpdateStatusDialog from "./components/UpdateStatusDialog";
import { useRouter } from "next/navigation";

const PartRequestPage = () => {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const toast = useRef(null);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/logistics/part-request");
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Gagal mengambil data request");
            }
            const result = await res.json();
            setRequests(result.data || []);
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleUpdateStatus = (req) => {
        setSelectedRequest(req);
        setDialogOpen(true);
    };

    const handleRefresh = () => {
        fetchRequests();
        setSearchText("");
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

            <div className="card">
                <h3 className="mb-4">Manajemen Parts Request</h3>
                <div className="flex flex-row gap-2 mb-4 justify-content-between">
                    <Button label="Back" icon="pi pi-arrow-left" outlined onClick={() => router.push("/dashboard")} />
                    <Button label="New" icon="pi pi-plus" outlined severity="success" disabled />
                    <Divider layout="vertical" />
                    <Button label="Import" icon="pi pi-file-import" outlined disabled />
                    <Button label="Export" icon="pi pi-file-excel" outlined disabled />
                    <Button label="Print" icon="pi pi-print" outlined disabled />
                    <Divider layout="vertical" />
                    <Button size="small" label="Delete" icon="pi pi-trash" outlined severity="danger" disabled />
                    <Divider layout="vertical" />
                    <Button label="Refresh" icon="pi pi-refresh" outlined onClick={handleRefresh} />
                </div>

                <PartRequestTable requests={requests} loading={loading} onUpdateStatus={handleUpdateStatus} searchText={searchText} onSearch={handleSearch} />

                <UpdateStatusDialog
                    visible={isDialogOpen}
                    onHide={() => setDialogOpen(false)}
                    request={selectedRequest}
                    fetchRequests={fetchRequests}
                    showToast={(type, title, msg) => toast.current.show({ severity: type, summary: title, detail: msg })}
                />
            </div>
        </div>
    );
};

export default PartRequestPage;
