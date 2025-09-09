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
        type: "",
        machine_id: "",
        asset_id: "",
        reported_by_id: "",
        priority: "medium"
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [users, setUsers] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const fileUploadRef = useRef(null);

    // Fetch users function
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch("/api/admin/issues/users", { credentials: "include" });
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

    // Fetch assets function
    const fetchAssets = useCallback(async () => {
        setLoadingAssets(true);
        try {
            const res = await fetch("/api/admin/issues/assets", { credentials: "include" });
            const data = await res.json();
            if (res.ok) {
                setAssets(data.data || []);
            } else {
                showToast("error", "Error", "Gagal mengambil data assets");
            }
        } catch (error) {
            showToast("error", "Error", "Gagal mengambil data assets");
        } finally {
            setLoadingAssets(false);
        }
    }, [showToast]);

    // Fetch users and assets saat dialog dibuka
    useEffect(() => {
        if (visible) {
            fetchUsers();
            fetchAssets();
        }
    }, [visible, fetchUsers, fetchAssets]);

    // Mengisi dan mereset form
    useEffect(() => {
        if (issue) {
            // Determine type based on existing data
            let issueType = "";
            if (issue.machine_id) {
                issueType = "machine";
            } else if (issue.asset_id) {
                issueType = "asset";
            }

            setForm({
                title: issue.title || "",
                description: issue.description || "",
                type: issueType,
                machine_id: issue.machine_id || "",
                asset_id: issue.asset_id || "",
                reported_by_id: issue.reported_by_id || "",
                priority: issue.workOrder?.priority || "medium"
            });
        } else {
            setForm({
                title: "",
                description: "",
                type: "",
                machine_id: "",
                asset_id: "",
                reported_by_id: "",
                priority: "medium"
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
        setForm((prev) => {
            const newForm = { ...prev, [field]: value };
            
            // Clear opposite type field when type changes
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
        const { title, description, type, machine_id, asset_id } = form;
        const hasTitle = title.trim();
        const hasDescription = description.trim();
        const hasType = type;
        const hasValidTarget = (type === "machine" && machine_id) || (type === "asset" && asset_id);
        
        return hasTitle && hasDescription && hasType && hasValidTarget;
    };

    // Handler untuk memilih file baru
    const handleFileSelect = (e) => {
        const file = e.files[0];
        setSelectedFile(file);
        setRemovePhoto(false);
    };

    // Handler untuk menghapus file yang baru dipilih (dari preview)
    const handleFileRemove = () => {
        setSelectedFile(null);
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };

    // Handler untuk checkbox remove photo
    const handleRemovePhotoChange = (checked) => {
        setRemovePhoto(checked);
        if (checked && selectedFile) {
            setSelectedFile(null);
            if (fileUploadRef.current) {
                fileUploadRef.current.clear();
            }
        }
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
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('type', form.type);
            formData.append('priority', form.priority);

            if (form.type === "machine" && form.machine_id) {
                formData.append('machine_id', form.machine_id);
            }
            if (form.type === "asset" && form.asset_id) {
                formData.append('asset_id', form.asset_id);
            }

            if (form.reported_by_id) {
                formData.append('reported_by_id', form.reported_by_id);
            }

            // Improved photo handling logic
            if (selectedFile) {
                formData.append('photo', selectedFile);
            }

            // Only send remove_photo if no new file is selected
            if (issue && removePhoto && !selectedFile) {
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

    const assetOptions = assets.map(asset => ({
        label: `${asset.name} (${asset.asset_code || asset.id})`,
        value: asset.id
    }));

    const userOptions = users.map(user => {
        const divisionName = user.division?.name || "Tanpa Divisi";
        return {
        label: `${user.full_name} (${user.role}) (${divisionName})`,
        value: user.id
        }
    });

    const typeOptions = [
        { label: "Machine", value: "machine" },
        { label: "Asset", value: "asset" }
    ];

    const priorityOptions = [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" }
    ];

    // Template untuk menampilkan file yang dipilih
    const itemTemplate = (file) => (
        <div className="flex align-items-center flex-wrap gap-3">
            <img
                alt={file.name}
                role="presentation"
                src={file.objectURL}
                style={{ width: '100px', height: 'auto', borderRadius: '6px' }}
            />
            <div className="flex flex-column" style={{flex: 1}}>
                <span className="font-bold">{file.name}</span>
                <span className="text-sm text-color-secondary">{Math.round(file.size / 1024)} KB</span>
            </div>
            <Button
                type="button"
                icon="pi pi-times"
                className="p-button-rounded p-button-danger p-button-text"
                onClick={handleFileRemove}
            />
        </div>
    );

    return (
        <Dialog header={issue ? "Edit Issue" : "Add New Issue"} visible={visible} style={{ width: "40rem" }} breakpoints={{ "960px": "75vw", "641px": "90vw" }} onHide={onHide} modal className="p-fluid" >
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
                    <Dropdown id="type" value={form.type} options={typeOptions} onChange={(e) => handleChange("type", e.value)} className={classNames({ "p-invalid": submitted && !form.type })} />
                    {submitted && !form.type && <small className="p-error">Type is required</small>}
                </div>

                {/* Machine Field - only show when type is machine */}
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
                            filter
                            className={classNames({ "p-invalid": submitted && form.type === "machine" && !form.machine_id })}
                        />
                        {submitted && form.type === "machine" && !form.machine_id && <small className="p-error">Machine is required</small>}
                    </div>
                )}

                {/* Asset Field - only show when type is asset */}
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
                            filter
                            emptyMessage={loadingAssets ? "Loading assets..." : "No assets available"}
                            disabled={loadingAssets}
                            className={classNames({ "p-invalid": submitted && form.type === "asset" && !form.asset_id })}
                        />
                        {submitted && form.type === "asset" && !form.asset_id && <small className="p-error">Asset is required</small>}
                    </div>
                )}

                {/* Priority Field */}
                <div className="field col-12">
                    <label htmlFor="priority" className="font-medium">
                        Priority
                    </label>
                    <Dropdown id="priority" value={form.priority} options={priorityOptions} onChange={(e) => handleChange("priority", e.value)} />
                </div>

                {/* Reported By Field */}
                <div className="field col-12">
                    <label htmlFor="reported_by_id" className="font-medium">
                        Reported By (Opsional)
                    </label>
                    <Dropdown
                        id="reported_by_id"
                        value={form.reported_by_id}
                        options={userOptions}
                        onChange={(e) => handleChange("reported_by_id", e.value)}
                        filter
                        emptyMessage={loadingUsers ? "Loading users..." : "No users available"}
                        disabled={loadingUsers}
                    />
                    <small className="text-gray-500">Leave empty to use current admin user</small>
                </div>

                {/* Description Field */}
                <div className="field col-12">
                    <label htmlFor="description" className="font-medium">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <InputTextarea id="description" value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} className={classNames({ "p-invalid": submitted && !form.description.trim() })} />
                    {submitted && !form.description.trim() && <small className="p-error">Description is required</small>}
                </div>

                {/* Photo Field */}
                <div className="field col-12">
                    <label className="font-medium">Photo</label>

                    {/* Menampilkan foto yang sudah ada (saat mode edit) */}
                    {issue && issue.photo_url && (
                        <div className="mb-3">
                            <div className="flex align-items-center justify-content-between mb-2">
                                <span className="text-sm text-gray-600">Current photo:</span>
                                <div className="flex align-items-center">
                                    <Checkbox inputId="remove_photo" checked={removePhoto} onChange={(e) => handleRemovePhotoChange(e.checked)} />
                                    <label htmlFor="remove_photo" className="ml-2 text-sm cursor-pointer">
                                        Remove photo
                                    </label>
                                </div>
                            </div>
                            <Image src={issue.photo_url} alt="Current issue photo" width="150" preview className="border-round shadow-2" />
                        </div>
                    )}

                    {/* Komponen FileUpload yang sudah disempurnakan */}
                    <FileUpload
                        key={`fileupload-${issue?.id || "new"}-${visible}`}
                        ref={fileUploadRef}
                        name="photo"
                        accept="image/*"
                        maxFileSize={5000000}
                        customUpload
                        onSelect={handleFileSelect}
                        multiple={false}
                        chooseLabel={issue && issue.photo_url ? "Ganti Foto" : "Pilih Foto"}
                        itemTemplate={itemTemplate}
                        emptyTemplate={<p className="m-0">Drag and drop the image here.</p>}
                        disabled={removePhoto}
                    />
                    {removePhoto && (
                        <div className="mt-2">
                            <small className="text-red-600">The current photo will be deleted when saved.</small>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
                <Button label={issue ? "Update" : "Save"} icon="pi pi-check" onClick={handleSubmit} loading={loading} disabled={loading} />
            </div>
        </Dialog>
    );
};

export default IssueFormDialog;
