"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { classNames } from 'primereact/utils';

const WorkOrderAddModal = ({ visible, onHide, machines, onAddSuccess, showToast }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        machine_id: null,
        photo: null,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!visible) {
            setFormData({
                title: '',
                description: '',
                machine_id: null,
                photo: null,
            });
            setErrors({});
        }
    }, [visible]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleDropdownChange = (e) => {
        setFormData(prev => ({ ...prev, machine_id: e.value }));
        if (errors.machine_id) {
            setErrors(prev => ({ ...prev, machine_id: undefined }));
        }
    };

    const handleFileChange = ({ files }) => {
        setFormData(prev => ({ ...prev, photo: files[0] }));
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

        setLoading(true);
        const formPayload = new FormData();
        formPayload.append('title', formData.title);
        formPayload.append('description', formData.description);
        formPayload.append('machine_id', formData.machine_id);
        if (formData.photo) {
            formPayload.append('photo', formData.photo);
        }

        try {
            const response = await fetch(`/api/employee/issues`, {
                method: 'POST',
                body: formPayload,
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Gagal menambahkan work order.";
                throw new Error(errorDetail);
            }

            showToast("success", "Berhasil", "Work order berhasil ditambahkan!");
            onAddSuccess();
            onHide();
        } catch (error) {
            console.error("Error adding work order:", error);
            showToast("error", "Error", `${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const dialogFooter = (
        <div>
            <Button label="Batal" icon="pi pi-times" outlined onClick={onHide} disabled={loading} />
            <Button label="Kirim" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    );

    return (
        <Dialog
            header="Buat Permintaan Work Order Baru"
            visible={visible}
            style={{ width: '50vw' }}
            onHide={onHide}
            footer={dialogFooter}
            modal
            className="p-fluid"
        >
            <div className="p-fluid formgrid grid">
                <div className="field col-12">
                    <label htmlFor="title">Judul Isu</label>
                    <InputText
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': errors.title })}
                    />
                    {errors.title && <small className="p-error">{errors.title}</small>}
                </div>
                <div className="field col-12">
                    <label htmlFor="description">Deskripsi</label>
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
                <div className="field col-12">
                    <label htmlFor="machine_id">Mesin</label>
                    <Dropdown
                        id="machine_id"
                        name="machine_id"
                        value={formData.machine_id}
                        options={machines}
                        onChange={handleDropdownChange}
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Pilih Mesin"
                        className={classNames({ 'p-invalid': errors.machine_id })}
                    />
                    {errors.machine_id && <small className="p-error">{errors.machine_id}</small>}
                </div>
                <div className="field col-12">
                    <label htmlFor="photo">Foto</label>
                    <FileUpload
                        name="photo"
                        customUpload
                        uploadHandler={() => {}}
                        accept="image/*"
                        maxFileSize={1000000}
                        multiple={false}
                        chooseLabel="Pilih Gambar"
                        onSelect={(e) => {
                            const file = e.files?.[0];
                            if (file) {
                                setFormData(prev => ({ ...prev, photo: file }));
                            }
                        }}
                        itemTemplate={(file) => (
                            <div className="flex align-items-center gap-3">
                                <img
                                    alt={file.name}
                                    role="presentation"
                                    src={URL.createObjectURL(file)}
                                    style={{ width: '100px', borderRadius: '6px' }}
                                />
                                <div className="flex flex-column">
                                    <span>{file.name}</span>
                                    <span className="text-sm text-color-secondary">{Math.round(file.size / 1024)} KB</span>
                                </div>
                                <Button
                                    icon="pi pi-times"
                                    rounded
                                    text
                                    severity="danger"
                                    onClick={() => setFormData(prev => ({ ...prev, photo: null }))}
                                />
                            </div>
                        )}
                        emptyTemplate={<p className="m-0">Tarik dan lepas gambar di sini atau klik tombol untuk unggah.</p>}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default WorkOrderAddModal;
