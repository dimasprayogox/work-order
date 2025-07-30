"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const MachineFormDialog = ({ visible, onHide, machine, categories, fetchMachines, showToast }) => {
    const [form, setForm] = useState({
        machine_code: "",
        name: "",
        location: "",
        status: "operational",
        category_id: ""
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const statusOptions = [
        { label: "Operational", value: "operational" },
        { label: "Maintenance", value: "maintenance" },
        { label: "Down", value: "down" }
    ];

    useEffect(() => {
        if (machine) {
            setForm({
                machine_code: machine.machine_code || "",
                name: machine.name || "",
                location: machine.location || "",
                status: machine.status || "operational",
                category_id: machine.category_id || ""
            });
        } else {
            setForm({
                machine_code: "",
                name: "",
                location: "",
                status: "operational",
                category_id: ""
            });
        }
        setSubmitted(false);
    }, [machine, visible]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const { machine_code, name, location } = form;
        return machine_code.trim() && name.trim() && location.trim();
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        if (!validateForm()) {
            showToast("error", "Error", "Harap lengkapi semua field yang wajib diisi");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                machine ? `/api/admin/machines/${machine.id}` : "/api/admin/machines",
                {
                    method: machine ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(form)
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan");
            showToast("success", "Sukses", data.message || "Data berhasil disimpan");
            fetchMachines();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = categories.map(cat => ({
        label: cat.name,
        value: cat.id
    }));

    return (
        <Dialog
            header={machine ? "Edit Machine" : "Add New Machine"}
            visible={visible}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
        >
            <div className="field grid mb-4">
                <label htmlFor="machine_code" className="col-12 mb-2 font-medium">
                    Machine Code <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="machine_code"
                        value={form.machine_code}
                        onChange={(e) => handleChange("machine_code", e.target.value)}
                        placeholder="Enter machine code"
                        className={classNames({ "p-invalid": submitted && !form.machine_code.trim() })}
                    />
                    {submitted && !form.machine_code.trim() && <small className="p-error">Machine code is required</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="name" className="col-12 mb-2 font-medium">
                    Machine Name <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Enter machine name"
                        className={classNames({ "p-invalid": submitted && !form.name.trim() })}
                    />
                    {submitted && !form.name.trim() && <small className="p-error">Machine name is required</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="location" className="col-12 mb-2 font-medium">
                    Location <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="location"
                        value={form.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                        placeholder="Enter location"
                        className={classNames({ "p-invalid": submitted && !form.location.trim() })}
                    />
                    {submitted && !form.location.trim() && <small className="p-error">Location is required</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="status" className="col-12 mb-2 font-medium">
                    Status
                </label>
                <div className="col-12">
                    <Dropdown
                        id="status"
                        value={form.status}
                        options={statusOptions}
                        onChange={(e) => handleChange("status", e.value)}
                        placeholder="Select status"
                    />
                </div>
            </div>

            <div className="field grid mb-6">
                <label htmlFor="category_id" className="col-12 mb-2 font-medium">
                    Category
                </label>
                <div className="col-12">
                    <Dropdown
                        id="category_id"
                        value={form.category_id}
                        options={categoryOptions}
                        onChange={(e) => handleChange("category_id", e.value)}
                        placeholder="Select category"
                        showClear
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={onHide}
                    className="p-button-text"
                    disabled={loading}
                />
                <Button
                    label={machine ? "Update" : "Save"}
                    icon="pi pi-check"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading}
                />
            </div>
        </Dialog>
    );
};

export default MachineFormDialog;
