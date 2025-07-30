"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Message } from "primereact/message";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

export default function CreateWorkOrderDialog({ visible, onHide, showToast, onWorkOrderCreated }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        machine_id: "",
        priority: "medium",
        scheduled_date: null,
    });
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState([]);

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
                priority: "medium",
                scheduled_date: null,
            });
            setFormErrors({});
            fetchMachines();
        }
    }, [visible, fetchMachines]);

    const fetchMachines = useCallback(async () => {
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
    }, [showToast]);

    const validateForm = () => {
        const errors = {};
        if (!formData.title.trim()) errors.title = "Judul wajib diisi.";
        if (!formData.machine_id) errors.machine_id = "Mesin wajib diisi.";
        if (!formData.scheduled_date) errors.scheduled_date = "Tanggal jadwal wajib diisi.";
        if (formData.scheduled_date && new Date(formData.scheduled_date) < new Date()) {
            errors.scheduled_date = "Tanggal jadwal tidak boleh di masa lalu.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                machine_id: formData.machine_id,
                priority: formData.priority,
                scheduled_date: formData.scheduled_date.toISOString(),
            };

            const response = await fetch(`${API_BASE_URL}/manager/work-orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Gagal membuat Work Order baru.");
            }

            onWorkOrderCreated();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Buat" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    );

    return (
        <Dialog
            header="Buat Work Order Baru"
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
                    <label htmlFor="priority" className="font-bold mb-2 block">Prioritas</label>
                    <Dropdown
                        id="priority"
                        value={formData.priority}
                        options={priorityOptions}
                        onChange={(e) => setFormData({ ...formData, priority: e.value })}
                        placeholder="Pilih Prioritas"
                    />
                </div>

                <div className="field col-12">
                    <label htmlFor="scheduled_date" className="font-bold mb-2 block">Tanggal Terjadwal</label>
                    <Calendar
                        id="scheduled_date"
                        value={formData.scheduled_date}
                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.value })}
                        showTime
                        hourFormat="24"
                        minDate={new Date()}
                        className={formErrors.scheduled_date ? "p-invalid" : ""}
                    />
                    {formErrors.scheduled_date && <Message severity="error" text={formErrors.scheduled_date} />}
                </div>
            </div>
        </Dialog>
    );
}
