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


import PartTable from "./components/PartTable";
import PartFormDialog from "./components/PartFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";


import AdjustPrintMarginLaporan from "../../Export/adjustPrintMarginLaporan";
import PDFViewer from "../../Export/PDFViewer";

import { API_ENDPOINTS } from "../../../api/api";

const PartPage = () => {
    const toast = useRef(null);

    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectedParts, setSelectedParts] = useState([]);


    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false); // Dialog untuk custom margin
    const [isPreviewOpen, setPreviewOpen] = useState(false); // Dialog untuk PDF viewer

    const [isPrintOptionsOpen, setPrintOptionsOpen] = useState(false);
   

    const [pdfUrl, setPdfUrl] = useState(null);
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

    const showToast = (sev, sum, det) => toast.current.show({ severity: sev, summary: sum, detail: det });

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
            reader.onload = async (evt) => {
                const wb = XLSX.read(evt.target.result, { type: "binary" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                for (const item of data) {
                    const res = await fetch(API_ENDPOINTS.PARTS, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(item)
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.message || "Import gagal");
                }
                showToast("success", "Import Sukses", "Data berhasil diimpor");
                fetchParts();
            };
            reader.readAsBinaryString(file);
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
            showToast("warn", "Warning", "Tidak ada part yang dipilih");
            return;
        }
        setDeleteConfirmOpen(true);
    };

   const generatePDF = (config) => {
       const { paperSize, orientation, columns, onlySelected, marginTop, marginBottom, marginLeft, marginRight } = config;

       const sourceData = onlySelected && selectedParts.length > 0 ? selectedParts : parts;

       // **PENTING: Periksa apakah ada data untuk dicetak**
       if (!sourceData || sourceData.length === 0) {
           showToast("warn", "Tidak Ada Data", "Tidak ada data yang bisa dicetak.");
           return null; // Kembalikan null jika tidak ada data
       }

       const headers = (columns || []).map((c) => columnOptions.find((o) => o.value === c)?.header || c);
       const body = sourceData.map((p) => (columns || []).map((c) => p[c] ?? "-"));

       const doc = new jsPDF({
           orientation,
           unit: "mm",
           format: paperSize
       });

       // Judul Dokumen
       doc.setFontSize(16);
       doc.text("Daftar Suku Cadang", marginLeft, marginTop);

       // Tabel Data
       autoTable(doc, {
           startY: marginTop + 10,
           head: [headers],
           body,
           margin: {
               top: marginTop,
               right: marginRight,
               bottom: marginBottom,
               left: marginLeft
           },
           theme: "striped",
           styles: {
               fontSize: 8,
               cellPadding: 2
           },
           headStyles: {
               fillColor: [22, 160, 133], // Warna header
               textColor: 255,
               fontStyle: "bold"
           }
       });

       return doc;
   };

   const handlePreview = (currentConfig) => {
       const doc = generatePDF(currentConfig);

       // **PENTING: Hanya lanjutkan jika dokumen berhasil dibuat**
       if (doc) {
           const blob = doc.output("bloburl");
           setPdfUrl(blob);
           setPreviewOpen(true);
       }
   };

  const handleAdjustAndPreview = (adjustConfig) => {
      // Gabungkan konfigurasi dasar dengan penyesuaian dari dialog
      const finalConfig = {
          ...printConfig,
          ...adjustConfig,
          // Pastikan kolom dan data terpilih diambil dari state saat ini
          columns: printConfig.columns,
          onlySelected: printConfig.onlySelected
      };

      const doc = generatePDF(finalConfig);

      if (doc) {
          const url = doc.output("bloburl"); // Gunakan bloburl untuk keandalan
          setPdfUrl(url);
          setPreviewOpen(true); // Buka dialog pratinjau
          setAdjustDialogOpen(false); // Tutup dialog penyesuaian
      }
  };

    const excel = () => {
        if (!parts.length) return showToast("warn", "Peringatan", "Tidak ada data untuk diekspor");
        const ws = XLSX.utils.json_to_sheet(parts);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Parts");
        XLSX.writeFile(wb, "parts-data.xlsx");
    };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />

            <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} ref={(ref) => (window.__fileInputImportPart = ref)} />

            <div className="card">
                <h3 className="mb-4">Manajemen Parts</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button label="New" icon="pi pi-plus" outlined severity="success" onClick={() => setFormOpen(true)} />
                    <Divider layout="vertical" />
                    <Button label="Import" icon="pi pi-file-import" outlined severity="info" onClick={() => window.__fileInputImportPart?.click()} />
                    <Button
                        label="Export"
                        icon="pi pi-file-excel"
                        outlined
                        severity="success"
                        onClick={() => {
                            if (!parts.length) return showToast("warn", "Peringatan", "Tidak ada data untuk diekspor");
                            const ws = XLSX.utils.json_to_sheet(parts);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Parts");
                            XLSX.writeFile(wb, "parts-data.xlsx");
                        }}
                    />
                    <Button label="Print" icon="pi pi-print" outlined severity="help" onClick={() => setAdjustDialogOpen(true)} />
                    <Button size="small" label={`Delete ${selectedParts.length > 0 ? `(${selectedParts.length})` : ""}`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedParts.length === 0} />
                    <Divider layout="vertical" />
                    <Button label="Refresh" icon="pi pi-refresh" outlined onClick={fetchParts} />
                </div>

                <PartTable
                    parts={parts}
                    loading={loading}
                    selectedParts={selectedParts}
                    onSelectionChange={setSelectedParts}
                    onEdit={(p) => {
                        setSelectedPart(p);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                />

                <PartFormDialog visible={isFormOpen} onHide={() => setFormOpen(false)} part={selectedPart} fetchParts={fetchParts} showToast={showToast} />

                <ConfirmDeleteDialog visible={isDeleteOpen} part={selectedPart} onHide={() => setDeleteOpen(false)} fetchParts={fetchParts} showToast={showToast} />

                <AdjustPrintMarginLaporan adjustDialog={adjustDialogOpen} setAdjustDialog={setAdjustDialogOpen} handleAdjust={handleAdjustAndPreview} loadingPreview={loading} excel={excel} />
                <Dialog visible={isPreviewOpen} onHide={() => setPreviewOpen(false)} header="PDF Preview" style={{ width: "90vw", height: "90vh" }} maximizable>
                    {pdfUrl && <PDFViewer pdfUrl={pdfUrl} paperSize={printConfig.paperSize} fileName="parts-preview" />}
                </Dialog>
            </div>
        </div>
    );
};

export default PartPage;
