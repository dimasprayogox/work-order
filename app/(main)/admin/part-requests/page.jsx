"use client";

import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import ExcelJS from "exceljs"; // ⚙️ DIUBAH: Menggunakan ExcelJS
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import PartRequestTable from "./components/PartRequestTable";
import PartRequestDetailDialog from "./components/PartRequestDetailDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import { API_ENDPOINTS } from "../../../api/api";

const AdminPartRequestPage = () => {
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    const [partRequests, setPartRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedRequests, setSelectedRequests] = useState([]);

    const [isDetailOpen, setDetailOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);

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
        toast.current.show({ severity: sev, summary: sum, detail: det, life: 3000 });

    const fetchPartRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.ADMIN_PART_REQUESTS, {
                credentials: "include"
            });
            const body = await res.json();
            if (res.ok) {
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

    // ⚙️ DIUBAH: Fungsi import disederhanakan karena belum diimplementasikan
    const handleImport = () => {
        showToast("info", "Informasi", "Fungsi impor belum diimplementasikan untuk halaman ini.");
    };

    // ⚙️ DIUBAH: Fungsi export menggunakan ExcelJS
    const handleExport = async () => {
        if (!partRequests.length) {
            return showToast("warn", "Peringatan", "Tidak ada data untuk diekspor");
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("PartRequests");
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 38 },
                { header: 'Requested By', key: 'requested_by', width: 25 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Priority', key: 'priority', width: 15 },
                { header: 'Work Order ID', key: 'work_order_id', width: 38 },
                { header: 'Items Count', key: 'items_count', width: 15 },
                { header: 'Total Quantity', key: 'total_quantity', width: 15 },
                { header: 'Note', key: 'note', width: 40 },
                { header: 'Created At', key: 'created_at', width: 22 },
            ];

            // Menambahkan data baris demi baris
            partRequests.forEach(req => worksheet.addRow(req));

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "part-requests-data.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("success", "Export Sukses", "Data berhasil diunduh.");
        } catch (err) {
            showToast("error", "Export Gagal", err.message);
        }
    };

    const handleDelete = (request) => {
        setSelectedRequest(request);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedRequests.length === 0) return;
        confirmDialog({
            message: `Apakah Anda yakin ingin menghapus ${selectedRequests.length} permintaan yang dipilih?`,
            header: "Konfirmasi Penghapusan",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const idsToDelete = selectedRequests.map(r => r.id);
                    const res = await fetch(`${API_ENDPOINTS.ADMIN_PART_REQUESTS}/batch`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: idsToDelete }),
                        credentials: 'include',
                    });
                    if (!res.ok) {
                        const body = await res.json();
                        throw new Error(body.message || 'Gagal menghapus permintaan');
                    }
                    showToast('success', 'Sukses', 'Permintaan yang dipilih berhasil dihapus.');
                    fetchPartRequests();
                    setSelectedRequests([]);
                } catch (err) {
                    showToast('error', 'Error', err.message);
                }
            },
        });
    };

    const handleViewDetail = (request) => {
        setSelectedRequest(request);
        setDetailOpen(true);
    };

    const generatePDF = () => {
        const { paperSize, orientation, columns, onlySelected } = printConfig;
        const sourceData = onlySelected && selectedRequests.length > 0 ? selectedRequests : partRequests;
        const headers = columns.map(c => columnOptions.find(o => o.value === c)?.header || c);
        const body = sourceData.map(req => columns.map(c => {
            let value = req[c];
            if (c === 'created_at' && value) {
                value = new Date(value).toLocaleDateString('id-ID');
            }
            return value ?? "";
        }));

        const doc = new jsPDF({ unit: "mm", format: paperSize, orientation });
        doc.text("Daftar Part Requests", 14, 14);
        autoTable(doc, { startY: 20, head: [headers], body, styles: { fontSize: 8 } });
        return doc;
    };

    const renderPrintOptions = () => (
        <Dialog header="Print PDF Options" visible={isPrintOptionsOpen} onHide={() => setPrintOptionsOpen(false)} modal className="p-fluid" style={{ width: "30rem" }}>
            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Paper Size</label>
                <div className="col-12">
                    <Dropdown value={printConfig.paperSize} options={paperSizes} onChange={(e) => setPrintConfig(p => ({ ...p, paperSize: e.value }))} placeholder="Pilih ukuran" />
                </div>
            </div>
            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Orientation</label>
                <div className="col-12">
                    <Dropdown value={printConfig.orientation} options={orientations} onChange={(e) => setPrintConfig(p => ({ ...p, orientation: e.value }))} placeholder="Pilih orientasi" />
                </div>
            </div>
            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Columns to Print</label>
                <div className="col-12">
                    <MultiSelect value={printConfig.columns} options={columnOptions} onChange={(e) => setPrintConfig(p => ({ ...p, columns: e.value }))} optionLabel="header" placeholder="Pilih kolom" display="chip" />
                </div>
            </div>
            <div className="field-checkbox mb-4">
                <Checkbox inputId="onlySelected" checked={printConfig.onlySelected} onChange={(e) => setPrintConfig(p => ({ ...p, onlySelected: e.checked }))} />
                <label htmlFor="onlySelected" className="ml-2">Print only selected data</label>
            </div>
            <div className="flex justify-content-end gap-2">
                <Button label="Preview" icon="pi pi-eye" onClick={() => { setPreviewOpen(true); setPrintOptionsOpen(false); }} />
                <Button label="Print PDF" icon="pi pi-print" onClick={() => { generatePDF().save("part-requests.pdf"); setPrintOptionsOpen(false); }} />
            </div>
        </Dialog>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} ref={fileInputRef} />

            <div className="card">
                <h3 className="mb-4">Admin - Part Request Management</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    <Button label="Import" icon="pi pi-file-import" outlined severity="info" onClick={() => fileInputRef.current?.click()} />
                    <Button label="Export" icon="pi pi-file-excel" outlined severity="success" onClick={handleExport} />
                    <Button label="Print" icon="pi pi-print" outlined severity="help" onClick={() => setPrintOptionsOpen(true)} />
                    <Button label={`Delete (${selectedRequests.length})`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedRequests.length === 0} />
                    <Divider layout="vertical" />
                    <Button label="Refresh" icon="pi pi-refresh" outlined onClick={fetchPartRequests} loading={loading} />
                </div>

                <PartRequestTable
                    partRequests={partRequests}
                    loading={loading}
                    selectedRequests={selectedRequests}
                    onSelectionChange={(e) => setSelectedRequests(e.value)}
                    onViewDetail={handleViewDetail}
                    onDelete={handleDelete}
                />
            </div>

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
                onHide={() => setDeleteOpen(false)}
                fetchPartRequests={fetchPartRequests}
                showToast={showToast}
            />
            {renderPrintOptions()}

            <Dialog header="PDF Preview" visible={isPreviewOpen} modal maximizable style={{ width: "90vw", height: "90vh" }} onHide={() => setPreviewOpen(false)}
                footer={<Button label="Download PDF" icon="pi pi-download" onClick={() => generatePDF().save("part-requests.pdf")} />}>
                {isPreviewOpen && <iframe title="preview" src={URL.createObjectURL(generatePDF().output("blob"))} style={{ width: "100%", height: "100%", border: "none" }} />}
            </Dialog>
        </div>
    );
};

export default AdminPartRequestPage;
