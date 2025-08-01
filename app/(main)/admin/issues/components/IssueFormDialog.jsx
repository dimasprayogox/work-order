"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Image } from "primereact/image";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import { useState, useEffect, useRef, useCallback } from "react";

const IssueFormDialog = ({ visible, onHide, issue, machines, fetchIssues, showToast }) => {
    const [form, setForm] = useState({
        title: "",
        description: "",
        machine_id: "",
        reported_by_id: ""
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [users, setUsers] = useState([]); // Tambah state untuk users
    const [loadingUsers, setLoadingUsers] = useState(false); // Loading state untuk users
    const fileUploadRef = useRef(null);

    // Fetch users function
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch("/api/admin/issues/users", {
                credentials: "include"
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data.data || []);
            } else {
                showToast("error", "Error", "Gagal mengambil data users");
            }
        } catch (error) {
            showToast("error", "Error", "Gagal mengambil data users");
        } finally {
            setLoadingUsers(false);
        }
    }, [showToast]);

    // Fetch users ketika dialog dibuka
    useEffect(() => {
        if (visible) {
            fetchUsers();
        }
    }, [visible, fetchUsers]);

    useEffect(() => {
        if (issue) {
            setForm({
                title: issue.title || "",
                description: issue.description || "",
                machine_id: issue.machine_id || "",
                reported_by_id: issue.reported_by_id || ""
            });
        } else {
            setForm({
                title: "",
                description: "",
                machine_id: "",
                reported_by_id: ""
            });
        }
        setSubmitted(false);
        setSelectedFile(null);
        setRemovePhoto(false);
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    }, [issue, visible]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const { title, description, machine_id } = form;
        return title.trim() && description.trim() && machine_id;
    };

    const handleFileSelect = (e) => {
        const file = e.files[0];
        setSelectedFile(file);
        setRemovePhoto(false);
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        if (!validateForm()) {
            showToast("error", "Error", "Harap lengkapi semua field yang wajib diisi");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('machine_id', form.machine_id);

            if (form.reported_by_id) {
                formData.append('reported_by_id', form.reported_by_id);
            }

            if (selectedFile) {
                formData.append('photo', selectedFile);
            }

            if (issue && removePhoto) {
                formData.append('remove_photo', 'true');
            }

            const res = await fetch(
                issue ? `/api/admin/issues/${issue.id}` : "/api/admin/issues",
                {
                    method: issue ? "PATCH" : "POST",
                    credentials: "include",
                    body: formData
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan");

            showToast("success", "Sukses", data.message || "Data berhasil disimpan");
            fetchIssues();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const machineOptions = machines.map(machine => ({
        label: `${machine.name} (${machine.machine_code || machine.id})`,
        value: machine.id
    }));

    // Transform users untuk dropdown options
    const userOptions = users.map(user => ({
        label: `${user.full_name} (${user.role})`,
        value: user.id
    }));

    const customUploadHandler = (event) => {
        handleFileSelect(event);
    };

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
                label={issue ? "Update" : "Save"}
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
            />
        </div>
    );

    return (
        <Dialog
            header={issue ? "Edit Issue" : "Add New Issue"}
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
                        placeholder="Enter issue title"
                        className={classNames({ "p-invalid": submitted && !form.title.trim() })}
                    />
                    {submitted && !form.title.trim() && (
                        <small className="p-error">Title is required</small>
                    )}
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
                        className={classNames({ "p-invalid": submitted && !form.machine_id })}
                        filter
                        showClear
                        emptyMessage="No machines available"
                    />
                    {submitted && !form.machine_id && (
                        <small className="p-error">Machine is required</small>
                    )}
                </div>

                {/* Reported By Field */}
                <div className="field col-12">
                    <label htmlFor="reported_by_id" className="font-medium">
                        Reported By (Optional)
                    </label>
                    <Dropdown
                        id="reported_by_id"
                        value={form.reported_by_id}
                        options={userOptions}
                        onChange={(e) => handleChange("reported_by_id", e.value)}
                        placeholder="Select user (optional)"
                        filter
                        showClear
                        emptyMessage={loadingUsers ? "Loading users..." : "No users available"}
                        disabled={loadingUsers}
                    />
                    <small className="text-gray-500">
                        Leave empty to use current admin user
                    </small>
                </div>

                {/* Description Field */}
                <div className="field col-12">
                    <label htmlFor="description" className="font-medium">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <InputTextarea
                        id="description"
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Describe the issue in detail"
                        rows={4}
                        className={classNames({ "p-invalid": submitted && !form.description.trim() })}
                    />
                    {submitted && !form.description.trim() && (
                        <small className="p-error">Description is required</small>
                    )}
                </div>

                {/* Photo Field */}
                <div className="field col-12">
                    <label className="font-medium">Photo</label>

                    {/* Current Photo Display */}
                    {issue && issue.photo_url && !selectedFile && !removePhoto && (
                        <div className="mb-3">
                            <div className="flex align-items-center justify-content-between mb-2">
                                <span className="text-sm text-gray-600">Current photo:</span>
                                <div className="flex align-items-center">
                                    <Checkbox
                                        inputId="remove_photo"
                                        checked={removePhoto}
                                        onChange={(e) => setRemovePhoto(e.checked)}
                                    />
                                    <label htmlFor="remove_photo" className="ml-2 text-sm cursor-pointer">
                                        Remove photo
                                    </label>
                                </div>
                            </div>
                            <Image
                                src={issue.photo_url}
                                alt="Current issue photo"
                                width="150"
                                height="150"
                                preview
                                className="border-round shadow-2"
                            />
                        </div>
                    )}

                    {/* File Upload */}
                    <FileUpload
                        ref={fileUploadRef}
                        mode="basic"
                        name="photo"
                        accept="image/*"
                        maxFileSize={5000000}
                        customUpload
                        uploadHandler={customUploadHandler}
                        chooseLabel="Choose Photo"
                        className="p-button-outlined"
                        disabled={removePhoto}
                    />

                    {/* Selected File Display */}
                    {selectedFile && (
                        <div className="mt-2">
                            <small className="text-green-600">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </small>
                        </div>
                    )}

                    {/* Remove Photo Notice */}
                    {removePhoto && (
                        <div className="mt-2">
                            <small className="text-red-600">
                                Current photo will be removed when saved
                            </small>
                        </div>
                    )}

                    <small className="text-gray-500 block mt-1">
                        Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                    </small>
                </div>
            </div>
        </Dialog>
    );
};

export default IssueFormDialog;
