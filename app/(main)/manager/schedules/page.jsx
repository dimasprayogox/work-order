// my-project/app/(main)/manager/schedules/page.jsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from "primereact/dialog";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

import {
    frequencyBodyTemplate,
    nextDueDateBodyTemplate,
    machineBodyTemplate,
    actionBodyTemplate,
    createdByBodyTemplate
} from "./components/ScheduleTable"; // Sesuaikan path jika ini adalah komponen terpisah
import CreateScheduleDialog from "./components/CreateScheduleDialog";
import EditScheduleDialog from "./components/EditScheduleDialog";
import ScheduleDetailsDialog from "./components/ScheduleDetailsDialog";

const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

export default function SchedulePage() {
    const toast = useRef(null);
    const [schedules, setSchedules] = useState([]);
    const [selectedSchedules, setSelectedSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [frequencyFilter, setFrequencyFilter] = useState("");

    const [createDialogVisible, setCreateDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const fileInputRef = useRef(null);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("MaintenanceSchedules");
    const [printConfig, setPrintConfig] = useState({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });

    const columnOptions = [
        { field: 'title', header: 'Judul', visible: true },
        { field: 'description', header: 'Deskripsi', visible: true },
        { field: 'machine.name', header: 'Mesin', visible: true },
        { field: 'frequency', header: 'Frekuensi', visible: true },
        { field: 'next_due_date', header: 'Jatuh Tempo Berikutnya', visible: true },
        { field: 'priority', header: 'Prioritas', visible: true },
        { field: 'created_by.full_name', header: 'Dibuat Oleh', visible: true },
        { field: 'created_at', header: 'Dibuat Pada', visible: true },
        { field: 'updated_at', header: 'Terakhir Diperbarui', visible: true },
        { field: 'is_active', header: 'Aktif', visible: true },
    ];

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/manager/schedules`); // Menggunakan proxy API Next.js
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

    const handleScheduleCreated = useCallback(() => {
        showToast("success", "Berhasil", "Jadwal perawatan berhasil dibuat.");
        setCreateDialogVisible(false);
        fetchSchedules();
    }, [showToast, fetchSchedules]);

    const handleScheduleUpdated = useCallback(() => {
        showToast("success", "Berhasil", "Jadwal perawatan berhasil diperbarui.");
        setEditDialogVisible(false);
        fetchSchedules();
    }, [showToast, fetchSchedules]);

    const handleDeleteSelected = () => {
        if (selectedSchedules.length === 0) return;
        confirmDialog({
            message: `Anda yakin ingin menghapus ${selectedSchedules.length} Jadwal Perawatan terpilih?`,
            header: 'Konfirmasi Hapus',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ya',
            rejectLabel: 'Tidak',
            accept: async () => {
                setLoading(true);
                try {
                    for (const schedule of selectedSchedules) {
                        const response = await fetch(`/api/manager/schedules/${schedule.id}`, { // Menggunakan proxy API Next.js
                            method: "DELETE",
                        });
                        if (!response.ok) {
                            const result = await response.json();
                            throw new Error(result.message || `Gagal menghapus Jadwal: ${schedule.title}`);
                        }
                    }
                    showToast("success", "Berhasil", "Jadwal perawatan terpilih berhasil dihapus.");
                    fetchSchedules();
                    setSelectedSchedules([]);
                } catch (error) {
                    showToast("error", "Error", error.message);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleEditSchedule = (rowData) => {
        setSelectedSchedule(rowData);
        setEditDialogVisible(true);
    };

    const handleViewDetails = (rowData) => {
        setSelectedSchedule(rowData);
        setDetailsDialogVisible(true);
    };

    const filteredData = schedules.filter((schedule) => {
        const matchesFrequency = !frequencyFilter || schedule.frequency === frequencyFilter;
        const matchesSearch = !searchText ||
            schedule.title.toLowerCase().includes(searchText.toLowerCase()) ||
            (schedule.description && schedule.description.toLowerCase().includes(searchText.toLowerCase())) ||
            (schedule.machine && schedule.machine.name.toLowerCase().includes(searchText.toLowerCase()));
        return matchesFrequency && matchesSearch;
    });

    const frequencyOptions = [
        { label: "Semua Frekuensi", value: "" },
        { label: "Harian", value: "daily" },
        { label: "Mingguan", value: "weekly" },
        { label: "Bulanan", value: "monthly" },
        { label: "Tahunan", value: "yearly" }
    ];

    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Maintenance Schedules');

        const headers = columnOptions
            .filter(col => col.visible)
            .map(col => col.header);

        worksheet.addRow(headers);

        schedules.forEach(sch => {
            const rowData = columnOptions
                .filter(col => col.visible)
                .map(col => {
                    if (col.field === 'machine.name') {
                        return sch.machine?.name || 'N/A';
                    } else if (col.field === 'created_by.full_name') {
                        return sch.createdBy?.full_name || 'N/A';
                    } else if (col.field.includes('_date') || col.field.includes('_at')) {
                        return sch[col.field] ? new Date(sch[col.field]).toLocaleString("id-ID") : "N/A";
                    } else if (col.field === 'is_active') {
                        return sch.is_active ? 'Ya' : 'Tidak';
                    } else {
                        return sch[col.field];
                    }
                });
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

        const visibleColumns = columnOptions.filter(col => col.visible);

        const headers = visibleColumns.map(col => col.header);
        const data = schedules.map(sch => {
            return visibleColumns.map(col => {
                if (col.field === 'machine.name') {
                    return sch.machine?.name || 'N/A';
                } else if (col.field === 'created_by.full_name') {
                    return sch.createdBy?.full_name || 'N/A';
                } else if (col.field.includes('_date') || col.field.includes('_at')) {
                    return sch[col.field] ? new Date(sch[col.field]).toLocaleString("id-ID") : "N/A";
                } else if (col.field === 'is_active') {
                    return sch.is_active ? 'Ya' : 'Tidak';
                } else {
                    return sch[col.field];
                }
            });
        });

        doc.text('Laporan Jadwal Perawatan', printConfig.marginLeft, printConfig.marginTop);

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

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setJsPdfPreviewOpen(true);
        showToast("success", "Ekspor Berhasil", "Laporan jadwal berhasil dibuat dalam format PDF.");
    };

    const handlePrint = () => {
        setAdjustDialog(true);
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

                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber > 1) {
                        let rowObject = {};
                        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                            const headerCell = headerRow.getCell(colNumber);
                            if (headerCell && headerCell.value) {
                                const fieldName = headerCell.value.toString().toLowerCase().replace(/ /g, '_');
                                rowObject[fieldName] = cell.value;
                            }
                        });
                        jsonData.push(rowObject);
                    }
                });

                for (const item of jsonData) {
                    const payload = {
                        title: item.judul || item.title,
                        description: item.deskripsi || item.description,
                        machine_id: item.machine_id || item.mesin_id,
                        frequency: item.frekuensi || item.frequency,
                        next_due_date: item.next_due_date ? new Date(item.next_due_date).toISOString() : undefined,
                        priority: item.priority || 'medium',
                        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
                    };

                    const res = await fetch(`/api/manager/schedules`, { // Menggunakan proxy API Next.js
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                    if (!res.ok) {
                        const body = await res.json();
                        throw new Error(body.message || `Gagal mengimpor jadwal: ${item.title || 'Tidak diketahui'}`);
                    }
                }

                showToast("success", "Impor Berhasil", "Data jadwal berhasil diimpor.");
                await fetchSchedules();
            };
        } catch (err) {
            showToast("error", "Impor Gagal", err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const header = (
        <div className="flex flex-column md:flex-row justify-content-between gap-2">
            <div>
                <Dropdown
                    value={frequencyFilter}
                    options={frequencyOptions}
                    onChange={(e) => setFrequencyFilter(e.value)}
                    placeholder="Filter Frekuensi"
                    className="w-full md:w-auto"
                />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Cari kata kunci"
                    className="w-full md:w-auto"
                />
            </span>
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />

            <div className="card">
                <h3 className="text-2xl font-bold mb-4">Manajemen Jadwal Perawatan</h3>

                <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        onClick={fetchSchedules}
                        className="p-button-outlined"
                    />
                    <Button
                        label="Buat Jadwal Baru"
                        icon="pi pi-plus"
                        onClick={() => setCreateDialogVisible(true)}
                        className="p-button-primary"
                    />
                    <Button
                        label="Hapus Terpilih"
                        icon="pi pi-trash"
                        severity="danger"
                        onClick={handleDeleteSelected}
                        disabled={selectedSchedules.length === 0}
                        className="p-button-outlined"
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Impor"
                        icon="pi pi-file-import"
                        outlined
                        onClick={() => fileInputRef.current?.click()}
                        tooltip="Impor dari Excel"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                    <Button
                        size="small"
                        label="Ekspor"
                        icon="pi pi-file-export"
                        outlined
                        onClick={exportExcel}
                        tooltip="Ekspor ke Excel"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                    <Button
                        size="small"
                        label="Cetak"
                        icon="pi pi-print"
                        outlined
                        onClick={handlePrint}
                        tooltip="Cetak Laporan"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                </div>

                <Panel header="Daftar Jadwal Perawatan" className="shadow-2">
                    {loading ? (
                        <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}>
                            <ProgressSpinner />
                        </div>
                    ) : (
                        <DataTable
                            value={filteredData}
                            selection={selectedSchedules}
                            onSelectionChange={(e) => setSelectedSchedules(e.value)}
                            dataKey="id"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            emptyMessage="Tidak ada Jadwal Perawatan ditemukan"
                            selectionMode="multiple"
                            className="p-datatable-gridlines"
                            header={header}
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                            <Column field="title" header="Judul" sortable />
                            <Column field="machine.name" header="Mesin" body={machineBodyTemplate} sortable />
                            <Column field="frequency" header="Frekuensi" body={frequencyBodyTemplate} sortable />
                            <Column field="next_due_date" header="Jatuh Tempo Berikutnya" body={nextDueDateBodyTemplate} sortable />
                            <Column header="Dibuat Oleh" body={createdByBodyTemplate} sortable sortField="created_by.full_name" />
                            <Column
                                header="Aksi"
                                body={(rowData) => actionBodyTemplate(rowData, handleEditSchedule, handleViewDetails)}
                                style={{ minWidth: "12rem" }}
                            />
                        </DataTable>
                    )}
                </Panel>
            </div>

            <CreateScheduleDialog
                visible={createDialogVisible}
                onHide={() => setCreateDialogVisible(false)}
                showToast={showToast}
                onScheduleCreated={handleScheduleCreated}
            />

            <EditScheduleDialog
                visible={editDialogVisible}
                onHide={() => setEditDialogVisible(false)}
                schedule={selectedSchedule}
                showToast={showToast}
                onScheduleUpdated={handleScheduleUpdated}
            />

            <ScheduleDetailsDialog
                visible={detailsDialogVisible}
                onHide={() => setDetailsDialogVisible(false)}
                schedule={selectedSchedule}
            />

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImport}
                accept=".xlsx,.xls"
            />

            <AdjustPrintMarginLaporan
                adjustDialog={adjustDialog}
                setAdjustDialog={setAdjustDialog}
                handleAdjust={handleAdjust}
                printConfig={printConfig}
                setPrintConfig={setPrintConfig}
            />

            <Dialog
                visible={jsPdfPreviewOpen}
                onHide={() => setJsPdfPreviewOpen(false)}
                modal
                style={{ width: '90vw', height: '90vh' }}
                header="Pratinjau PDF"
            >
                <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
            </Dialog>
        </div>
    );
}