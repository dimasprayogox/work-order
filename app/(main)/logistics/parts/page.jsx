"use client";

import React, { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { API_ENDPOINTS } from "../../../api/api";
import PartTable from "./components/PartTable";
import PartFormDialog from "./components/PartFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

const PartPage = () => {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
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
            toast.current.show({ severity: "error", summary: "Error", detail: "Gagal mengambil data part" });
        } finally {
            setLoading(false);
        }
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

    useEffect(() => {
        fetchParts();
    }, []);

    return (
        <div className="p-5">
            <Toast ref={toast} />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-semibold">Manajemen Parts</h2>
                    <p className="text-sm text-gray-500">Kelola data part untuk kebutuhan logistik</p>
                </div>
                <Button label="Tambah Part" icon="pi pi-plus" onClick={handleAdd} />
            </div>

            <PartTable
                parts={parts}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <PartFormDialog
                visible={isDialogOpen}
                onHide={() => setDialogOpen(false)}
                part={selectedPart}
                fetchParts={fetchParts}
                showToast={(type, title, msg) => toast.current.show({ severity: type, summary: title, detail: msg })}
            />

            <ConfirmDeleteDialog
                visible={isDeleteConfirmOpen}
                part={selectedPart}
                onHide={() => setDeleteConfirmOpen(false)}
                fetchParts={fetchParts}
                showToast={(type, title, msg) => toast.current.show({ severity: type, summary: title, detail: msg })}
            />
        </div>
    );
};

export default PartPage;
