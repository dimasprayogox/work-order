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

import {
    frequencyBodyTemplate,
    nextDueDateBodyTemplate,
    machineBodyTemplate,
    actionBodyTemplate
} from "./components/ScheduleTable";
import CreateScheduleDialog from "./components/CreateScheduleDialog";
import EditScheduleDialog from "./components/EditScheduleDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import ScheduleDetailsDialog from "./components/ScheduleDetailsDialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

export default function SchedulePage() {
    const toast = useRef(null);
    const [schedules, setSchedules] = useState([]);
    const [selectedSchedules, setSelectedSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [frequencyFilter, setFrequencyFilter] = useState("");

    const [createDialogVisible, setCreateDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current.show({
            severity,
            summary,
            detail,
            life: 3000
        });
    }, []);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/manager/schedules`, {
                credentials: "include"
            });
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
        setSelectedSchedule(selectedSchedules[0]);
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/manager/schedules/${selectedSchedule.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Gagal menghapus Jadwal Perawatan");
            }

            showToast("success", "Berhasil", "Jadwal perawatan berhasil dihapus.");
            setDeleteDialogVisible(false);
            setSelectedSchedules([]);
            fetchSchedules();
        } catch (error) {
            showToast("error", "Error", error.message);
        }
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

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

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
                    <Dropdown
                        value={frequencyFilter}
                        options={frequencyOptions}
                        onChange={(e) => setFrequencyFilter(e.value)}
                        placeholder="Filter Frekuensi"
                        className="w-full md:w-auto"
                    />
                    <span className="p-input-icon-left flex-grow">
                        <i className="pi pi-search" />
                        <InputText
                            placeholder="Cari..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full"
                        />
                    </span>
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
                            header={
                                <div className="flex justify-content-between align-items-center">
                                    <span className="text-xl font-bold">Semua Jadwal</span>
                                    <span>Total: {filteredData.length}</span>
                                </div>
                            }
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                            <Column field="title" header="Judul" sortable />
                            <Column field="machine.name" header="Mesin" body={machineBodyTemplate} sortable />
                            <Column field="frequency" header="Frekuensi" body={frequencyBodyTemplate} sortable />
                            <Column field="next_due_date" header="Jatuh Tempo Berikutnya" body={nextDueDateBodyTemplate} sortable />
                            <Column field="created_by.full_name" header="Dibuat Oleh" sortable />
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

            <ConfirmDeleteDialog
                visible={deleteDialogVisible}
                onHide={() => setDeleteDialogVisible(false)}
                onConfirm={confirmDelete}
                itemType="jadwal perawatan"
                itemName={selectedSchedule?.title}
            />

            <ScheduleDetailsDialog
                visible={detailsDialogVisible}
                onHide={() => setDetailsDialogVisible(false)}
                schedule={selectedSchedule}
            />
        </div>
    );
}
