"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import PartRequestTable from "./components/PartRequestTable";
import UpdateStatusDialog from "./components/UpdateStatusDialog";
import { API_ENDPOINTS } from "../../../api/api";

const PartRequestPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const toast = useRef(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.PART_REQUESTS, { credentials: "include" });
            const data = await res.json();
            setRequests(data.data || []);
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Error", detail: "Gagal mengambil data request" });
        } finally {
            setLoading(false);
        }
    };

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
    }, []);

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" className="opacity-90" />

            <div className="card">
                <h3 className="mb-4">Manajemen Parts Request</h3>

                <div className="flex flex-row gap-2 mb-4 justify-content-between">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={handleRefresh} />
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
