"use client";

import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import PartTable from "./components/PartTable";
import PartFormDialog from "./components/PartFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import AdjustPrintMarginLaporan from "../../Export/adjustPrintMarginLaporan";
import { API_ENDPOINTS } from "../../../api/api";

import { useRouter } from "next/navigation";

const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), {
    ssr: false
});

const PartPage = () => {
    const router = useRouter();
    // Refs
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    // State
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectedParts, setSelectedParts] = useState([]);

    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false); // Dialog untuk custom margin
    const [isPreviewOpen, setPreviewOpen] = useState(false); // Dialog untuk PDF viewer
    const [deleteManyDialogOpen, setDeleteManyDialogOpen] = useState(false);

    const [isPrintOptionsOpen, setPrintOptionsOpen] = useState(false);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // State untuk alur kerja Print/PDF sesuai permintaan Anda
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [fileName, setFileName] = useState('parts-report');
    const [printConfig, setPrintConfig] = useState({
        paperSize: "a4",
        orientation: "portrait",
        columns: ["name", "part_number", "quantity_in_stock", "min_stock", "location"],
        onlySelected: false
    });

    const columnOptions = [
        { header: "Name", value: "name" },
        { header: "Part Number", value: "part_number" },
        { header: "Description", value: "description" },
        { header: "Quantity", value: "quantity_in_stock" },
        { header: "Min Stock", value: "min_stock" },
        { header: "Location", value: "location" }
    ];

    // --- Core Functions ---

    const showToast = (sev, sum, det) => toast.current?.show({ severity: sev, summary: sum, detail: det });

    const fetchParts = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.PARTS, { credentials: "include" });
            const body = await res.json();
            setParts(body.data || []);
        } catch {
            showToast("error", "Error", "Gagal mengambil data part");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async () => {
                const buffer = reader.result;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.getWorksheet(1);
                const jsonData = [];
                const headerRow = worksheet.getRow(1);
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber > 1) {
                        let rowObject = {};
                        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                            const headerCell = headerRow.getCell(colNumber);
                            if (headerCell && headerCell.value) {
                                rowObject[headerCell.value.toString()] = cell.value;
                            }
                        });
                        jsonData.push(rowObject);
                    }
                });
                for (const item of jsonData) {
                    const res = await fetch(API_ENDPOINTS.PARTS, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(item)
                    });
                    if (!res.ok) {
                        const body = await res.json();
                        throw new Error(body.message || "Import gagal");
                    }
                }
                showToast("success", "Import Sukses", "Data berhasil diimpor");
                fetchParts();
            };
        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        }
    };

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


    const exportExcel = async () => {
        if (!parts.length) return showToast("warn", "Peringatan", "Tidak ada data untuk diekspor");
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Parts Data");
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Part Number', key: 'part_number', width: 20 },
            { header: 'Description', key: 'description', width: 40 },
            { header: 'Quantity', key: 'quantity_in_stock', width: 15, style: { numFmt: '#,##0' } },
            { header: 'Min Stock', key: 'min_stock', width: 15, style: { numFmt: '#,##0' } },
            { header: 'Location', key: 'location', width: 20 }
        ];
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22A085' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        worksheet.addRows(parts);
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${fileName}.xlsx`);
    };

    const generatePDF = (config) => {
        const { paperSize, orientation, columns, onlySelected, marginTop, marginBottom, marginLeft, marginRight } = config;
        const sourceData = onlySelected && selectedParts.length > 0 ? selectedParts : parts;
        if (!sourceData || sourceData.length === 0) {
            showToast("warn", "Tidak Ada Data", "Tidak ada data yang bisa dicetak.");
            return null;
        }
        const headers = (columns || []).map((c) => columnOptions.find((o) => o.value === c)?.header || c);
        const body = sourceData.map((p) => (columns || []).map((c) => p[c] ?? "-"));
        const doc = new jsPDF({ orientation, unit: "mm", format: paperSize });
        doc.setFontSize(16);
        doc.text("Daftar Suku Cadang", marginLeft, marginTop);
        autoTable(doc, {
            startY: marginTop + 10,
            head: [headers],
            body,
            margin: { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft },
            theme: "striped",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" }
        });
        return doc;
    };

    // Fungsi ini dipanggil dari AdjustPrintMarginLaporan
    const handleAdjust = (adjustConfig) => {
        const finalConfig = { ...printConfig, ...adjustConfig };
        const doc = generatePDF(finalConfig);
        if (doc) {
            setPdfUrl(doc.output("bloburl"));
            setJsPdfPreviewOpen(true);
            setAdjustDialog(false);
        }
    };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} ref={fileInputRef} />

            <div className="card">
                <h3 className="mb-4">Manajemen Parts</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button label="Back" icon="pi pi-arrow-left" outlined onClick={() => router.push("/dashboard")}/>
                    <Button label="New" icon="pi pi-plus" outlined severity="success" onClick={() => setFormOpen(true)} />
                    <Divider layout="vertical" />
                    <Button label="Import" icon="pi pi-file-import" outlined onClick={() => fileInputRef.current?.click()} />
                    <Button label="Export" icon="pi pi-file-excel" outlined onClick={exportExcel} />
                    <Button label="Print" icon="pi pi-print" outlined onClick={() => setAdjustDialog(true)} />
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
                <AdjustPrintMarginLaporan adjustDialog={adjustDialogOpen} setAdjustDialog={setAdjustDialogOpen} handleAdjust={handleAdjustAndPreview} loadingPreview={loading} excel={excel} />
                <Dialog visible={isPreviewOpen} onHide={() => setPreviewOpen(false)} header="PDF Preview" style={{ width: "90vw", height: "90vh" }} maximizable>
                    {pdfUrl && <PDFViewer pdfUrl={pdfUrl} paperSize={printConfig.paperSize} fileName="parts-preview" />}
                </Dialog>
            </div>
        </div>
    );
};

export default PartPage;
