"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const MachineCategoryFormDialog = ({ visible, onHide, category, fetchCategories, showToast }) => {
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

    const handleSubmit = async () => {
        setSubmitted(true);

        if (!form.name.trim()) {
            showToast("error", "Validation Error", "Nama kategori harus diisi");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                category
                    ? `/api/admin/machine-categories/${category.id}`
                    : "/api/admin/machine-categories",
                {
                    method: category ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(form)
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan");

            showToast("success", "Sukses", data.message);
            fetchCategories();
            onHide();
            setSubmitted(false);
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setSubmitted(false);
        onHide();
    };

    return (
        <Dialog
            header={category ? "Edit Machine Category" : "Add New Machine Category"}
            visible={visible}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={handleCancel}
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
                        placeholder="Enter category name"
                        className={classNames({ "p-invalid": submitted && !form.name.trim() })}
                        maxLength={100}
                    />
                    {submitted && !form.name.trim() && (
                        <small className="p-error">Category name is required</small>
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
                        placeholder="Enter category description (optional)"
                        rows={4}
                        autoResize
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={handleCancel}
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

export default MachineCategoryFormDialog;
