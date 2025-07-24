"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import PartRequestTable from "./components/PartRequestTable";
import UpdateStatusDialog from "./components/UpdateStatusDialog";
import { API_ENDPOINTS } from "../../../api/api";

const PartRequestPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
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

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div className="p-5">
            <Toast ref={toast} />

            <div className="mb-4">
                <h2 className="text-2xl font-semibold">Permintaan Part</h2>
                <p className="text-sm text-gray-500">Daftar permintaan part dan statusnya</p>
            </div>

            <PartRequestTable
                requests={requests}
                loading={loading}
                onUpdateStatus={handleUpdateStatus}
            />

            <UpdateStatusDialog
                visible={isDialogOpen}
                onHide={() => setDialogOpen(false)}
                request={selectedRequest}
                fetchRequests={fetchRequests}
                showToast={(type, title, msg) => toast.current.show({ severity: type, summary: title, detail: msg })}
            />
        </div>
    );
};

export default PartRequestPage;
