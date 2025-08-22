"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect, useRef } from "react";
import { Checkbox } from "primereact/checkbox";

const ScheduleFormDialog = ({ visible, onHide, schedule, machines, assets, fetchSchedules, showToast }) => {
    const [form, setForm] = useState({
        title: "",
        description: "",
        type: "machine",
        machine_id: "",
        asset_id: "",
        frequency: "",
        priority: "medium",
        next_due_date: null,
        is_active: true
    });

    const [tempDate, setTempDate] = useState(null);
    const calendarRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const typeOptions = [
        { label: "Machine", value: "machine" },
        { label: "Asset", value: "asset" }
    ];
    // Options for dropdowns
    const frequencyOptions = [
        { label: "Daily", value: "daily" },
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" }
    ];

    const priorityOptions = [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" }
    ];

    // Mengisi dan mereset form
    useEffect(() => {
        if (schedule) {
            const scheduleDate = schedule.next_due_date ? new Date(schedule.next_due_date) : null;
            setForm({
                title: schedule.title || "",
                description: schedule.description || "",
                type: schedule.type || "machine",
                machine_id: schedule.machine_id || "",
                asset_id: schedule.asset_id || "",
                frequency: schedule.frequency || "",
                priority: schedule.priority || "medium",
                next_due_date: scheduleDate,
                is_active: typeof schedule.is_active === "boolean" ? schedule.is_active : Boolean(Number(schedule.is_active))
            });
            setTempDate(scheduleDate);
        } else {
            setForm({
                title: "",
                description: "",
                type: "machine",
                machine_id: "",
                asset_id: "",
                frequency: "",
                priority: "medium",
                next_due_date: null,
                is_active: true
            });
            setTempDate(null);
        }
        setSubmitted(false);
    }, [schedule, visible]);

    const handleChange = (field, value) => {
        setForm((prev) => {
            const newForm = { ...prev, [field]: value };

            // Reset machine_id/asset_id when type changes
            if (field === "type") {
                if (value === "machine") {
                    newForm.asset_id = "";
                } else if (value === "asset") {
                    newForm.machine_id = "";
                }
            }

            return newForm;
        });
    };
    const validateForm = () => {
        const { title, type, machine_id, asset_id, frequency, next_due_date } = form;
        const baseValid = title.trim() && type && frequency && next_due_date;

        if (!baseValid) return false;

        // Type-based validation
        if (type === "machine" && !machine_id) return false;
        if (type === "asset" && !asset_id) return false;

        return true;
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
                type: form.type,
                frequency: form.frequency,
                priority: form.priority,
                next_due_date: form.next_due_date.toISOString(),
                is_active: form.is_active
            };

            // Add type-specific fields
            if (form.type === "machine" && form.machine_id) {
                formData.machine_id = form.machine_id;
            }
            if (form.type === "asset" && form.asset_id) {
                formData.asset_id = form.asset_id;
            }

            console.log("Sending data:", JSON.stringify(formData, null, 2)); // Debug log

            const res = await fetch(schedule ? `/api/manager/schedules/${schedule.id}` : "/api/manager/schedules", {
                method: schedule ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            console.log("Response:", data); // Debug log

            if (!res.ok) {
                console.error("Submit error details:", data); // Debug log
                console.error("Validation errors:", JSON.stringify(data.errors, null, 2)); // More detailed error log
                throw new Error(data.message || "Gagal menyimpan");
            }

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

    const machineOptions = machines.map((machine) => ({
        label: `${machine.name} (${machine.machine_code || machine.id})`,
        value: machine.id
    }));

    const assetOptions = assets.map((asset) => ({
        label: `${asset.name} (${asset.asset_code || asset.id})`,
        value: asset.id
    }));

    const footerContent = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
            <Button label={schedule ? "Update" : "Save"} icon="pi pi-check" onClick={handleSubmit} loading={loading} disabled={loading} />
        </div>
    );

    const handleApplyDate = () => {
        handleChange("next_due_date", tempDate);
        calendarRef.current?.hide();
    };

    const handleCancelDate = () => {
        setTempDate(form.next_due_date);
        calendarRef.current?.hide();
    };

    const calendarFooterTemplate = () => (
        <div>
            <div className="flex justify-end w-full col-12">
                 <Button label="Submit" icon="pi pi-check" onClick={handleApplyDate} />
            </div>
        </div>
    );

    return (
        <Dialog header={schedule ? "Edit Schedule" : "Add New Schedule"} visible={visible} style={{ width: "40rem" }} breakpoints={{ "960px": "75vw", "641px": "90vw" }} onHide={onHide} modal className="p-fluid">
            <div className="formgrid grid">
                {/* Title Field */}
                <div className="field col-12">
                    <label htmlFor="title" className="font-medium">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <InputText id="title" value={form.title} onChange={(e) => handleChange("title", e.target.value)} className={classNames({ "p-invalid": submitted && !form.title.trim() })} />
                    {submitted && !form.title.trim() && <small className="p-error">Title is required</small>}
                </div>

                {/* Type Field */}
                <div className="field col-12">
                    <label htmlFor="type" className="font-medium">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <Dropdown id="type" value={form.type} options={typeOptions} onChange={(e) => handleChange("type", e.value)} placeholder="Select type" className={classNames({ "p-invalid": submitted && !form.type })} />
                    {submitted && !form.type && <small className="p-error">Type is required</small>}
                </div>

                {/* Machine Field - shown when type is machine */}
                {form.type === "machine" && (
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
                            className={classNames({ "p-invalid": submitted && form.type === "machine" && !form.machine_id })}
                        />
                        {submitted && form.type === "machine" && !form.machine_id && <small className="p-error">Machine is required</small>}
                    </div>
                )}

                {/* Asset Field - shown when type is asset */}
                {form.type === "asset" && (
                    <div className="field col-12">
                        <label htmlFor="asset_id" className="font-medium">
                            Asset <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            id="asset_id"
                            value={form.asset_id}
                            options={assetOptions}
                            onChange={(e) => handleChange("asset_id", e.value)}
                            placeholder="Select asset"
                            filter
                            showClear
                            className={classNames({ "p-invalid": submitted && form.type === "asset" && !form.asset_id })}
                        />
                        {submitted && form.type === "asset" && !form.asset_id && <small className="p-error">Asset is required</small>}
                    </div>
                )}

                {/* Frequency and Priority Row */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="frequency" className="font-medium">
                        Frequency <span className="text-red-500">*</span>
                    </label>
                    <Dropdown id="frequency" value={form.frequency} options={frequencyOptions} onChange={(e) => handleChange("frequency", e.value)} className={classNames({ "p-invalid": submitted && !form.frequency })} />
                    {submitted && !form.frequency && <small className="p-error">Frequency is required</small>}
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="priority" className="font-medium">
                        Priority
                    </label>
                    <Dropdown id="priority" value={form.priority} options={priorityOptions} onChange={(e) => handleChange("priority", e.value)} />
                </div>

                {/* Next Due Date Field */}
                <div className="field col-12">
                    <label htmlFor="next_due_date" className="font-medium">
                        Next Due Date <span className="text-red-500">*</span>
                    </label>
                    <Calendar
                        id="next_due_date"
                        ref={calendarRef}
                        value={tempDate}
                        onChange={(e) => setTempDate(e.value)}
                        onHide={handleCancelDate}
                        showTime
                        hourFormat="24"
                        placeholder="Select due date"
                        dateFormat="dd/mm/yy"
                        showButtonBar
                        footerTemplate={calendarFooterTemplate}
                        className={classNames({ "p-invalid": submitted && !form.next_due_date })}
                    />
                    {submitted && !form.next_due_date && <small className="p-error">Next due date is required</small>}
                </div>

                {/* Description Field */}
                <div className="field col-12">
                    <label htmlFor="description" className="font-medium">
                        Description
                    </label>
                    <InputTextarea id="description" value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={3} />
                </div>

                {/* Active Status Field */}
                <div className="field col-12 mb-4">
                    <label htmlFor="is_active" className="font-semibold text-gray-800 block mb-2">
                        Aktifkan Jadwal
                    </label>
                    <Checkbox inputId="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.checked })} />
                    <span className="ml-2">{form.is_active ? "Aktif" : "Nonaktif"}</span>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
                <Button label={schedule ? "Update" : "Save"} icon="pi pi-check" onClick={handleSubmit} loading={loading} disabled={loading} />
            </div>
        </Dialog>
    );
};

export default ScheduleFormDialog;
