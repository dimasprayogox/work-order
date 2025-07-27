"use client";

import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import MachineTable from "./components/MachineTable";
import MachineFormDialog from "./components/MachineFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import { API_ENDPOINTS } from "../../../api/api";

const MachinePage = () => {
    const toast = useRef(null);

    const [machines, setMachines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [selectedMachines, setSelectedMachines] = useState([]);

    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const [isPrintOptionsOpen, setPrintOptionsOpen] = useState(false);
    const [isPreviewOpen, setPreviewOpen] = useState(false);

    const [printConfig, setPrintConfig] = useState({
        paperSize: "a4",
        orientation: "portrait",
        columns: ["machine_code", "name", "location", "status", "category"],
        onlySelected: false,
    });

    const columnOptions = [
        { header: "Machine Code", value: "machine_code" },
        { header: "Name", value: "name" },
        { header: "Location", value: "location" },
        { header: "Status", value: "status" },
        { header: "Category", value: "category" },
    ];

    const paperSizes = [
        { label: "A4", value: "a4" },
        { label: "Letter", value: "letter" },
        { label: "Legal", value: "legal" },
    ];

    const orientations = [
        { label: "Portrait", value: "portrait" },
        { label: "Landscape", value: "landscape" },
    ];

    const showToast = (sev, sum, det) =>
        toast.current.show({ severity: sev, summary: sum, detail: det });

    const fetchMachines = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.MACHINES, { credentials: "include" });
            const body = await res.json();
            setMachines(body.data || []);
        } catch {
            showToast("error", "Error", "Gagal mengambil data mesin");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.MACHINE_CATEGORIES, { credentials: "include" });
            const body = await res.json();
            setCategories(body.data || []);
        } catch {
            showToast("error", "Error", "Gagal mengambil data kategori");
        }
    };

    useEffect(() => {
        fetchMachines();
        fetchCategories();
    }, []);

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                const wb = XLSX.read(evt.target.result, { type: "binary" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                for (const item of data) {
                    const res = await fetch(API_ENDPOINTS.MACHINES, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(item),
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.message || "Import gagal");
                }
                showToast("success", "Import Sukses", "Data berhasil diimpor");
                fetchMachines();
            };
            reader.readAsBinaryString(file);
        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        }
    };

    const handleDelete = (machine) => {
        setSelectedMachine(machine);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedMachines.length === 0) {
            showToast("warn", "Warning", "Tidak ada mesin yang dipilih");
            return;
        }
        setDeleteConfirmOpen(true);
    };

    const openPrintOptions = () => {
        if (!machines.length)
            return showToast("warn", "Peringatan", "Tidak ada data untuk cetak");
        setPrintOptionsOpen(true);
    };

    const generatePDF = () => {
        const { paperSize, orientation, columns, onlySelected } = printConfig;
        const sourceData =
            onlySelected && selectedMachines.length > 0 ? selectedMachines : machines;
        const headers = columns.map(
            (c) => columnOptions.find((o) => o.value === c)?.header || c
        );
        const rows = sourceData.map((m) => columns.map((c) => {
            if (c === 'category') {
                return m.category?.name || '-';
            }
            return m[c] ?? '';
        }));

        const doc = new jsPDF({ unit: "mm", format: paperSize, orientation });
        doc.text("Daftar Mesin", 14, 14);
        autoTable(doc, {
            startY: 20,
            head: [headers],
            body: rows,
            styles: { fontSize: 8 },
        });
        return doc;
    };

    const handlePreview = () => setPreviewOpen(true);
    const handlePrint = () => {
        generatePDF().save("machines.pdf");
        setPrintOptionsOpen(false);
        setPreviewOpen(false);
    };

    const renderPrintOptions = () => (
        <Dialog
            header="Print PDF Options"
            visible={isPrintOptionsOpen}
            onHide={() => setPrintOptionsOpen(false)}
            modal
            className="p-fluid"
            style={{ width: "30rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        >
            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Paper Size</label>
                <div className="col-12">
                    <Dropdown
                        value={printConfig.paperSize}
                        options={paperSizes}
                        onChange={(e) =>
                            setPrintConfig((ic) => ({ ...ic, paperSize: e.value }))
                        }
                        placeholder="Pilih ukuran"
                    />
                </div>
            </div>

            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Orientation</label>
                <div className="col-12">
                    <Dropdown
                        value={printConfig.orientation}
                        options={orientations}
                        onChange={(e) =>
                            setPrintConfig((ic) => ({ ...ic, orientation: e.value }))
                        }
                        placeholder="Pilih orientasi"
                    />
                </div>
            </div>

            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Columns to Print</label>
                <div className="col-12">
                    <MultiSelect
                        value={printConfig.columns}
                        options={columnOptions}
                        onChange={(e) =>
                            setPrintConfig((ic) => ({ ...ic, columns: e.value }))
                        }
                        optionLabel="header"
                        placeholder="Pilih kolom"
                        display="chip"
                    />
                </div>
            </div>

            <div className="field grid mb-4">
                <div className="col-12">
                    <Checkbox
                        checked={printConfig.onlySelected}
                        onChange={(e) =>
                            setPrintConfig((ic) => ({
                                ...ic,
                                onlySelected: e.checked,
                            }))
                        }
                    />
                    <label className="ml-2">Print only selected data</label>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button label="Preview" icon="pi pi-eye" onClick={handlePreview} />
                <Button label="Print PDF" icon="pi pi-print" onClick={handlePrint} />
            </div>
        </Dialog>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />

            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                style={{ display: "none" }}
                ref={(ref) => (window.__fileInputImportMachine = ref)}
            />

            <div className="card">
                <h3 className="mb-4">Manajemen Mesin</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button
                        size="small"
                        label="Back"
                        icon="pi pi-arrow-left"
                        outlined
                        disabled
                    />
                    <Button
                        label="New"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => setFormOpen(true)}
                    />
                    <Divider layout="vertical" />
                    <Button
                        label="Import"
                        icon="pi pi-file-import"
                        outlined
                        severity="info"
                        onClick={() => window.__fileInputImportMachine?.click()}
                    />
                    <Button
                        label="Export"
                        icon="pi pi-file-excel"
                        outlined
                        severity="success"
                        onClick={() => {
                            if (!machines.length)
                                return showToast(
                                    "warn",
                                    "Peringatan",
                                    "Tidak ada data untuk diekspor"
                                );
                            const ws = XLSX.utils.json_to_sheet(machines);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Machines");
                            XLSX.writeFile(wb, "machines-data.xlsx");
                        }}
                    />
                    <Button
                        label="Print"
                        icon="pi pi-print"
                        outlined
                        severity="help"
                        onClick={openPrintOptions}
                    />
                    <Button
                        size="small"
                        label={`Delete ${
                            selectedMachines.length > 0
                                ? `(${selectedMachines.length})`
                                : ""
                        }`}
                        icon="pi pi-trash"
                        outlined
                        severity="danger"
                        onClick={handleDeleteSelected}
                        disabled={selectedMachines.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={fetchMachines}
                    />
                </div>

                <MachineTable
                    machines={machines}
                    loading={loading}
                    selectedMachines={selectedMachines}
                    onSelectionChange={setSelectedMachines}
                    onEdit={(m) => {
                        setSelectedMachine(m);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                />

                <MachineFormDialog
                    visible={isFormOpen}
                    onHide={() => setFormOpen(false)}
                    machine={selectedMachine}
                    categories={categories}
                    fetchMachines={fetchMachines}
                    showToast={showToast}
                />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    machine={selectedMachine}
                    selectedMachines={selectedMachines}
                    onHide={() => setDeleteOpen(false)}
                    fetchMachines={fetchMachines}
                    showToast={showToast}
                />

                {renderPrintOptions()}

                <Dialog
                    header="PDF Preview"
                    visible={isPreviewOpen}
                    modal
                    maximized
                    style={{ width: "80vw", height: "80vh" }}
                    onHide={() => setPreviewOpen(false)}
                    footer={
                        <Button
                            label="Download PDF"
                            icon="pi pi-download"
                            onClick={handlePrint}
                        />
                    }
                >
                    <iframe
                        title="preview"
                        src={URL.createObjectURL(generatePDF().output("blob"))}
                        style={{ width: "100%", height: "100%", border: "none" }}
                    />
                </Dialog>
            </div>
        </div>
    );
};

export default MachinePage;
