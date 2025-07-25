"use client";

import React, { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import { API_ENDPOINTS } from "../../../api/api";
import PartTable from "./components/PartTable";
import PartFormDialog from "./components/PartFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

const PartPage = () => {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectedParts, setSelectedParts] = useState([]);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const toast = useRef(null);

    const fetchParts = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.PARTS, { credentials: "include" });
            const data = await res.json();
            setParts(data.data || []);
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data part");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail });
    };

    const handleAdd = () => {
        setSelectedPart(null);
        setDialogOpen(true);
    };

    const handleEdit = (part) => {
        setSelectedPart(part);
        setDialogOpen(true);
    };

   const handleDelete = (part) => {
       setSelectedPart(part);
       setDeleteConfirmOpen(true);
   };

   const handleDeleteSelected = () => {
    if (selectedParts.length === 0) {
        showToast("warn", "Warning", "Tidak ada part yang dipilih");
        return;
    }
       setDeleteConfirmOpen(true);
   };

    const handleRefresh = () => {
        fetchParts();
        setSelectedParts([]);
    };

    useEffect(() => {
        fetchParts();
    }, []);

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" className="opacity-90" />
            <ConfirmDialog />

            <div className="card">
                <h3 className="mb-4">Manajemen Parts</h3>

                <div className="flex flex-row gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button size="small" label="New" icon="pi pi-plus" outlined severity="success" onClick={handleAdd} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined />
                    <Button size="small" label="Print" icon="pi pi-print" outlined />
                    <Divider layout="vertical" />
                    <Button size="small" label={`Delete ${selectedParts.length > 0 ? `(${selectedParts.length})` : ""}`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedParts.length === 0} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={handleRefresh} />
                </div>

                <PartTable parts={parts} loading={loading} onEdit={handleEdit} onDelete={handleDelete} selectedParts={selectedParts} onSelectionChange={setSelectedParts} />

                <PartFormDialog visible={isDialogOpen} onHide={() => setDialogOpen(false)} part={selectedPart} fetchParts={fetchParts} showToast={showToast} />

                <ConfirmDeleteDialog
                    visible={isDeleteConfirmOpen}
                    part={selectedPart}
                    selectedParts={selectedParts}
                    onHide={() => {
                        setDeleteConfirmOpen(false);
                        setSelectedPart(null);
                    }}
                    fetchParts={fetchParts}
                    showToast={showToast}
                />
            </div>
        </div>
    );
};

export default PartPage;
