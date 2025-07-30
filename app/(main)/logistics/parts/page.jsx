"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";

import PartTable from "./components/PartTable";
import PartFormDialog from "./components/PartFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";


import { useRouter } from "next/navigation";


const PartPage = () => {
    const router = useRouter();
    // Refs
    const toast = useRef(null);

    // State
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectedParts, setSelectedParts] = useState([]);

    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);


    // --- Core Functions ---

    const showToast = (sev, sum, det) => toast.current?.show({ severity: sev, summary: sum, detail: det });

    const fetchParts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/logistics/parts");
            if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch parts.");
            const result = await res.json();
            setParts(result.data || []);
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchParts();
    }, []);

    const handleDelete = (part) => {
      setSelectedPart(part);
      setDeleteOpen(true);
    };

  const handleDeleteSelected = () => {
     if (selectedParts.length === 0) {
         showToast("warn", "Peringatan", "Tidak ada part yang dipilih");
         return;
     }
     setSelectedPart(null);
     setDeleteOpen(true);
  };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />
            <div className="card">
                <h3 className="mb-4">Manajemen Parts</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button label="Back" icon="pi pi-arrow-left" outlined onClick={() => router.push("/dashboard")}/>
                    <Button label="New" icon="pi pi-plus" outlined severity="success" onClick={() => setFormOpen(true)} />
                    <Divider layout="vertical" />
                    <Button label="Import" icon="pi pi-file-import" outlined  />
                    <Button label="Export" icon="pi pi-file-excel" outlined  />
                    <Button label="Print" icon="pi pi-print" outlined  />
                    <Divider layout="vertical" />
                    <Button size="small" label={`Delete (${selectedParts.length})`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedParts.length === 0} />
                    <Divider layout="vertical" />
                    <Button label="Refresh" icon="pi pi-refresh" outlined onClick={fetchParts} />
                </div>

                <PartTable parts={parts} loading={loading} selectedParts={selectedParts} onSelectionChange={setSelectedParts} onEdit={(p) => { setSelectedPart(p); setFormOpen(true); }} onDelete={handleDelete} />

                {/* Dialogs */}
                <PartFormDialog visible={isFormOpen} onHide={() => setFormOpen(false)} part={selectedPart} fetchParts={fetchParts} showToast={showToast} />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    onHide={() => {
                        setDeleteOpen(false);
                        setSelectedPart(null);
                    }}
                    part={selectedPart}
                    selectedParts={selectedParts} // <-- INI YANG MEMPERBAIKI ERROR
                    fetchParts={() => {
                        fetchParts();
                        setSelectedParts([]); // Kosongkan seleksi setelah berhasil
                    }}
                    showToast={showToast}
                />
        
            </div>
        </div>
    );
};

export default PartPage;
