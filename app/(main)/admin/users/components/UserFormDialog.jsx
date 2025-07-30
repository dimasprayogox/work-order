"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const UserFormDialog = ({ visible, onHide, user, fetchUsers, showToast }) => {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        full_name: "",
        role: "employee",
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const roleOptions = [
        { label: "Admin", value: "admin" },
        { label: "Manager", value: "manager" },
        { label: "Technician", value: "technician" },
        { label: "Logistics", value: "logistics" },
        { label: "Employee", value: "employee" }
    ];

    useEffect(() => {
        if (user) {
            setForm({
                username: user.username || "",
                email: user.email || "",
                password: "", // Always empty for edit mode
                full_name: user.full_name || "",
                role: user.role || "employee",
                is_active: user.is_active === 1 || user.is_active === true
            });
        } else {
            setForm({
                username: "",
                email: "",
                password: "",
                full_name: "",
                role: "employee",
                is_active: true
            });
        }
        setSubmitted(false);
    }, [user, visible]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const errors = {};

        if (!form.username.trim()) errors.username = "Username is required";
        if (!form.email.trim()) errors.email = "Email is required";
        if (!form.full_name.trim()) errors.full_name = "Full name is required";
        if (!user && !form.password.trim()) errors.password = "Password is required";
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errors.email = "Email is invalid";

        return errors;
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const errors = validateForm();

        if (Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            showToast("error", "Validation Error", firstError);
            return;
        }

        setLoading(true);
        try {
            const payload = { ...form };
            // Don't send empty password for updates
            if (user && !payload.password.trim()) {
                delete payload.password;
            }

            // Menggunakan API route handler yang baru
            const url = user ? `/api/admin/users/${user.id}` : "/api/admin/users";
            const method = user ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Gagal menyimpan user");
            }

            showToast("success", "Sukses", data.message || "User berhasil disimpan");
            fetchUsers();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const dialogFooter = (
        <div className="flex justify-end gap-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
                disabled={loading}
            />
            <Button
                label={user ? "Update" : "Save"}
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
            />
        </div>
    );

    return (
        <Dialog
            header={user ? "Edit User" : "Add New User"}
            visible={visible}
            style={{ width: "32rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
            footer={dialogFooter}
        >
            <div className="field grid mb-4">
                <label htmlFor="username" className="col-12 mb-2 font-medium">
                    Username <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="username"
                        value={form.username}
                        onChange={(e) => handleChange("username", e.target.value)}
                        placeholder="Enter username"
                        className={classNames({
                            "p-invalid": submitted && !form.username.trim()
                        })}
                    />
                    {submitted && !form.username.trim() &&
                        <small className="p-error">Username is required</small>
                    }
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="email" className="col-12 mb-2 font-medium">
                    Email <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="Enter email address"
                        className={classNames({
                            "p-invalid": submitted && (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
                        })}
                    />
                    {submitted && !form.email.trim() &&
                        <small className="p-error">Email is required</small>
                    }
                    {submitted && form.email.trim() && !/\S+@\S+\.\S+/.test(form.email) &&
                        <small className="p-error">Email is invalid</small>
                    }
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="password" className="col-12 mb-2 font-medium">
                    Password {!user && <span className="text-red-500">*</span>}
                    {user && <small className="text-gray-500"> (leave empty to keep current)</small>}
                </label>
                <div className="col-12">
                    <Password
                        id="password"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder={user ? "Enter new password (optional)" : "Enter password"}
                        toggleMask
                        className={classNames({
                            "p-invalid": submitted && !user && !form.password.trim()
                        })}
                        inputClassName="w-full"
                    />
                    {submitted && !user && !form.password.trim() &&
                        <small className="p-error">Password is required</small>
                    }
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="full_name" className="col-12 mb-2 font-medium">
                    Full Name <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText
                        id="full_name"
                        value={form.full_name}
                        onChange={(e) => handleChange("full_name", e.target.value)}
                        placeholder="Enter full name"
                        className={classNames({
                            "p-invalid": submitted && !form.full_name.trim()
                        })}
                    />
                    {submitted && !form.full_name.trim() &&
                        <small className="p-error">Full name is required</small>
                    }
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="role" className="col-12 mb-2 font-medium">
                    Role <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <Dropdown
                        id="role"
                        value={form.role}
                        options={roleOptions}
                        onChange={(e) => handleChange("role", e.value)}
                        placeholder="Select role"
                    />
                </div>
            </div>

            <div className="field grid mb-6">
                <div className="col-12">
                    <Checkbox
                        inputId="is_active"
                        checked={form.is_active}
                        onChange={(e) => handleChange("is_active", e.checked)}
                    />
                    <label htmlFor="is_active" className="ml-2">Active User</label>
                </div>
            </div>
        </Dialog>
    );
};

export default UserFormDialog;
