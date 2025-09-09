// app/(main)/admin/asset-categories/components/AssetCategoryFormDialog.jsx
"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const AssetCategoryFormDialog = ({ visible, onHide, category, fetchCategories, showToast }) => {
    const [form, setForm] = useState({
        name: "",
        description: ""
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (category) {
            setForm({
                name: category.name || "",
                description: category.description || ""
            });
        } else {
            setForm({
                name: "",
                description: ""
            });
        }
        setSubmitted(false);
    }, [category, visible]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const { name } = form;
        return name.trim() && name.trim().length >= 3;
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        if (!validateForm()) {
            showToast("error", "Error", "Nama kategori minimal 3 karakter dan wajib diisi");
            return;
        }

        // Validate description length if provided
        if (form.description && form.description.length > 255) {
            showToast("error", "Error", "Deskripsi maksimal 255 karakter");
            return;
        }

        setLoading(true);
        try {
            const body = {
                name: form.name.trim(),
                description: form.description.trim() || undefined
            };

            const res = await fetch(
                category ? `/api/admin/asset-categories/${category.id}` : "/api/admin/asset-categories",
                {
                    method: category ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(body)
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan");
            
            showToast("success", "Sukses", data.message || "Data berhasil disimpan");
            fetchCategories();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header={category ? "Edit Asset Category" : "Add New Asset Category"}
            visible={visible}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
        >
            <div className="field grid mb-4">
                <label htmlFor="name" className="col-12 mb-2 font-medium">
                    Category Name <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className={classNames({ 
                            "p-invalid": submitted && (!form.name.trim() || form.name.trim().length < 3) 
                        })}
                        maxLength={100}
                    />
                    {submitted && !form.name.trim() && (
                        <small className="p-error">Category name is required</small>
                    )}
                    {submitted && form.name.trim() && form.name.trim().length < 3 && (
                        <small className="p-error">Category name must be at least 3 characters</small>
                    )}
                </div>
            </div>

            <div className="field grid mb-6">
                <label htmlFor="description" className="col-12 mb-2 font-medium">
                    Description
                </label>
                <div className="col-12">
                    <InputTextarea
                        id="description"
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        rows={4}
                        maxLength={255}
                        className={classNames({ 
                            "p-invalid": submitted && form.description && form.description.length > 255 
                        })}
                    />
                    <small className="text-gray-500 block mt-1">
                        {form.description.length}/255 characters
                    </small>
                    {submitted && form.description && form.description.length > 255 && (
                        <small className="p-error">Description must not exceed 255 characters</small>
                    )}
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
                    label={category ? "Update" : "Save"}
                    icon="pi pi-check"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading}
                />
            </div>
        </Dialog>
    );
};

export default AssetCategoryFormDialog;