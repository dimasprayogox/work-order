// app/(main)/admin/divisions/components/DivisionFormDialog.jsx
"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const DivisionFormDialog = ({ visible, onHide, division, fetchDivisions, showToast }) => {
    const [form, setForm] = useState({
        name: "",
        description: ""
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (division) {
            setForm({
                name: division.name || "",
                description: division.description || ""
            });
        } else {
            setForm({
                name: "",
                description: ""
            });
        }
        setSubmitted(false);
    }, [division, visible]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const { name } = form;
        return name.trim().length >= 3;
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        if (!validateForm()) {
            showToast("error", "Error", "Nama divisi harus minimal 3 karakter");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                division ? `/api/admin/divisions/${division.id}` : "/api/admin/divisions",
                {
                    method: division ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(form)
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan");
            showToast("success", "Sukses", data.message || "Data berhasil disimpan");
            fetchDivisions();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header={division ? "Edit Division" : "Add New Division"}
            visible={visible}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
        >
            <div className="field grid mb-4">
                <label htmlFor="name" className="col-12 mb-2 font-medium">
                    Division Name <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Enter division name"
                        className={classNames({ 
                            "p-invalid": submitted && form.name.trim().length < 3 
                        })}
                    />
                    {submitted && form.name.trim().length < 3 && (
                        <small className="p-error">
                            Division name must be at least 3 characters
                        </small>
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
                        placeholder="Enter division description (optional)"
                        rows={4}
                        maxLength={255}
                        className={classNames({ 
                            "p-invalid": submitted && form.description.length > 255 
                        })}
                    />
                    {submitted && form.description.length > 255 && (
                        <small className="p-error">
                            Description cannot exceed 255 characters
                        </small>
                    )}
                    <small className="text-gray-500 block mt-1">
                        {form.description.length}/255 characters
                    </small>
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
                    label={division ? "Update" : "Save"}
                    icon="pi pi-check"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading}
                />
            </div>
        </Dialog>
    );
};

export default DivisionFormDialog;