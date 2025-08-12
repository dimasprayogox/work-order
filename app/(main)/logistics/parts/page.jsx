"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import PartTable from "./components/PartTable";
import PartFormDialog from "./components/PartFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import { useRouter } from "next/navigation";

// Dynamic imports for print components
const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const PartPage = () => {
    const router = useRouter();
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    // State
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectedParts, setSelectedParts] = useState([]);
    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [searchText, setSearchText] = useState("");

    // Print and export states
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("PartsReport");
    const [printConfig, setPrintConfig] = useState({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });

    const columnOptions = [
        { header: "No", key: "no", visible: true },
        { header: "Part Number", key: "part_number", visible: true },
        { header: "Name", key: "name", visible: true },
        { header: "Description", key: "description", visible: true },
        { header: "Quantity Stock", key: "quantity_in_stock", visible: true },
        { header: "Minimum Stock", key: "min_stock", visible: true },
        { header: "Location", key: "location", visible: true }
    ];

    const showToast = useCallback((sev, sum, det) => {
        toast.current?.show({ severity: sev, summary: sum, detail: det });
    }, []);

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
    }, [fetchParts]);

    const handleRefresh = () => {
        fetchParts();
        setSearchText("");
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleDelete = (part) => {
        setSelectedPart(part);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedParts.length === 0) {
            showToast("warn", "Warning", "No parts selected");
            return;
        }
        setSelectedPart(null);
        setDeleteOpen(true);
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
                    const headers = ["name", "part_number", "description", "quantity_in_stock", "min_stock", "location"];
                    if (headers[colNumber - 1]) {
                        rowData[headers[colNumber - 1]] = cell.value;
                    }
                });

                if (rowData.name) {
                    data.push(rowData);
                }
            });

            for (const item of data) {
                // Using the new API route handler
                const res = await fetch("/api/logistics/parts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(item)
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || "Import failed");
            }

            showToast("success", "Import Success", `${data.length} parts imported successfully`);
            fetchParts();
        } catch (err) {
            showToast("error", "Import Failed", err.message);
        }

        // Reset file input
        e.target.value = "";
    };

    //export excel
    const exportExcel = async () => {
        if (!parts.length) {
            showToast("warn", "No Data", "There are no parts to export");
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Parts");

            // Add headers
            const headers = columnOptions.filter((col) => col.visible).map((col) => col.header);
            worksheet.addRow(headers);

            // Add data with numbering
            parts.forEach((part, index) => {
                const rowData = [
                    index + 1, // Numbering
                    part.part_number || "-",
                    part.name || "-",
                    part.description || "-",
                    part.quantity_in_stock || 0,
                    part.min_stock || 0,
                    part.location || "-"
                ];
                worksheet.addRow(rowData);
            });

            // Style headers
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE0E0E0" }
                };
                cell.alignment = { vertical: "middle", horizontal: "center" };
            });

            // Auto-fit columns
            worksheet.columns.forEach((column, index) => {
                const header = headers[index];
                // Set column width based on header length
                column.width = Math.max(header.length * 1.5, 10);
                // Set number format for numeric columns
                if (index === 0 || index === 4 || index === 5) {
                    column.numFmt = "0";
                }
            });

            // Generate Excel file
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast("success", "Success", "Data exported to Excel successfully");
        } catch (error) {
            showToast("error", "Error", `Failed to export: ${error.message}`);
        }
    };
    // --- Export to PDF ---
    const exportPdf = (config = null) => {
        const currentConfig = config || printConfig;

        if (parts.length === 0) {
            showToast("warn", "No Data", "There are no parts to print");
            return;
        }

        const doc = new jsPDF({
            orientation: currentConfig.orientation,
            unit: currentConfig.unit,
            format: currentConfig.format
        });

        const headers = ["No", "Part Number", "Name", "Description", "Quantity Stock", "Minimun Stock", "Location"];

        const data = parts.map((part, index) => [(index + 1).toString(), part.part_number || "-", part.name || "-", part.description || "-", part.quantity_in_stock?.toString() || "0", part.min_stock?.toString() || "0", part.location || "-"]);

        doc.text("Parts Report", currentConfig.marginLeft, currentConfig.marginTop);

        autoTable(doc, {
            startY: currentConfig.marginTop + 10,
            head: [headers],
            body: data,
            margin: {
                left: currentConfig.marginLeft,
                right: currentConfig.marginRight,
                top: currentConfig.marginTop + 10,
                bottom: currentConfig.marginBottom
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setJsPdfPreviewOpen(true);
    };


    // --- Adjust Print Margins ---
    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        exportPdf(newConfig);
    };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
            <ConfirmDialog />
            <div className="card">
                <h3 className="mb-4">Parts Management</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button label="Back" icon="pi pi-arrow-left" outlined onClick={() => router.push("/dashboard")} />
                    <Button label="New" icon="pi pi-plus" outlined severity="success" onClick={() => setFormOpen(true)} />
                    <Divider layout="vertical" />
                    <Button label="Import" icon="pi pi-file-import" outlined onClick={() => fileInputRef.current?.click()} />
                    <Button label="Export" icon="pi pi-file-export" outlined onClick={exportExcel} />
                    <Button label="Print" icon="pi pi-print" outlined onClick={() => setAdjustDialog(true)} />
                    <Divider layout="vertical" />
                    <Button size="small" label={`Delete ${selectedParts.length > 0 ? ` (${selectedParts.length})` : ""}`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedParts.length === 0} />
                    <Divider layout="vertical" />
                    <Button label="Refresh" icon="pi pi-refresh" outlined onClick={handleRefresh} />
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
                    searchText={searchText}
                    onSearch={handleSearch}
                />

                {/* Dialogs */}
                <PartFormDialog visible={isFormOpen} onHide={() => setFormOpen(false)} part={selectedPart} fetchParts={fetchParts} showToast={showToast} />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    onHide={() => {
                        setDeleteOpen(false);
                        setSelectedPart(null);
                    }}
                    part={selectedPart}
                    selectedParts={selectedParts}
                    fetchParts={() => {
                        fetchParts();
                        setSelectedParts([]);
                    }}
                    showToast={showToast}
                />

                {/* Print Configuration Dialog */}
                <AdjustPrintMarginLaporan
                    key={adjustDialog ? "open" : "closed"}
                    adjustDialog={adjustDialog}
                    setAdjustDialog={setAdjustDialog}
                    handleAdjust={handleAdjust}
                    printConfig={printConfig}
                    setPrintConfig={setPrintConfig}
                    excel={exportExcel}
                />

                {/* PDF Preview Dialog */}
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setJsPdfPreviewOpen(false)} modal style={{ width: "90vw", height: "90vh" }} header="PDF Preview">
                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                </Dialog>
            </div>
        </div>
    );
};

export default PartPage;
