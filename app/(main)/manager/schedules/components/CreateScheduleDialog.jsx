"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Message } from "primereact/message";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

export default function CreateScheduleDialog({ visible, onHide, showToast, onScheduleCreated }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        machine_id: "",
        frequency: "",
        next_due_date: null,
        priority: "medium"
    });
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState([]);

    const frequencyOptions = [
        { label: "Harian", value: "daily" },
        { label: "Mingguan", value: "weekly" },
        { label: "Bulanan", value: "monthly" },
        { label: "Tahunan", value: "yearly" }
    ];

    const priorityOptions = [
        { label: "Rendah", value: "low" },
        { label: "Sedang", value: "medium" },
        { label: "Tinggi", value: "high" }
    ];

    useEffect(() => {
        if (visible) {
            setFormData({
                title: "",
                description: "",
                machine_id: "",
                frequency: "",
                next_due_date: null,
                priority: "medium"
            });
            setFormErrors({});
            fetchMachines();
        }
    }, [visible]);

    const fetchMachines = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/manager/machines`, {
                credentials: "include"
            });
            const result = await response.json();
            if (response.ok) {
                setMachines(result.data.map(m => ({ label: m.name, value: m.id })));
            } else {
                throw new Error(result.message || "Gagal mengambil daftar mesin");
            }
        } catch (error) {
            showToast("error", "Error", error.message);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title.trim()) errors.title = "Judul wajib diisi.";
        if (!formData.machine_id) errors.machine_id = "Mesin wajib diisi.";
        if (!formData.frequency) errors.frequency = "Frekuensi wajib diisi.";
        if (!formData.next_due_date) errors.next_due_date = "Tanggal jatuh tempo wajib diisi.";
        if (formData.next_due_date && new Date(formData.next_due_date) < new Date()) {
            errors.next_due_date = "Tanggal jatuh tempo tidak boleh di masa lalu.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                ...formData,
                next_due_date: formData.next_due_date.toISOString(),
            };

            const response = await fetch(`${API_BASE_URL}/manager/schedules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Gagal membuat jadwal perawatan.");
            }

            onScheduleCreated();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Simpan" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    );

    return (
        <Dialog
            header="Buat Jadwal Perawatan Baru"
            visible={visible}
            style={{ width: "min(95vw, 600px)" }}
            modal
            onHide={onHide}
            footer={dialogFooter}
            className="p-shadow-24 surface-card border-round"
        >
            <div className="p-fluid formgrid grid">
                <div className="field col-12">
                    <label htmlFor="title" className="font-bold mb-2 block">Judul</label>
                    <InputText
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={formErrors.title ? "p-invalid" : ""}
                    />
                    {formErrors.title && <Message severity="error" text={formErrors.title} />}
                </div>

                <div className="field col-12">
                    <label htmlFor="description" className="font-bold mb-2 block">Deskripsi</label>
                    <InputTextarea
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        autoResize
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="machine" className="font-bold mb-2 block">Mesin</label>
                    <Dropdown
                        id="machine"
                        value={formData.machine_id}
                        options={machines}
                        onChange={(e) => setFormData({ ...formData, machine_id: e.value })}
                        placeholder="Pilih Mesin"
                        className={formErrors.machine_id ? "p-invalid" : ""}
                    />
                    {formErrors.machine_id && <Message severity="error" text={formErrors.machine_id} />}
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="frequency" className="font-bold mb-2 block">Frekuensi</label>
                    <Dropdown
                        id="frequency"
                        value={formData.frequency}
                        options={frequencyOptions}
                        onChange={(e) => setFormData({ ...formData, frequency: e.value })}
                        placeholder="Pilih Frekuensi"
                        className={formErrors.frequency ? "p-invalid" : ""}
                    />
                    {formErrors.frequency && <Message severity="error" text={formErrors.frequency} />}
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="next_due_date" className="font-bold mb-2 block">Jatuh Tempo Berikutnya</label>
                    <Calendar
                        id="next_due_date"
                        value={formData.next_due_date}
                        onChange={(e) => setFormData({ ...formData, next_due_date: e.value })}
                        showTime
                        hourFormat="24"
                        minDate={new Date()}
                        className={formErrors.next_due_date ? "p-invalid" : ""}
                    />
                    {formErrors.next_due_date && <Message severity="error" text={formErrors.next_due_date} />}
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="priority" className="font-bold mb-2 block">Prioritas</label>
                    <Dropdown
                        id="priority"
                        value={formData.priority}
                        options={priorityOptions}
                        onChange={(e) => setFormData({ ...formData, priority: e.value })}
                        placeholder="Pilih Prioritas"
                    />
                </div>
            </div>
        </Dialog>
    );
}
