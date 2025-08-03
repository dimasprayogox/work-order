"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";
import { Checkbox } from "primereact/checkbox";

const ScheduleFormDialog = ({ visible, onHide, schedule, machines, fetchSchedules, showToast }) => {
    const [form, setForm] = useState({
        title: "",
        description: "",
        machine_id: "",
        frequency: "",
        priority: "medium",
        next_due_date: null,
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Options for dropdowns
    const frequencyOptions = [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' }
    ];

    const priorityOptions = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' }
    ];

    // Mengisi dan mereset form
    useEffect(() => {
        if (schedule) {
            setForm({
                title: schedule.title || "",
                description: schedule.description || "",
                machine_id: schedule.machine_id || "",
                frequency: schedule.frequency || "",
                priority: schedule.priority || "medium",
                next_due_date: schedule.next_due_date ? new Date(schedule.next_due_date) : null,
                is_active: typeof schedule.is_active === "boolean"
                    ? schedule.is_active
                    : Boolean(Number(schedule.is_active))
            });
        } else {
            setForm({
                title: "",
                description: "",
                machine_id: "",
                frequency: "",
                priority: "medium",
                next_due_date: null,
                is_active: true
            });
        }
        setSubmitted(false);
    }, [schedule, visible]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const { title, machine_id, frequency, next_due_date } = form;
        return title.trim() && machine_id && frequency && next_due_date;
    };

    // Handler untuk submit form
    const handleSubmit = async () => {
        setSubmitted(true);
        if (!validateForm()) {
            showToast("error", "Error", "Harap lengkapi semua field yang wajib diisi");
            return;
        }

        setLoading(true);
        try {
            const formData = {
                title: form.title,
                description: form.description,
                machine_id: form.machine_id,
                frequency: form.frequency,
                priority: form.priority,
                next_due_date: form.next_due_date.toISOString(),
                is_active: form.is_active // <-- tambahkan ini
            };

            const res = await fetch(
                schedule ? `/api/admin/schedules/${schedule.id}` : "/api/admin/schedules",
                {
                    method: schedule ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(formData)
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan");

            showToast("success", "Sukses", data.message || "Data berhasil disimpan");
            fetchSchedules();
            onHide();
        } catch (error) {
            console.error("Submit error:", error);
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const machineOptions = machines.map(machine => ({
        label: `${machine.name} (${machine.machine_code || machine.id})`,
        value: machine.id
    }));

    const footerContent = (
        <div className="flex justify-end gap-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
                disabled={loading}
            />
            <Button
                label={schedule ? "Update" : "Save"}
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
            />
        </div>
    );

    return (
        <Dialog
            header={schedule ? "Edit Schedule" : "Add New Schedule"}
            visible={visible}
            style={{ width: "40rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
            footer={footerContent}
        >
            <div className="formgrid grid">
                {/* Title Field */}
                <div className="field col-12">
                    <label htmlFor="title" className="font-medium">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="title"
                        value={form.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder="Enter schedule title"
                        className={classNames({ "p-invalid": submitted && !form.title.trim() })}
                    />
                    {submitted && !form.title.trim() && <small className="p-error">Title is required</small>}
                </div>

                {/* Machine Field */}
                <div className="field col-12">
                    <label htmlFor="machine_id" className="font-medium">
                        Machine <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="machine_id"
                        value={form.machine_id}
                        options={machineOptions}
                        onChange={(e) => handleChange("machine_id", e.value)}
                        placeholder="Select machine"
                        filter
                        showClear
                        className={classNames({ "p-invalid": submitted && !form.machine_id })}
                    />
                    {submitted && !form.machine_id && <small className="p-error">Machine is required</small>}
                </div>

                {/* Frequency and Priority Row */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="frequency" className="font-medium">
                        Frequency <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="frequency"
                        value={form.frequency}
                        options={frequencyOptions}
                        onChange={(e) => handleChange("frequency", e.value)}
                        placeholder="Select frequency"
                        className={classNames({ "p-invalid": submitted && !form.frequency })}
                    />
                    {submitted && !form.frequency && <small className="p-error">Frequency is required</small>}
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="priority" className="font-medium">Priority</label>
                    <Dropdown
                        id="priority"
                        value={form.priority}
                        options={priorityOptions}
                        onChange={(e) => handleChange("priority", e.value)}
                        placeholder="Select priority"
                    />
                </div>

                {/* Next Due Date Field */}
                <div className="field col-12">
                    <label htmlFor="next_due_date" className="font-medium">
                        Next Due Date <span className="text-red-500">*</span>
                    </label>
                    <Calendar
                        id="next_due_date"
                        value={form.next_due_date}
                        onChange={(e) => handleChange("next_due_date", e.value)}
                        showTime
                        hourFormat="24"
                        placeholder="Select next due date"
                        dateFormat="dd/mm/yy"
                        className={classNames({ "p-invalid": submitted && !form.next_due_date })}
                    />
                    {submitted && !form.next_due_date && <small className="p-error">Next due date is required</small>}
                    <small className="text-gray-500">
                        This will be the first maintenance date. Future dates will be calculated automatically based on frequency.
                    </small>
                </div>

                {/* Description Field */}
                <div className="field col-12">
                    <label htmlFor="description" className="font-medium">Description</label>
                    <InputTextarea
                        id="description"
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Describe the maintenance schedule"
                        rows={3}
                    />
                    <small className="text-gray-500">Optional: Provide additional details about this maintenance schedule</small>
                </div>

                {/* Active Status Field */}
                <div className="field mb-4">
                    <label htmlFor="is_active" className="font-semibold text-gray-800 block mb-2">
                        Aktifkan Jadwal
                    </label>
                    <Checkbox
                        inputId="is_active"
                        checked={form.is_active}
                        onChange={e => setForm({ ...form, is_active: e.checked })}
                    />
                    <span className="ml-2">{form.is_active ? "Aktif" : "Nonaktif"}</span>
                </div>
            </div>
        </Dialog>
    );
};

export default ScheduleFormDialog;
