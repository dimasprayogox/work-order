"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import { motion } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

// PERBAIKAN: Ubah nama komponen dari NewRequestDialog menjadi AddWorkOrderPage
// dan hapus props yang tidak bisa diterima oleh komponen halaman.
export default function AddWorkOrderPage() {
    // State untuk mengontrol visibilitas dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const toastRef = useRef(null); // Pindahkan Toast ke sini jika diperlukan

    // Fungsi showToast sekarang didefinisikan di sini
    const showToast = useCallback((severity, summary, detail) => {
        // Implementasi toast Anda, misalnya:
        // toastRef.current.show({ severity, summary, detail });
        console.log(`Toast: ${severity} - ${summary}: ${detail}`);
    }, []);

    // Fungsi fetchWorkRequests sekarang didefinisikan di sini
    const fetchWorkRequests = useCallback(() => {
        console.log("Fetching work requests...");
    }, []);

    return (
        <div className="p-4">
            {/* <Toast ref={toastRef} /> */}
            <Button label="Buat Permintaan Baru" icon="pi pi-plus" onClick={() => setIsDialogOpen(true)} />

            <NewRequestDialog
                visible={isDialogOpen}
                onHide={() => setIsDialogOpen(false)}
                fetchWorkRequests={fetchWorkRequests}
                showToast={showToast}
            />
        </div>
    );
}


// Komponen Dialog tetap sama, tetapi tidak lagi diekspor sebagai default
const NewRequestDialog = ({ visible, onHide, fetchWorkRequests, showToast }) => {
    const [loadingSubmitRequest, setLoadingSubmitRequest] = useState(false);
    const [machines, setMachines] = useState([]);
    const [requestFormData, setRequestFormData] = useState({
        machine_id: null,
        title: "",
        description: "",
        photo: null
    });
    const [formErrors, setFormErrors] = useState({});
    const fileInputRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // PERBAIKAN: Bungkus fetchMachines dengan useCallback
    const fetchMachines = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee/machines/available`, {
                method: "GET",
                credentials: "include"
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memuat daftar mesin.");
            }
            const result = await response.json();
            setMachines(result.data.map((machine) => ({ label: machine.name, value: machine.id })));
        } catch (error) {
            showToast("error", "Error", `Gagal memuat daftar mesin: ${error.message}`);
        }
    }, [showToast]);

    const resetRequestForm = useCallback(() => {
        setRequestFormData({
            machine_id: null,
            title: "",
            description: "",
            photo: null
        });
        setFormErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    const validateRequestForm = useCallback(() => {
        const errors = {};
        if (!requestFormData.machine_id) errors.machine_id = "Mesin harus dipilih.";
        if (!requestFormData.title.trim()) errors.title = "Judul tidak boleh kosong.";
        if (requestFormData.title.trim().length < 3) errors.title = "Judul minimal 3 karakter.";
        if (!requestFormData.description.trim()) errors.description = "Deskripsi tidak boleh kosong.";
        if (requestFormData.description.trim().length < 10) errors.description = "Deskripsi minimal 10 karakter.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [requestFormData]);

    const handleFormChange = useCallback((e, field) => {
        const value = e.target ? e.target.value : e.value;
        setRequestFormData((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0] || null;
        setRequestFormData((prev) => ({ ...prev, photo: file }));
    }, []);

    const submitNewRequest = async () => {
        if (!validateRequestForm()) {
            showToast("error", "Validasi Gagal", "Mohon periksa kembali form Anda.");
            return;
        }

        setLoadingSubmitRequest(true);
        const formData = new FormData();
        formData.append("machine_id", requestFormData.machine_id);
        formData.append("title", requestFormData.title);
        formData.append("description", requestFormData.description);
        if (requestFormData.photo) {
            formData.append("photo", requestFormData.photo);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal membuat permintaan baru.");
            }
            const result = await response.json();
            showToast("success", "Berhasil!", result.message || "Permintaan berhasil dibuat.");
            onHide();
            resetRequestForm();
            fetchWorkRequests();
        } catch (error) {
            showToast("error", "Gagal!", error.message);
        } finally {
            setLoadingSubmitRequest(false);
        }
    };

    // PERBAIKAN: Tambahkan fetchMachines ke dependency array
    React.useEffect(() => {
        if (visible) {
            fetchMachines();
        }
    }, [visible, fetchMachines]);

    const renderFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Submit" icon="pi pi-check" onClick={submitNewRequest} loading={loadingSubmitRequest} />
        </div>
    );

    return (
        <Dialog
            header="Create New Work Request"
            visible={visible}
            style={{ width: "min(90vw, 600px)", borderRadius: "16px" }}
            modal
            className="p-fluid shadow-2xl"
            onHide={() => {
                onHide();
                resetRequestForm();
            }}
            footer={renderFooter}
        >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="field mb-4">
                    <label htmlFor="machine_id" className="font-bold mb-2 block">
                        Mesin
                    </label>
                    <Dropdown id="machine_id" value={requestFormData.machine_id} options={machines} onChange={(e) => handleFormChange(e, "machine_id")} placeholder="Pilih Mesin" className={formErrors.machine_id ? "p-invalid" : ""} />
                    {formErrors.machine_id && <Message severity="error" text={formErrors.machine_id} className="mt-2" />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="title" className="font-bold mb-2 block">
                        Title
                    </label>
                    <InputText id="title" value={requestFormData.title} onChange={(e) => handleFormChange(e, "title")} className={formErrors.title ? "p-invalid" : ""} placeholder="" />
                    {formErrors.title && <Message severity="error" text={formErrors.title} className="mt-2" />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="description" className="font-bold mb-2 block">
                        Deskripsi
                    </label>
                    <InputTextarea
                        id="description"
                        rows={5}
                        value={requestFormData.description}
                        onChange={(e) => handleFormChange(e, "description")}
                        className={formErrors.description ? "p-invalid" : ""}
                        placeholder=""
                        autoResize
                    />
                    {formErrors.description && <Message severity="error" text={formErrors.description} className="mt-2" />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="photo" className="font-bold mb-2 block">
                        Foto (Opsional)
                    </label>
                    <motion.div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => fileInputRef.current.click()}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                        <i className={`pi pi-cloud-upload text-3xl mb-2 transition-colors ${isHovering ? "text-blue-500" : "text-gray-500"}`} />
                        <p className={`mb-0 transition-colors ${isHovering ? "text-blue-500" : "text-gray-600"}`}>{requestFormData.photo ? requestFormData.photo.name : "Klik untuk mengunggah foto"}</p>
                    </motion.div>
                </div>
            </motion.div>
        </Dialog>
    );
};
