"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import { Image } from "primereact/image";
import { classNames } from "primereact/utils";
import { useState, useEffect, useRef } from "react";

const WorkRequestFormDialog = ({
    visible,
    onHide,
    workOrder,
    machines = [], // Default to empty array if undefined
    fetchWorkOrders,
    showToast
}) => {
    const fileUploadRef = useRef(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        machine_id: null,
        photo: null,
        current_photo_url: ""
    });
    const [loading, setLoading] = useState(false);
    const [submitted] = useState(false);

    useEffect(() => {
        if (workOrder) {
            setForm({
                title: workOrder.title || "",
                description: workOrder.description || "",
                machine_id: workOrder.machine_id || null,
                photo: null,
                current_photo_url: workOrder.photo_url || ""
            });
        } else {
            setForm({
                title: "",
                description: "",
                machine_id: null,
                photo: null,
                current_photo_url: ""
            });
        }
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    }, [visible, workOrder]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
        if (e.files && e.files.length > 0) {
            const file = e.files[0];
            setForm((prev) => ({
                ...prev,
                photo: file,
                current_photo_url: URL.createObjectURL(file)
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                photo: null,
                current_photo_url: workOrder?.photo_url || ""
            }));
        }
    };

    const validateForm = () => {
        const requiredFields = {
            title: "Judul isu wajib diisi.",
            description: "Deskripsi wajib diisi.",
            machine_id: "Mesin wajib dipilih."
        };

        const errors = {};
        let isValid = true;

        Object.entries(requiredFields).forEach(([field, message]) => {
            if (!form[field]) {
                errors[field] = message;
                isValid = false;
            }
        });

        return { isValid, errors };
    };

    const handleSubmit = async () => {
        const { isValid } = validateForm();

        if (!isValid) {
            showToast("error", "Validasi Gagal", "Mohon perbaiki kesalahan pada formulir.");
            return;
        }

        setLoading(true);
        try {
            const formPayload = new FormData();
            formPayload.append("title", form.title);
            formPayload.append("description", form.description);
            formPayload.append("machine_id", form.machine_id);

            if (form.photo) {
                formPayload.append("photo", form.photo);
            }

            const endpoint = workOrder ? `/api/employee/issues/${workOrder.id}` : `/api/employee/issues`;

            const res = await fetch(endpoint, {
                method: workOrder ? "PATCH" : "POST",
                body: formPayload,
                credentials: "include"
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to ${workOrder ? "update" : "create"} issue. Status: ${res.status}`);
            }

            const data = await res.json();
            showToast("success", "Berhasil", data.message || `Work order berhasil ${workOrder ? "diperbarui" : "ditambahkan"}!`);
            fetchWorkOrders();
            onHide();
        } catch (error) {
            console.error("Error saving work order:", error);
            showToast("error", "Error", error.message || "Terjadi kesalahan saat menyimpan work order. Periksa koneksi atau hubungi administrator.");
        } finally {
            setLoading(false);
        }
    };

    const formatStatusForDisplay = (statusValue) => {
        if (!statusValue) return "N/A";
        return statusValue.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Safely handle machines prop
    const machineOptions = (machines || []).map((machine) => ({
        label: machine.name,
        value: machine.id
    }));

    return (
        <Dialog header={workOrder ? "Edit Work Order" : "Buat Permintaan Work Order Baru"} visible={visible} style={{ width: "60vw" }} breakpoints={{ "960px": "75vw", "641px": "90vw" }} onHide={onHide} modal className="p-fluid">
            <div className="field grid mb-4">
                <label htmlFor="title" className="col-12 mb-2 font-medium">
                    Judul Isu <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText id="title" value={form.title} onChange={(e) => handleChange("title", e.target.value)} className={classNames({ "p-invalid": submitted && !form.title })} />
                    {submitted && !form.title && <small className="p-error">Judul isu wajib diisi</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="description" className="col-12 mb-2 font-medium">
                    Deskripsi <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputTextarea id="description" value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={5} className={classNames({ "p-invalid": submitted && !form.description })} />
                    {submitted && !form.description && <small className="p-error">Deskripsi wajib diisi</small>}
                </div>
            </div>

            {workOrder && (
                <div className="field grid mb-4">
                    <label htmlFor="status" className="col-12 mb-2 font-medium">
                        Status
                    </label>
                    <div className="col-12">
                        <InputText id="status" value={formatStatusForDisplay(workOrder?.status)} readOnly disabled />
                        <small className="text-500 block mt-1">Status diperbarui oleh teknisi</small>
                    </div>
                </div>
            )}

            <div className="field grid mb-4">
                <label htmlFor="machine_id" className="col-12 mb-2 font-medium">
                    Mesin <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <Dropdown id="machine_id" value={form.machine_id} options={machineOptions} onChange={(e) => handleChange("machine_id", e.value)} placeholder="Pilih Mesin" className={classNames({ "p-invalid": submitted && !form.machine_id })} />
                    {submitted && !form.machine_id && <small className="p-error">Mesin wajib dipilih</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="photo" className="col-12 mb-2 font-medium">
                    Foto
                </label>
                <div className="col-12">
                    {form.current_photo_url && (
                        <div className="mb-3">
                            <p className="text-sm text-500 mb-1">{workOrder ? "Foto Saat Ini:" : "Pratinjau:"}</p>
                            <Image src={form.current_photo_url} alt="Foto Isu" width="100" preview />
                        </div>
                    )}

                    <FileUpload
                        ref={fileUploadRef}
                        name="photo"
                        mode="advanced"
                        accept="image/*"
                        maxFileSize={1000000}
                        onSelect={handleFileChange}
                        onClear={() => handleFileChange({ files: [] })}
                        onRemove={() => handleFileChange({ files: [] })}
                        chooseLabel="Pilih Foto"
                        uploadLabel="Unggah (Tidak digunakan di sini)"
                        cancelLabel="Bersihkan"
                        customUpload={true}
                        emptyTemplate={<p className="m-0">Tarik dan lepas foto di sini atau klik untuk menelusuri</p>}
                    />
                    <small className="text-500 block mt-1">Ukuran file maksimal: 1MB. Format yang diterima: gambar</small>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button label="Batal" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
                <Button label={workOrder ? "Simpan" : "Kirim"} icon="pi pi-check" onClick={handleSubmit} loading={loading} disabled={loading} />
            </div>
        </Dialog>
    );
};

export default WorkRequestFormDialog;
