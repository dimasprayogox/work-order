"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import ScheduleTable from "./components/ScheduleTable";
import ScheduleFormDialog from "./components/ScheduleFormDialog";
import ScheduleDetailsDialog from "./components/ScheduleDetailsDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

export default function SchedulePage() {
    const toast = useRef(null);
    const [schedules, setSchedules] = useState([]);
    const [selectedSchedules, setSelectedSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [frequencyFilter, setFrequencyFilter] = useState("");
    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const fileInputRef = useRef(null);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName] = useState("MaintenanceSchedules");
    const [printConfig, setPrintConfig] = useState({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/manager/schedules`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal mengambil daftar Jadwal Perawatan");
            }

            setSchedules(result.data || []);
        } catch (error) {
            showToast("error", "Error", error.message);
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const handleEditSchedule = (rowData) => {
        setSelectedSchedule(rowData);
        
    };

    const handleViewDetails = (rowData) => {
        setSelectedSchedule(rowData);
        setDetailsDialogVisible(true);
    };

    const handleDelete = (schedule) => {
        setSelectedSchedule(schedule);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedSchedules.length === 0) {
            showToast("warn", "Peringatan", "Tidak ada part yang dipilih");
            return;
        }
        setSelectedSchedule(null);
        setDeleteOpen(true);
    };

    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Maintenance Schedules");

        const headers = ["No", "Judul", "Deskripsi", "Mesin", "Frekuensi", "Jatuh Tempo Berikutnya", "Prioritas", "Dibuat Oleh", "Dibuat Pada", "Terakhir Diperbarui", "Aktif"];

        worksheet.addRow(headers);

        schedules.forEach((sch, index) => {
            const rowData = [
                index + 1,
                sch.title,
                sch.description,
                sch.machine?.name || "N/A",
                sch.frequency,
                sch.next_due_date ? new Date(sch.next_due_date).toLocaleString("id-ID") : "N/A",
                sch.priority,
                sch.createdBy?.full_name || "N/A",
                sch.created_at ? new Date(sch.created_at).toLocaleString("id-ID") : "N/A",
                sch.updated_at ? new Date(sch.updated_at).toLocaleString("id-ID") : "N/A",
                sch.is_active ? "Ya" : "Tidak"
            ];
            worksheet.addRow(rowData);
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast("success", "Ekspor Berhasil", "Data jadwal berhasil diekspor ke Excel.");
    };

    const exportPdf = () => {
        const doc = new jsPDF({
            orientation: printConfig.orientation,
            unit: printConfig.unit,
            format: printConfig.format
        });

        const headers = ["No", "Judul", "Mesin", "Frekuensi", "Jatuh Tempo", "Prioritas", "Dibuat Oleh"];

        const data = schedules.map((sch, index) => [
            (index + 1).toString(),
            sch.title,
            sch.machine?.name || "N/A",
            sch.frequency,
            sch.next_due_date ? new Date(sch.next_due_date).toLocaleDateString("id-ID") : "N/A",
            sch.priority,
            sch.createdBy?.full_name || "N/A"
        ]);

        doc.text("Laporan Jadwal Perawatan", printConfig.marginLeft, printConfig.marginTop);

        autoTable(doc, {
            startY: printConfig.marginTop + 10,
            head: [headers],
            body: data,
            margin: {
                left: printConfig.marginLeft,
                right: printConfig.marginRight,
                top: printConfig.marginTop + 10,
                bottom: printConfig.marginBottom
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setJsPdfPreviewOpen(true);
        showToast("success", "Ekspor Berhasil", "Laporan jadwal berhasil dibuat dalam format PDF.");
    };

    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        setAdjustDialog(false);
        exportPdf();
    };

   const handleImport = async (e) => {
       const file = e.target.files?.[0];
       if (!file) return;

       setLoading(true);
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

               // Fungsi untuk parse berbagai format tanggal
               const parseDate = (dateValue) => {
                   if (!dateValue) return null;

                   // Jika sudah berupa Date object atau timestamp
                   if (dateValue instanceof Date) return dateValue;
                   if (typeof dateValue === "number") return new Date((dateValue - 25569) * 86400 * 1000);

                   const dateStr = dateValue.toString().trim();

                   // Format: "13/08/2025, 10.02.15" atau "1/8/2025, 1.02.15"
                   const idFormat = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?$/);
                   if (idFormat) {
                       const [_, day, month, year, hours, minutes, seconds] = idFormat;
                       return new Date(year, month - 1, day, hours, minutes, seconds || 0);
                   }

                   // Format ISO atau lainnya
                   const date = new Date(dateStr);
                   return isNaN(date.getTime()) ? null : date;
               };

               worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                   if (rowNumber > 1) {
                       let rowObject = {};
                       row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                           const headerCell = headerRow.getCell(colNumber);
                           if (headerCell && headerCell.value) {
                               const fieldName = headerCell.value.toString().toLowerCase().replace(/ /g, "_");
                               // Khusus kolom tanggal
                               if (["next_due_date", "scheduled_date", "created_at", "updated_at"].includes(fieldName)) {
                                   rowObject[fieldName] = parseDate(cell.value)?.toISOString();
                               } else {
                                   rowObject[fieldName] = cell.value;
                               }
                           }
                       });
                       jsonData.push(rowObject);
                   }
               });

               // Proses import dengan error handling lebih baik
               const results = await Promise.allSettled(
                   jsonData.map((item) => {
                       const payload = {
                           title: item.judul || item.title,
                           description: item.deskripsi || item.description,
                           machine_id: item.machine_id || item.mesin_id,
                           frequency: item.frekuensi || item.frequency,
                           next_due_date: item.next_due_date || undefined,
                           priority: item.priority || "medium",
                           is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
                       };

                       return fetch(`/api/manager/schedules`, {
                           method: "POST",
                           headers: { "Content-Type": "application/json" },
                           body: JSON.stringify(payload)
                       });
                   })
               );

               // Cek hasil import
               const failedImports = results.filter((r) => r.status === "rejected" || !r.value.ok);
               if (failedImports.length > 0) {
                   const errorDetails = failedImports.map((r, i) => `Baris ${i + 2}: ${r.reason?.message || r.value?.statusText || "Error tidak diketahui"}`).join("\n");
                   throw new Error(`Beberapa data gagal diimpor:\n${errorDetails}`);
               }

               showToast("success", "Impor Berhasil", `${jsonData.length} jadwal berhasil diimpor`);
               await fetchSchedules();
           };
       } catch (err) {
           showToast("error", "Impor Gagal", err.message.includes("\n") ? err.message : `Gagal mengimpor: ${err.message}`);
       } finally {
           setLoading(false);
           if (fileInputRef.current) {
               fileInputRef.current.value = "";
           }
       }
   };

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
            <ConfirmDialog />
            <div className="card">
                <h3 className="mb-4">Schedules Maintenance</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button
                        size="small"
                        label="New"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => {
                            setSelectedSchedule(null);
                            setFormOpen(true);
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined onClick={() => fileInputRef.current?.click()} />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined onClick={exportExcel} />
                    <Button size="small" label="Print" icon="pi pi-print" outlined onClick={() => setAdjustDialog(true)} />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label={`Delete${selectedSchedules?.length > 0 ? ` (${selectedSchedules.length})` : ""}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={handleDeleteSelected}
                        disabled={!selectedSchedules || selectedSchedules.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchSchedules} disabled={loading} />
                </div>

                <ScheduleTable
                    schedules={schedules}
                    loading={loading}
                    selectedSchedules={selectedSchedules}
                    setSelectedSchedules={setSelectedSchedules}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    frequencyFilter={frequencyFilter}
                    setFrequencyFilter={setFrequencyFilter}
                    handleEditSchedule={handleEditSchedule}
                    onEdit={(p) => {
                        setSelectedSchedule(p);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                    handleViewDetails={handleViewDetails}
                />
            </div>

            <ScheduleFormDialog visible={isFormOpen} onHide={() => setFormOpen(false)} schedule={selectedSchedule} fetchSchedules={fetchSchedules} showToast={showToast} />

            <ScheduleDetailsDialog visible={detailsDialogVisible} onHide={() => setDetailsDialogVisible(false)} schedule={selectedSchedule} />

            <ConfirmDeleteDialog
                visible={isDeleteOpen}
                onHide={() => {
                    setDeleteOpen(false);
                    setSelectedSchedules([]);
                }}
                schedule={selectedSchedule}
                selectedSchedules={selectedSchedules}
                fetchSchedules={() => {
                    fetchSchedules();
                    setSelectedSchedules([]);
                }}
                showToast={showToast}
            />
            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleImport} accept=".xlsx,.xls" />

            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} printConfig={printConfig} excel={exportExcel} setPrintConfig={setPrintConfig} />

            <Dialog visible={jsPdfPreviewOpen} onHide={() => setJsPdfPreviewOpen(false)} modal style={{ width: "90vw", height: "90vh" }} header="Pratinjau PDF">
                <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
            </Dialog>
        </div>
    );
}
