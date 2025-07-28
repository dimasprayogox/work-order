"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import { Image } from "primereact/image";
import { classNames } from "primereact/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

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

    const statusOptions = [
        { label: "Open", value: "open" },
        { label: "In Progress", value: "in_progress" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" },
    ];

    const machineOptions = machines.map(machine => ({
        label: machine.name,
        value: machine.id,
    }));

    useEffect(() => {
        if (workOrder) {
            setFormData({
                title: workOrder.title || "",
                description: workOrder.description || "",
                machine_id: workOrder.machine_id || null,
                current_photo_url: workOrder.photo_url || "",
            });
            setSelectedFile(null);
            setErrors({});
        }
    }, [workOrder]);

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
        if (workOrder) {
            setFormData((prev) => ({ ...prev, current_photo_url: "" })); // Set to empty string to trigger remove_photo
        }
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = "Title is required.";
        }
        if (!formData.description.trim()) {
            newErrors.description = "Description is required.";
        }
        if (!formData.machine_id) {
            newErrors.machine_id = "Machine is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast("error", "Validation Error", "Please correct the errors in the form.");
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
            } else if (!formData.current_photo_url && workOrder?.photo_url) {
                formDataToSubmit.append("remove_photo", "true");
            }

            const response = await fetch(`${API_BASE_URL}/employee/issues/${workOrder.id}`, {
                method: "PATCH",
                body: formDataToSubmit,
                credentials: "include",
            });

            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Failed to update work order.";
                throw new Error(errorDetail);
            }

            onUpdateSuccess();
            onHide();
        } catch (error) {
            console.error("Error updating work order:", error);
            showToast("error", "Error", `Failed to update work order: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const footerContent = (
        <div>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Save" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
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
                            Issue Title
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
                            Description
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
                        <small className="p-text-secondary">Status is updated by technicians.</small>
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="machine_id" className="font-bold">
                            Machine
                        </label>
                        <Dropdown
                            id="machine_id"
                            name="machine_id"
                            value={formData.machine_id}
                            options={machineOptions}
                            onChange={handleChange}
                            placeholder="Select a Machine"
                            className={classNames({ 'p-invalid': errors.machine_id })}
                        />
                        {errors.machine_id && <small className="p-error">{errors.machine_id}</small>}
                    </div>

                    <div className="field col-12">
                        <label htmlFor="photo" className="font-bold mb-2 block">
                            Photo
                        </label>
                        {formData.current_photo_url && (
                            <div className="mb-3">
                                <p className="text-sm text-500 mb-1">Current Photo:</p>
                                <Image src={formData.current_photo_url} alt="Current Issue Photo" width="100" preview />
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
                            chooseLabel="Choose New Photo"
                            uploadLabel="Upload (Not used here)"
                            cancelLabel="Clear"
                            customUpload={true}
                            emptyTemplate={<p className="m-0">Drag and drop new photo here or click to browse.</p>}
                        />
                        <small className="text-500 block mt-2">Max file size: 1MB. Accepted formats: images.</small>
                    </div>
                </div>
            ) : (
                <p>No work order selected for editing.</p>
            )}
        </Dialog>
    );
};

export default WorkOrderEditModal;