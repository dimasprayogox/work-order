"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { classNames } from "primereact/utils";
import { useState, useEffect, useCallback } from "react";

const WorkOrderFormDialog = ({ visible, onHide, workOrder, fetchWorkOrders, showToast }) => {
    const [form, setForm] = useState({
        title: "",
        description: "",
        machine_id: "",
        scheduled_date: null,
        priority: "medium"
    });
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState([]);
    const [submitted] = useState(false);

    const priorityOptions = [
        { label: "Rendah", value: "low" },
        { label: "Sedang", value: "medium" },
        { label: "Tinggi", value: "high" }
    ];

    const fetchMachines = useCallback(async () => {
        try {
            const response = await fetch("/api/manager/machines", {
                credentials: "include"
            });
            const result = await response.json();
            if (response.ok) {
                setMachines(result.data.map((m) => ({ label: m.name, value: m.id })));
            } else {
                throw new Error(result.message || "Gagal mengambil daftar mesin");
            }
        } catch (error) {
            showToast("error", "Error", error.message);
        }
    }, [showToast]);

    useEffect(() => {
        if (visible) {
            if (workOrder) {
                setForm({
                    title: workOrder.title || "",
                    description: workOrder.description || "",
                    machine_id: workOrder.machine_id || "",
                    scheduled_date: workOrder.scheduled_date ? new Date(workOrder.scheduled_date) : null,
                    priority: workOrder.priority || "medium"
                });
            } else {
                setForm({
                    title: "",
                    description: "",
                    machine_id: "",
                    scheduled_date: null,
                    priority: "medium"
                });
            }
            setFormErrors({});
            fetchMachines();
        }
    }, [visible, workOrder, fetchMachines]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!form.title.trim()) errors.title = "Judul wajib diisi.";
        if (!form.machine_id) errors.machine_id = "Mesin wajib diisi.";
        if (!form.scheduled_date) errors.scheduled_date = "Tanggal terjadwal wajib diisi.";
        if (form.scheduled_date && new Date(form.scheduled_date).getTime() < new Date().getTime()) {
            errors.scheduled_date = "Tanggal terjadwal tidak boleh di masa lalu.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                ...form,
                scheduled_date: form.scheduled_date.toISOString()
            };

            const endpoint = workOrder ? `/api/manager/work-orders/${workOrder.id}` : "/api/manager/work-orders";
            const method = workOrder ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `Gagal ${workOrder ? "memperbarui" : "membuat"} work order`);
            }

            showToast("success", "Berhasil", `Work order berhasil ${workOrder ? "diperbarui" : "dibuat"}.`);
            fetchWorkOrders();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header={workOrder ? `Edit Work Order: ${workOrder.title || ""}` : "Buat Work Order Baru"}
            visible={visible}
            style={{ width: "min(95vw, 600px)" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            modal
            onHide={onHide}
            className="p-fluid p-shadow-24 surface-card border-round"
        >
            <div className="formgrid grid">
                <div className="field col-12">
                    <label htmlFor="title" className="font-bold mb-2 block">
                        Judul <span className="text-red-500">*</span>
                    </label>
                    <InputText id="title" value={form.title} onChange={(e) => handleChange("title", e.target.value)} className={classNames({ "p-invalid": submitted || formErrors.title })} />
                    {(submitted || formErrors.title) && <small className="p-error">{formErrors.title}</small>}
                </div>

                <div className="field col-12">
                    <label htmlFor="description" className="font-bold mb-2 block">
                        Deskripsi
                    </label>
                    <InputTextarea id="description" rows={3} value={form.description} onChange={(e) => handleChange("description", e.target.value)} autoResize />
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="machine_id" className="font-bold mb-2 block">
                        Mesin <span className="text-red-500">*</span>
                    </label>
                    <Dropdown id="machine_id" value={form.machine_id} options={machines} onChange={(e) => handleChange("machine_id", e.value)} placeholder="Pilih Mesin" className={classNames({ "p-invalid": submitted || formErrors.machine_id })} />
                    {(submitted || formErrors.machine_id) && <small className="p-error">{formErrors.machine_id}</small>}
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="priority" className="font-bold mb-2 block">
                        Prioritas
                    </label>
                    <Dropdown id="priority" value={form.priority} options={priorityOptions} onChange={(e) => handleChange("priority", e.value)} placeholder="Pilih Prioritas" />
                </div>

                <div className="field col-12">
                    <label htmlFor="scheduled_date" className="font-bold mb-2 block">
                        Tanggal Terjadwal <span className="text-red-500">*</span>
                    </label>
                    <Calendar
                        id="scheduled_date"
                        value={form.scheduled_date}
                        onChange={(e) => handleChange("scheduled_date", e.value)}
                        showTime
                        hourFormat="24"
                        minDate={new Date()}
                        className={classNames({ "p-invalid": submitted || formErrors.scheduled_date })}
                    />
                    {(submitted || formErrors.scheduled_date) && <small className="p-error">{formErrors.scheduled_date}</small>}
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button label="Batal" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
                <Button label={workOrder ? "Simpan Perubahan" : "Simpan"} icon="pi pi-check" onClick={handleSubmit} loading={loading} disabled={loading} />
            </div>
        </Dialog>
    );
};

export default WorkOrderFormDialog;
