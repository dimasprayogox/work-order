// app/(main)/admin/assets/components/AssetFormDialog.jsx
"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const AssetFormDialog = ({ visible, onHide, asset, categories, divisions, fetchAssets, showToast }) => {
    const [form, setForm] = useState({
        asset_code: "",
        name: "",
        location: "",
        status: "operational",
        category_id: "",
        division_id: "",
        type: ""
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const statusOptions = [
        { label: "Operational", value: "operational" },
        { label: "Maintenance", value: "maintenance" },
        { label: "Down", value: "down" },
        { label: "Inactive", value: "inactive" }
    ];

    useEffect(() => {
        if (asset) {
            setForm({
                asset_code: asset.asset_code || "",
                name: asset.name || "",
                location: asset.location || "",
                status: asset.status || "operational",
                category_id: asset.category_id || "",
                division_id: asset.division_id || "",
                type: asset.type || ""
            });
        } else {
            setForm({
                asset_code: "",
                name: "",
                location: "",
                status: "operational",
                category_id: "",
                division_id: "",
                type: ""
            });
        }
        setSubmitted(false);
    }, [asset, visible]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const { asset_code, name, location } = form;
        return asset_code.trim() && name.trim() && location.trim();
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
                asset ? `/api/admin/assets/${asset.id}` : "/api/admin/assets",
                {
                    method: asset ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(form)
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan");
            showToast("success", "Sukses", data.message || "Data berhasil disimpan");
            fetchAssets();
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

    const divisionOptions = divisions.map(div => ({
        label: div.name,
        value: div.id
    }));

    return (
        <Dialog
            header={asset ? "Edit Asset" : "Add New Asset"}
            visible={visible}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
        >
            <div className="field grid mb-4">
                <label htmlFor="asset_code" className="col-12 mb-2 font-medium">
                    Asset Code <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="asset_code"
                        value={form.asset_code}
                        onChange={(e) => handleChange("asset_code", e.target.value)}
                        placeholder="Enter asset code"
                        className={classNames({ "p-invalid": submitted && !form.asset_code.trim() })}
                    />
                    {submitted && !form.asset_code.trim() && <small className="p-error">Asset code is required</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="name" className="col-12 mb-2 font-medium">
                    Asset Name <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Enter asset name"
                        className={classNames({ "p-invalid": submitted && !form.name.trim() })}
                    />
                    {submitted && !form.name.trim() && <small className="p-error">Asset name is required</small>}
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
                <label htmlFor="type" className="col-12 mb-2 font-medium">
                    Type
                </label>
                <div className="col-12">
                    <InputText
                        id="type"
                        value={form.type}
                        onChange={(e) => handleChange("type", e.target.value)}
                        placeholder="Enter asset type"
                    />
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

            <div className="field grid mb-4">
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

            <div className="field grid mb-6">
                <label htmlFor="division_id" className="col-12 mb-2 font-medium">
                    Division
                </label>
                <div className="col-12">
                    <Dropdown
                        id="division_id"
                        value={form.division_id}
                        options={divisionOptions}
                        onChange={(e) => handleChange("division_id", e.value)}
                        placeholder="Select division"
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
                    label={asset ? "Update" : "Save"}
                    icon="pi pi-check"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading}
                />
            </div>
        </Dialog>
    );
};

export default AssetFormDialog