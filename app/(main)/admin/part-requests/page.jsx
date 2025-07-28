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

import PartRequestTable from "./components/PartRequestTable";
import PartRequestDetailDialog from "./components/PartRequestDetailDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import { API_ENDPOINTS } from "../../../api/api";

const AdminPartRequestPage = () => {
    const toast = useRef(null);

    const [partRequests, setPartRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedRequests, setSelectedRequests] = useState([]);

    const [isDetailOpen, setDetailOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const [isPrintOptionsOpen, setPrintOptionsOpen] = useState(false);
    const [isPreviewOpen, setPreviewOpen] = useState(false);

    const [printConfig, setPrintConfig] = useState({
        paperSize: "a4",
        orientation: "portrait",
        columns: ["id", "requested_by", "status", "created_at", "items_count"],
        onlySelected: false,
    });

    const columnOptions = [
        { header: "ID", value: "id" },
        { header: "Requested By", value: "requested_by" },
        { header: "Status", value: "status" },
        { header: "Priority", value: "priority" },
        { header: "Work Order", value: "work_order_id" },
        { header: "Items Count", value: "items_count" },
        { header: "Total Quantity", value: "total_quantity" },
        { header: "Created Date", value: "created_at" },
        { header: "Note", value: "note" },
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

    const fetchPartRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.ADMIN_PART_REQUESTS, {
                credentials: "include"
            });
            const body = await res.json();
            if (res.ok) {
                // Process data to add computed fields
                const processedData = (body.data || []).map(request => ({
                    ...request,
                    items_count: request.items?.length || 0,
                    total_quantity: request.items?.reduce((sum, item) => sum + (item.quantity_requested || 0), 0) || 0,
                    requested_by: request.requestedBy?.name || request.requestedBy?.username || 'Unknown'
                }));
                setPartRequests(processedData);
            } else {
                showToast("error", "Error", body.message || "Gagal mengambil data part requests");
            }
        } catch (error) {
            showToast("error", "Error", "Gagal mengambil data part requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartRequests();
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

                showToast("info", "Import", "Import functionality not implemented for part requests");
            };
            reader.readAsBinaryString(file);
        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        }
    };

    const handleDelete = (request) => {
        setSelectedRequest(request);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedRequests.length === 0) {
            showToast("warn", "Warning", "Tidak ada part request yang dipilih");
            return;
        }
        setDeleteConfirmOpen(true);
    };

    const handleViewDetail = (request) => {
        setSelectedRequest(request);
        setDetailOpen(true);
    };

    const openPrintOptions = () => {
        if (!partRequests.length)
            return showToast("warn", "Peringatan", "Tidak ada data untuk cetak");
        setPrintOptionsOpen(true);
    };

    const generatePDF = () => {
        const { paperSize, orientation, columns, onlySelected } = printConfig;
        const sourceData =
            onlySelected && selectedRequests.length > 0 ? selectedRequests : partRequests;
        const headers = columns.map(
            (c) => columnOptions.find((o) => o.value === c)?.header || c
        );
        const rows = sourceData.map((request) =>
            columns.map((c) => {
                let value = request[c];
                if (c === 'created_at' && value) {
                    value = new Date(value).toLocaleDateString();
                }
                return value ?? "";
            })
        );

        const doc = new jsPDF({ unit: "mm", format: paperSize, orientation });
        doc.text("Daftar Part Requests", 14, 14);
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
        generatePDF().save("part-requests.pdf");
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
                            setPrintConfig((prev) => ({ ...prev, paperSize: e.value }))
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
                            setPrintConfig((prev) => ({ ...prev, orientation: e.value }))
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
                            setPrintConfig((prev) => ({ ...prev, columns: e.value }))
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
                            setPrintConfig((prev) => ({
                                ...prev,
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
                ref={(ref) => (window.__fileInputImportPartRequest = ref)}
            />

            <div className="card">
                <h3 className="mb-4">Admin - Part Request Management</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button
                        size="small"
                        label="Back"
                        icon="pi pi-arrow-left"
                        outlined
                        disabled
                    />
                    <Divider layout="vertical" />
                    <Button
                        label="Import"
                        icon="pi pi-file-import"
                        outlined
                        severity="info"
                        onClick={() => window.__fileInputImportPartRequest?.click()}
                    />
                    <Button
                        label="Export"
                        icon="pi pi-file-excel"
                        outlined
                        severity="success"
                        onClick={() => {
                            if (!partRequests.length)
                                return showToast(
                                    "warn",
                                    "Peringatan",
                                    "Tidak ada data untuk diekspor"
                                );
                            const ws = XLSX.utils.json_to_sheet(partRequests);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "PartRequests");
                            XLSX.writeFile(wb, "part-requests-data.xlsx");
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
                            selectedRequests.length > 0
                                ? `(${selectedRequests.length})`
                                : ""
                        }`}
                        icon="pi pi-trash"
                        outlined
                        severity="danger"
                        onClick={handleDeleteSelected}
                        disabled={selectedRequests.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={fetchPartRequests}
                    />
                </div>

                <PartRequestTable
                    partRequests={partRequests}
                    loading={loading}
                    selectedRequests={selectedRequests}
                    onSelectionChange={setSelectedRequests}
                    onViewDetail={handleViewDetail}
                    onDelete={handleDelete}
                />

                <PartRequestDetailDialog
                    visible={isDetailOpen}
                    onHide={() => setDetailOpen(false)}
                    request={selectedRequest}
                    fetchPartRequests={fetchPartRequests}
                    showToast={showToast}
                />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    request={selectedRequest}
                    selectedRequests={selectedRequests}
                    onHide={() => setDeleteOpen(false)}
                    fetchPartRequests={fetchPartRequests}
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

export default AdminPartRequestPage;
