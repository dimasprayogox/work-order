// components/WorkOrderAddModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

const WorkOrderAddModal = ({ visible, onHide, machines, onAddSuccess, showToast }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        machine_id: null,
        photo: null,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) {
            setFormData({
                title: '',
                description: '',
                machine_id: null,
                photo: null,
            });
        }
    }, [visible]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, photo: e.files[0] }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const formPayload = new FormData();
        formPayload.append('title', formData.title);
        formPayload.append('description', formData.description);
        formPayload.append('machine_id', formData.machine_id);
        if (formData.photo) {
            formPayload.append('photo', formData.photo);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues`, {
                method: 'POST',
                body: formPayload,
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Failed to add work order.";
                throw new Error(`Failed to add work order: ${errorDetail}`);
            }

            showToast("success", "Success", "Work order added successfully!");
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
            <Button label="Cancel" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Submit" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    );

    return (
        <Dialog
            header="Add New Work Order"
            visible={visible}
            style={{ width: '50vw' }}
            onHide={onHide}
            footer={dialogFooter}
            modal
            className="p-fluid"
        >
            <div className="p-fluid formgrid grid">
                <div className="field col-12">
                    <label htmlFor="title">Issue Title</label>
                    <InputText
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        autoFocus
                    />
                </div>
                <div className="field col-12">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        cols={30}
                    />
                </div>
                <div className="field col-12">
                    <label htmlFor="machine_id">Machine</label>
                    <Dropdown
                        id="machine_id"
                        name="machine_id"
                        value={formData.machine_id}
                        options={machines}
                        onChange={handleChange}
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select a Machine"
                    />
                </div>
                <div className="field col-12">
                    <label htmlFor="photo">Photo</label>
                    <FileUpload
                        name="photo"
                        customUpload
                        uploadHandler={handleFileChange}
                        accept="image/*"
                        maxFileSize={1000000} // 1MB
                        emptyTemplate={<p className="m-0">Drag and drop image here to upload.</p>}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default WorkOrderAddModal;