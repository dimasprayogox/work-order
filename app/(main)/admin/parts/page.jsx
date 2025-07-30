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

import AdminPartTable from "./components/AdminPartTable";
import AdminPartFormDialog from "./components/AdminPartFormDialog";
import AdminConfirmDeleteDialog from "./components/AdminConfirmDeleteDialog";
import { API_ENDPOINTS } from "../../../api/api";

const AdminPartPage = () => {
  const toast = useRef(null);
  const fileInputRef = useRef(null);

  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);

  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const [isPrintOptionsOpen, setPrintOptionsOpen] = useState(false);
  const [isPreviewOpen, setPreviewOpen] = useState(false);

  const [printConfig, setPrintConfig] = useState({
    paperSize: "a4",
    orientation: "portrait",
    columns: ["name", "part_number", "quantity_in_stock", "min_stock", "location"],
    onlySelected: false,
  });

  const columnOptions = [
    { header: "Name", value: "name" },
    { header: "Part Number", value: "part_number" },
    { header: "Description", value: "description" },
    { header: "Quantity", value: "quantity_in_stock" },
    { header: "Min Stock", value: "min_stock" },
    { header: "Location", value: "location" },
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

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_PARTS, { credentials: "include" });
      const body = await res.json();
      if (res.ok && body.success) {
        setParts(body.data || []);
      } else {
        throw new Error(body.message || "Failed to fetch parts");
      }
    } catch (error) {
      showToast("error", "Error", error.message || "Gagal mengambil data part");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  // ⚙️ DIUBAH: Fungsi import menggunakan ExcelJS
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const buffer = evt.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) throw new Error("Worksheet tidak ditemukan.");

          const jsonData = [];
          const headers = worksheet.getRow(1).values;
          if (!Array.isArray(headers) || headers.length <= 1) throw new Error("Header kolom tidak valid.");

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              let rowData = {};
              row.values.forEach((value, index) => {
                if (headers[index]) {
                  rowData[headers[index]] = value;
                }
              });
              jsonData.push(rowData);
            }
          });

          let successCount = 0;
          let errorCount = 0;
          for (const item of jsonData) {
            try {
              const res = await fetch(API_ENDPOINTS.ADMIN_PARTS, {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "include", body: JSON.stringify(item),
              });
              const body = await res.json();
              if (res.ok && body.success) {
                successCount++;
              } else {
                errorCount++;
                console.error(`Gagal impor part "${item.name}": ${body.message}`);
              }
            } catch {
              errorCount++;
            }
          }

          if (successCount > 0) {
            showToast("success", "Import Selesai", `${successCount} data berhasil diimpor${errorCount > 0 ? `, ${errorCount} gagal` : ""}`);
            fetchParts();
          } else {
            throw new Error("Tidak ada data yang berhasil diimpor.");
          }

        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        } finally {
            e.target.value = ''; // Reset input file
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      showToast("error", "Import Gagal", err.message);
    }
  };

  // ⚙️ DIUBAH: Fungsi export menggunakan ExcelJS
  const handleExport = async () => {
    if (!parts.length) {
      return showToast("warn", "Peringatan", "Tidak ada data untuk diekspor");
    }
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("AdminParts");
        worksheet.columns = [
            { header: 'id', key: 'id', width: 38 },
            { header: 'name', key: 'name', width: 30 },
            { header: 'part_number', key: 'part_number', width: 20 },
            { header: 'description', key: 'description', width: 40 },
            { header: 'quantity_in_stock', key: 'quantity_in_stock', width: 15 },
            { header: 'min_stock', key: 'min_stock', width: 15 },
            { header: 'location', key: 'location', width: 20 },
            { header: 'created_at', key: 'created_at', width: 22 },
            { header: 'updated_at', key: 'updated_at', width: 22 },
        ];
        worksheet.addRows(parts);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "admin-parts-data.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("success", "Export Sukses", "Data berhasil diunduh");
    } catch(err) {
        showToast("error", "Export Gagal", err.message);
    }
  }

  const handleDelete = (part) => {
    setSelectedPart(part);
    setDeleteOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedParts.length === 0) return;
    confirmDialog({
      message: `Apakah Anda yakin ingin menghapus ${selectedParts.length} part yang dipilih?`,
      header: "Konfirmasi Penghapusan", icon: "pi pi-exclamation-triangle",
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          const idsToDelete = selectedParts.map(p => p.id);
          const res = await fetch(`${API_ENDPOINTS.ADMIN_PARTS}/batch`, {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: idsToDelete }), credentials: 'include',
          });
          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.message || 'Gagal menghapus part');
          }
          showToast('success', 'Sukses', 'Part yang dipilih berhasil dihapus.');
          fetchParts();
          setSelectedParts([]);
        } catch (err) {
          showToast('error', 'Error', err.message);
        }
      },
    });
  };

  const generatePDF = () => {
    const { paperSize, orientation, columns, onlySelected } = printConfig;
    const sourceData = onlySelected && selectedParts.length > 0 ? selectedParts : parts;
    const headers = columns.map(c => columnOptions.find(o => o.value === c)?.header || c);
    const body = sourceData.map(p => columns.map(c => p[c] ?? ""));
    const doc = new jsPDF({ unit: "mm", format: paperSize, orientation });
    doc.text("Daftar Parts (Admin)", 14, 14);
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
        <Button label="Print PDF" icon="pi pi-print" onClick={() => { generatePDF().save("admin-parts.pdf"); setPrintOptionsOpen(false); }} />
      </div>
    </Dialog>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} ref={fileInputRef} />

      <div className="card">
        <h3 className="mb-4">Admin - Manajemen Parts</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button label="New" icon="pi pi-plus" outlined severity="success" onClick={() => { setSelectedPart(null); setFormOpen(true); }} />
          <Divider layout="vertical" />
          <Button label="Import" icon="pi pi-file-import" outlined severity="info" onClick={() => fileInputRef.current?.click()} />
          <Button label="Export" icon="pi pi-file-excel" outlined severity="success" onClick={handleExport} />
          <Button label="Print" icon="pi pi-print" outlined severity="help" onClick={() => setPrintOptionsOpen(true)} />
          <Button label={`Delete (${selectedParts.length})`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedParts.length === 0} />
          <Divider layout="vertical" />
          <Button label="Refresh" icon="pi pi-refresh" outlined onClick={fetchParts} loading={loading} />
        </div>

        <AdminPartTable parts={parts} loading={loading} selectedParts={selectedParts} onSelectionChange={(e) => setSelectedParts(e.value)} onEdit={(p) => { setSelectedPart(p); setFormOpen(true); }} onDelete={handleDelete} />
      </div>

      <AdminPartFormDialog visible={isFormOpen} onHide={() => setFormOpen(false)} part={selectedPart} fetchParts={fetchParts} showToast={showToast} />
      <AdminConfirmDeleteDialog visible={isDeleteOpen} onHide={() => setDeleteOpen(false)} part={selectedPart} fetchParts={fetchParts} showToast={showToast} />
      {renderPrintOptions()}

      <Dialog header="PDF Preview" visible={isPreviewOpen} modal maximizable style={{ width: "90vw", height: "90vh" }} onHide={() => setPreviewOpen(false)}
        footer={ <Button label="Download PDF" icon="pi pi-download" onClick={() => generatePDF().save("admin-parts.pdf")} /> }>
        {isPreviewOpen && <iframe title="preview" src={URL.createObjectURL(generatePDF().output("blob"))} style={{ width: "100%", height: "100%", border: "none" }} />}
      </Dialog>
    </div>
  );
};

export default AdminPartPage;
