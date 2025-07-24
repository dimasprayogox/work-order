"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { motion } from "framer-motion";
import PartRequestTable from "./components/PartRequestTable";
import ItemDetailDialog from "./components/ItemDetailDialog";
import CreatePartRequestDialog from "./components/CreatePartRequestDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

export default function PartRequestPage() {
    const [partRequests, setPartRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    // State untuk dialog-dialog
    const [isDetailVisible, setDetailVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isCreateVisible, setCreateVisible] = useState(false);
    const [isDeleteVisible, setDeleteVisible] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchPartRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/technician/part-request");
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Gagal mengambil data.");
            }
            const result = await res.json();
            setPartRequests(result.data || []);
        } catch (err) {
            showToast("error", "Error", err.message);
            setPartRequests([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPartRequests();
    }, [fetchPartRequests]);

    const handleShowItems = (items) => {
        setSelectedItems(items);
        setDetailVisible(true);
    };

    const handleCreate = () => {
        setCreateVisible(true);
    };

    const handleDelete = (request) => {
        setRequestToDelete(request);
        setDeleteVisible(true);
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <div className="card">
                <div className="flex justify-content-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-semibold">My Part Requests</h3>
                        <p className="text-sm text-gray-500">
                            Kelola permintaan suku cadang yang telah Anda buat.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label="New Request"
                            icon="pi pi-plus"
                            onClick={handleCreate}
                        />
                        <Button
                            label="Refresh"
                            icon="pi pi-refresh"
                            outlined
                            onClick={fetchPartRequests}
                            disabled={loading}
                        />
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Panel>
                        <PartRequestTable
                            requests={partRequests}
                            loading={loading}
                            onShowItems={handleShowItems}
                            onDelete={handleDelete}
                        />
                    </Panel>
                </motion.div>
            </div>

            <ItemDetailDialog
                visible={isDetailVisible}
                onHide={() => setDetailVisible(false)}
                items={selectedItems}
            />

            <CreatePartRequestDialog
                visible={isCreateVisible}
                onHide={() => setCreateVisible(false)}
                fetchPartRequests={fetchPartRequests}
                showToast={showToast}
            />
            <ConfirmDeleteDialog
                visible={isDeleteVisible}
                onHide={() => setDeleteVisible(false)}
                request={requestToDelete}
                fetchPartRequests={fetchPartRequests}
                showToast={showToast}
            />
        </div>
    );
}
