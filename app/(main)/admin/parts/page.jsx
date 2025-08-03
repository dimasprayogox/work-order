"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import AdminPartTable from "./components/AdminPartTable";
import AdminPartFormDialog from "./components/AdminPartFormDialog";
import AdminConfirmDeleteDialog from "./components/AdminConfirmDeleteDialog";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const AdminPartPage = () => {
  const toast = useRef(null);
  const fileInputRef = useRef(null);

  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);

  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  // Print and export states
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileName, setFileName] = useState("AdminParts");
  const [printConfig, setPrintConfig] = useState({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    marginBottom: 10
  });

  // Fixed: Changed to const like in MachineCategoryPage
  const [columnOptions] = useState([
    { field: 'name', header: 'Name', visible: true },
    { field: 'part_number', header: 'Part Number', visible: true },
    { field: 'description', header: 'Description', visible: true },
    { field: 'quantity_in_stock', header: 'Quantity', visible: true },
    { field: 'min_stock', header: 'Min Stock', visible: true },
    { field: 'location', header: 'Location', visible: true },
    { field: 'created_at', header: 'Created Date', visible: true },
    { field: 'updated_at', header: 'Updated Date', visible: true }
  ]);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      // Menggunakan API route handler yang baru
      const res = await fetch("/api/admin/parts", {
        credentials: "include"
      });
      const body = await res.json();
      setParts(body.data || []);
    } catch (err) {
      showToast("error", "Error", "Gagal mengambil data parts");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Date formatter helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- Export to Excel ---
  const exportExcel = async () => {
    if (!parts.length) {
      showToast("warn", "Warning", "Tidak ada data untuk diekspor");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Admin Parts');

    // Add headers
    const headers = columnOptions
      .filter(col => col.visible)
      .map(col => col.header);

    worksheet.addRow(headers);

    // Add data
    parts.forEach(part => {
      const rowData = columnOptions
        .filter(col => col.visible)
        .map(col => {
          if (col.field === 'created_at' || col.field === 'updated_at') {
            return formatDate(part[col.field]);
          } else {
            return part[col.field] || '';
          }
        });

      worksheet.addRow(rowData);
    });

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast("success", "Success", "Data berhasil diekspor ke Excel");
  };

  // --- Export to PDF --- (Fixed: Now matches MachineCategoryPage implementation)
  const exportPdf = (config = null) => {
    if (!parts.length) {
      showToast("warn", "Warning", "Tidak ada data untuk cetak");
      return;
    }

    const currentConfig = config || printConfig;

    const doc = new jsPDF({
      orientation: currentConfig.orientation,
      unit: currentConfig.unit,
      format: currentConfig.format
    });

    const visibleColumns = columnOptions.filter(col => col.visible);

    const headers = visibleColumns.map(col => col.header);
    const data = parts.map(part => {
      return visibleColumns.map(col => {
        if (col.field === 'created_at' || col.field === 'updated_at') {
          return formatDate(part[col.field]);
        } else {
          return part[col.field] || '';
        }
      });
    });

    doc.text('Admin Parts Report', currentConfig.marginLeft, currentConfig.marginTop);

    autoTable(doc, {
      startY: currentConfig.marginTop + 10,
      head: [headers],
      body: data,
      margin: {
        left: currentConfig.marginLeft,
        right: currentConfig.marginRight,
        top: currentConfig.marginTop + 10,
        bottom: currentConfig.marginBottom
      },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 85, 105] }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfUrl(pdfUrl);
    setJsPdfPreviewOpen(true);
  };

  // --- Adjust Print Margins --- (Fixed: Now matches MachineCategoryPage implementation)
  const handleAdjust = (newConfig) => {
    setPrintConfig(newConfig);
    exportPdf(newConfig);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.getWorksheet(1);
      const data = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const headers = ['name', 'part_number', 'description', 'quantity_in_stock', 'min_stock', 'location'];
          if (headers[colNumber - 1]) {
            rowData[headers[colNumber - 1]] = cell.value;
          }
        });

        if (rowData.name) {
          data.push(rowData);
        }
      });

      for (const item of data) {
        // Menggunakan API route handler yang baru
        const res = await fetch("/api/admin/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(item),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Import gagal");
      }

      showToast("success", "Import Sukses", `${data.length} data berhasil diimpor`);
      fetchParts();

    } catch (err) {
      showToast("error", "Import Gagal", err.message);
    }

    // Reset file input
    e.target.value = '';
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
    setSelectedPart(null);
    setDeleteOpen(true);
  };

  return (
    <div className="p-4">
      <Toast ref={toast} position="top-right" />

      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls"
        onChange={handleImport}
        style={{ display: "none" }}
      />

      <div className="card">
        <div className="flex justify-content-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-semibold">Parts Management</h3>
            <p className="text-sm text-gray-500">Manage parts in the system.</p>
          </div>
        </div>

        <div className="flex flex-row flex-wrap items-center gap-2 mb-4">
          <Button
            size="small"
            label="Back"
            icon="pi pi-arrow-left"
            outlined
            disabled
          />
          <Button
            size="small"
            label="New"
            icon="pi pi-plus"
            outlined
            severity="success"
            onClick={() => {
              setSelectedPart(null);
              setFormOpen(true);
            }}
          />
          <Divider layout="vertical" />
          <Button
            size="small"
            label="Import"
            icon="pi pi-file-import"
            outlined
            onClick={() => fileInputRef.current?.click()}
          />
          <Button
            size="small"
            label="Export"
            icon="pi pi-file-export"
            outlined
            onClick={exportExcel}
          />
          <Button
            size="small"
            label="Print"
            icon="pi pi-print"
            outlined
            onClick={() => setAdjustDialog(true)}
          />
          <Divider layout="vertical" />
          <Button
            size="small"
            label={`Delete${selectedParts.length > 0 ? ` (${selectedParts.length})` : ''}`}
            icon="pi pi-trash"
            severity="danger"
            outlined
            onClick={handleDeleteSelected}
            disabled={selectedParts.length === 0}
          />
          <Divider layout="vertical" />
          <Button
            size="small"
            label="Refresh"
            icon="pi pi-refresh"
            outlined
            onClick={fetchParts}
            disabled={loading}
          />
        </div>

        <AdminPartTable
          parts={parts}
          loading={loading}
          selectedParts={selectedParts}
          onSelectionChange={setSelectedParts}
          onEdit={(part) => {
            setSelectedPart(part);
            setFormOpen(true);
          }}
          onDelete={handleDelete}
        />

        <AdminPartFormDialog
          visible={isFormOpen}
          onHide={() => {
            setFormOpen(false);
            setSelectedPart(null);
          }}
          part={selectedPart}
          fetchParts={fetchParts}
          showToast={showToast}
        />

        <AdminConfirmDeleteDialog
          visible={isDeleteOpen}
          onHide={() => {
            setDeleteOpen(false);
            setSelectedPart(null);
          }}
          part={selectedPart}
          selectedParts={selectedParts}
          fetchParts={fetchParts}
          showToast={showToast}
        />

        {/* Fixed: Added key prop like in MachineCategoryPage */}
        <AdjustPrintMarginLaporan
          key={adjustDialog ? 'open' : 'closed'}
          adjustDialog={adjustDialog}
          setAdjustDialog={setAdjustDialog}
          handleAdjust={handleAdjust}
          excel={exportExcel}
          columnOptions={columnOptions}
          printConfig={printConfig}
          setPrintConfig={setPrintConfig}
        />

        <Dialog
          visible={jsPdfPreviewOpen}
          onHide={() => setJsPdfPreviewOpen(false)}
          modal
          style={{ width: '90vw', height: '90vh' }}
          header="PDF Preview"
        >
          <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPartPage;
