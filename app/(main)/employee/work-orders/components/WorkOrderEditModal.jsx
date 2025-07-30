"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import { Image } from "primereact/image";
import { classNames } from "primereact/utils";

const WorkOrderEditModal = ({ visible, onHide, workOrder, machines, onUpdateSuccess, showToast }) => {
    const fileUploadRef = useRef(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        machine_id: null,
        current_photo_url: "",
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const machineOptions = machines.map(machine => ({
        label: machine.name,
        value: machine.id,
    }));

    useEffect(() => {
        if (visible && workOrder) {
            setFormData({
                title: workOrder.title || "",
                description: workOrder.description || "",
                machine_id: workOrder.machine_id || null,
                current_photo_url: workOrder.photo_url || "",
            });
            setSelectedFile(null);
            setErrors({});
            if (fileUploadRef.current) {
                fileUploadRef.current.clear();
            }
        }
    }, [visible, workOrder]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const onFileSelect = (e) => {
        if (e.files && e.files.length > 0) {
            setSelectedFile(e.files[0]);
            setFormData((prev) => ({ ...prev, current_photo_url: URL.createObjectURL(e.files[0]) }));
        } else {
            setSelectedFile(null);
            if (workOrder) {
                setFormData((prev) => ({ ...prev, current_photo_url: workOrder.photo_url || "" }));
            }
        }
    };

    const onFileRemove = () => {
        setSelectedFile(null);
        setFormData((prev) => ({ ...prev, current_photo_url: "" }));
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };

    const validateForm = useCallback(() => {
        let newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = "Judul isu wajib diisi.";
        }
        if (!formData.description.trim()) {
            newErrors.description = "Deskripsi wajib diisi.";
        }
        if (!formData.machine_id) {
            newErrors.machine_id = "Mesin wajib dipilih.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast("error", "Validasi Gagal", "Mohon perbaiki kesalahan pada formulir.");
            return;
        }

        if (!workOrder || !workOrder.id) {
            showToast("error", "Error", "Work Order tidak ditemukan untuk diperbarui.");
            return;
        }

        setLoading(true);
        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append("title", formData.title);
            formDataToSubmit.append("description", formData.description);
            formDataToSubmit.append("machine_id", formData.machine_id);

            if (selectedFile) {
                formDataToSubmit.append("photo", selectedFile);
            } else if (!formData.current_photo_url && workOrder.photo_url) {
                formDataToSubmit.append("remove_photo", "true");
            }

            const response = await fetch(`/api/employee/issues/${workOrder.id}`, {
                method: "PATCH",
                body: formDataToSubmit,
                credentials: "include",
            });

            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Gagal memperbarui work order.";
                throw new Error(errorDetail);
            }

            onUpdateSuccess();
            onHide();
        } catch (error) {
            console.error("Error updating work order:", error);
            showToast("error", "Error", `Gagal memperbarui work order: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const footerContent = (
        <div>
            <Button label="Batal" icon="pi pi-times" outlined onClick={onHide} disabled={loading} />
            <Button label="Simpan" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    );

    const formatStatusForDisplay = (statusValue) => {
        if (!statusValue) return "N/A";
        return statusValue.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    };

    return (
        <Dialog
            header="Edit Work Order"
            visible={visible}
            style={{ width: "60vw" }}
            onHide={onHide}
            footer={footerContent}
            modal
        >
            {workOrder ? (
                <div className="p-fluid grid formgrid">
                    <div className="field col-12">
                        <label htmlFor="title" className="font-bold">
                            Judul Isu
                        </label>
                        <InputText
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={classNames({ 'p-invalid': errors.title })}
                        />
                        {errors.title && <small className="p-error">{errors.title}</small>}
                    </div>

                    <div className="field col-12">
                        <label htmlFor="description" className="font-bold">
                            Deskripsi
                        </label>
                        <InputTextarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={5}
                            cols={30}
                            className={classNames({ 'p-invalid': errors.description })}
                        />
                        {errors.description && <small className="p-error">{errors.description}</small>}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="status" className="font-bold">
                            Status
                        </label>
                        <InputText
                            id="status"
                            name="status"
                            value={formatStatusForDisplay(workOrder.status)}
                            readOnly
                            disabled
                            className="p-inputtext-sm"
                        />
                        <small className="p-text-secondary">Status diperbarui oleh teknisi.</small>
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="machine_id" className="font-bold">
                            Mesin
                        </label>
                        <Dropdown
                            id="machine_id"
                            name="machine_id"
                            value={formData.machine_id}
                            options={machineOptions}
                            onChange={handleChange}
                            placeholder="Pilih Mesin"
                            className={classNames({ 'p-invalid': errors.machine_id })}
                        />
                        {errors.machine_id && <small className="p-error">{errors.machine_id}</small>}
                    </div>

                    <div className="field col-12">
                        <label htmlFor="photo" className="font-bold mb-2 block">
                            Foto
                        </label>
                        {formData.current_photo_url && (
                            <div className="mb-3">
                                <p className="text-sm text-500 mb-1">Foto Saat Ini:</p>
                                <Image src={formData.current_photo_url} alt="Foto Isu Saat Ini" width="100" preview />
                            </div>
                        )}
                        <FileUpload
                            ref={fileUploadRef}
                            name="photo"
                            mode="advanced"
                            accept="image/*"
                            maxFileSize={1000000}
                            onSelect={onFileSelect}
                            onClear={onFileRemove}
                            onRemove={onFileRemove}
                            fileLimit={1}
                            chooseLabel="Pilih Foto Baru"
                            uploadLabel="Unggah (Tidak digunakan di sini)"
                            cancelLabel="Bersihkan"
                            customUpload={true}
                            emptyTemplate={<p className="m-0">Tarik dan lepas foto baru di sini atau klik untuk menelusuri.</p>}
                        />
                        <small className="text-500 block mt-2">Ukuran file maksimal: 1MB. Format yang diterima: gambar.</small>
                    </div>
                </div>
            ) : (
                <p>Tidak ada work order yang dipilih untuk diedit.</p>
            )}
        </Dialog>
    );
};

export default WorkOrderEditModal;