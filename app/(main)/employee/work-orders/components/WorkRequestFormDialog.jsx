"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import { Image } from "primereact/image";
import { RadioButton } from "primereact/radiobutton";
import { classNames } from "primereact/utils";
import { useState, useEffect, useRef } from "react";

const WorkRequestFormDialog = ({
    visible,
    onHide,
    workOrder,
    machines = [],
    assets = [],
    fetchWorkOrders,
    showToast
}) => {
    const fileUploadRef = useRef(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        entity_type: "machine", // 'machine' or 'asset'
        machine_id: null,
        asset_id: null,
        priority: "medium", // Add priority field
        photo: null,
        current_photo_url: ""
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (workOrder) {
            setForm({
                title: workOrder.title || "",
                description: workOrder.description || "",
                entity_type: workOrder.machine_id ? "machine" : "asset",
                machine_id: workOrder.machine_id || null,
                asset_id: workOrder.asset_id || null,
                priority: workOrder.priority || "medium",
                photo: null,
                current_photo_url: workOrder.photo_url || ""
            });
        } else {
            setForm({
                title: "",
                description: "",
                entity_type: "machine",
                machine_id: null,
                asset_id: null,
                priority: "medium",
                photo: null,
                current_photo_url: ""
            });
        }
        // Reset errors and submitted state when dialog opens/closes
        setErrors({});
        setSubmitted(false);
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    }, [visible, workOrder]);

    const handleChange = (field, value) => {
        setForm((prev) => {
            const newForm = { ...prev, [field]: value };
            
            // When entity type changes, clear the other entity selection
            if (field === "entity_type") {
                if (value === "machine") {
                    newForm.asset_id = null;
                } else {
                    newForm.machine_id = null;
                }
            }
            
            return newForm;
        });
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
        const errors = {};
        let isValid = true;

        if (!form.title || form.title.trim().length < 3) {
            errors.title = "Title must be at least 3 characters long.";
            isValid = false;
        }

        if (!form.description || form.description.trim().length < 10) {
            errors.description = "Description must be at least 10 characters long.";
            isValid = false;
        }

        if (form.entity_type === "machine" && !form.machine_id) {
            errors.machine_id = "Machine must be selected.";
            isValid = false;
        }

        if (form.entity_type === "asset" && !form.asset_id) {
            errors.asset_id = "Asset must be selected.";
            isValid = false;
        }

        if (!form.priority) {
            errors.priority = "Priority must be selected.";
            isValid = false;
        }

        setErrors(errors);
        return { isValid, errors };
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const { isValid } = validateForm();

        if (!isValid) {
            showToast("error", "Validation Failed", "Please correct the errors in the form.");
            return;
        }

        setLoading(true);
        try {
            console.log("Form state before submit:", form); // Debug log
            
            const formPayload = new FormData();
            formPayload.append("title", form.title);
            formPayload.append("description", form.description);
            formPayload.append("priority", form.priority);
            
            console.log("Priority being sent:", form.priority); // Debug log
            
            if (form.entity_type === "machine") {
                formPayload.append("machine_id", form.machine_id);
            } else {
                formPayload.append("asset_id", form.asset_id);
            }

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
                
                // Handle validation errors from backend
                if (res.status === 400 && errorData.errors) {
                    const backendErrors = {};
                    Object.keys(errorData.errors).forEach(field => {
                        if (Array.isArray(errorData.errors[field])) {
                            backendErrors[field] = errorData.errors[field][0]; // Take first error message
                        } else {
                            backendErrors[field] = errorData.errors[field];
                        }
                    });
                    setErrors(backendErrors);
                    
                    // Show specific error message based on the field
                    const errorMessages = Object.values(backendErrors);
                    const errorMessage = errorMessages.length > 0 ? errorMessages.join(', ') : "Please check the form for errors.";
                    showToast("error", "Validation Failed", errorMessage);
                    return;
                }
                
                throw new Error(errorData.message || `Failed to ${workOrder ? "update" : "create"} issue. Status: ${res.status}`);
            }

            const data = await res.json();
            showToast("success", "Success", data.message || `Work order successfully ${workOrder ? "updated" : "added"}!`);
            fetchWorkOrders();
            onHide();
        } catch (error) {
            console.error("Error saving work order:", error);
            showToast("error", "Error", error.message || "An error occurred while saving the work order. Please check your connection or contact the administrator.");
        } finally {
            setLoading(false);
        }
    };

    const formatStatusForDisplay = (statusValue) => {
        if (!statusValue) return "N/A";
        const statusMap = {
            open: "Pending",
            in_progress: "In Progress",
            resolved: "Resolved",
            closed: "Closed"
        };
        return statusMap[statusValue] || statusValue.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Safely handle machines and assets props
    const machineOptions = (machines || []).map((machine) => ({
        label: machine.name,
        value: machine.id
    }));

    const assetOptions = (assets || []).map((asset) => ({
        label: asset.name,
        value: asset.id
    }));

    // Priority options
    const priorityOptions = [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" }
    ];

    return (
        <Dialog header={workOrder ? "Edit Work Order" : "Create New Work Order Request"} visible={visible} style={{ width: "60vw" }} breakpoints={{ "960px": "75vw", "641px": "90vw" }} onHide={onHide} modal className="p-fluid">
            <div className="field grid mb-4">
                <label htmlFor="title" className="col-12 mb-2 font-medium">
                    Issue Title <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText 
                        id="title" 
                        value={form.title} 
                        onChange={(e) => handleChange("title", e.target.value)} 
                        className={classNames({ "p-invalid": (submitted && errors.title) || (submitted && !form.title) })} 
                    />
                    {submitted && (errors.title || (!form.title && "Title is required")) && (
                        <small className="p-error">{errors.title || "Title is required"}</small>
                    )}
                    <small className="text-500 block mt-1">Minimum 3 characters</small>
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="description" className="col-12 mb-2 font-medium">
                    Description <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputTextarea 
                        id="description" 
                        value={form.description} 
                        onChange={(e) => handleChange("description", e.target.value)} 
                        rows={5} 
                        className={classNames({ "p-invalid": (submitted && errors.description) || (submitted && !form.description) })} 
                    />
                    {submitted && (errors.description || (!form.description && "Description is required")) && (
                        <small className="p-error">{errors.description || "Description is required"}</small>
                    )}
                    <small className="text-500 block mt-1">Minimum 10 characters</small>
                </div>
            </div>

            {workOrder && (
                <div className="field grid mb-4">
                    <label htmlFor="status" className="col-12 mb-2 font-medium">
                        Status
                    </label>
                    <div className="col-12">
                        <InputText id="status" value={formatStatusForDisplay(workOrder?.status)} readOnly disabled />
                        <small className="text-500 block mt-1">Status updated by technician</small>
                    </div>
                </div>
            )}

            {!workOrder && (
                <div className="field grid mb-4">
                    <label className="col-12 mb-2 font-medium">
                        Report Issue For <span className="text-red-500">*</span>
                    </label>
                    <div className="col-12">
                        <div className="flex gap-4">
                            <div className="flex align-items-center">
                                <RadioButton inputId="entity_machine" name="entity_type" value="machine" onChange={(e) => handleChange("entity_type", e.value)} checked={form.entity_type === "machine"} />
                                <label htmlFor="entity_machine" className="ml-2">Machine</label>
                            </div>
                            <div className="flex align-items-center">
                                <RadioButton inputId="entity_asset" name="entity_type" value="asset" onChange={(e) => handleChange("entity_type", e.value)} checked={form.entity_type === "asset"} />
                                <label htmlFor="entity_asset" className="ml-2">Asset</label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {form.entity_type === "machine" && (
                <div className="field grid mb-4">
                    <label htmlFor="machine_id" className="col-12 mb-2 font-medium">
                        Machine <span className="text-red-500">*</span>
                    </label>
                    <div className="col-12">
                        <Dropdown 
                            id="machine_id" 
                            value={form.machine_id} 
                            options={machineOptions} 
                            onChange={(e) => handleChange("machine_id", e.value)} 
                            placeholder="Select Machine" 
                            className={classNames({ "p-invalid": (submitted && errors.machine_id) || (submitted && !form.machine_id) })} 
                        />
                        {submitted && (errors.machine_id || (!form.machine_id && "Machine must be selected")) && (
                            <small className="p-error">{errors.machine_id || "Machine must be selected"}</small>
                        )}
                    </div>
                </div>
            )}

            {form.entity_type === "asset" && (
                <div className="field grid mb-4">
                    <label htmlFor="asset_id" className="col-12 mb-2 font-medium">
                        Asset <span className="text-red-500">*</span>
                    </label>
                    <div className="col-12">
                        <Dropdown 
                            id="asset_id" 
                            value={form.asset_id} 
                            options={assetOptions} 
                            onChange={(e) => handleChange("asset_id", e.value)} 
                            placeholder="Select Asset" 
                            className={classNames({ "p-invalid": (submitted && errors.asset_id) || (submitted && !form.asset_id) })} 
                        />
                        {submitted && (errors.asset_id || (!form.asset_id && "Asset must be selected")) && (
                            <small className="p-error">{errors.asset_id || "Asset must be selected"}</small>
                        )}
                    </div>
                </div>
            )}

            <div className="field grid mb-4">
                <label htmlFor="priority" className="col-12 mb-2 font-medium">
                    Priority <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <Dropdown 
                        id="priority" 
                        value={form.priority} 
                        options={priorityOptions} 
                        onChange={(e) => handleChange("priority", e.value)} 
                        placeholder="Select Priority" 
                        className={classNames({ "p-invalid": (submitted && errors.priority) || (submitted && !form.priority) })} 
                    />
                    {submitted && (errors.priority || (!form.priority && "Priority must be selected")) && (
                        <small className="p-error">{errors.priority || "Priority must be selected"}</small>
                    )}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="photo" className="col-12 mb-2 font-medium">
                    Photo
                </label>
                <div className="col-12">
                    {form.current_photo_url && (
                        <div className="mb-3">
                            <p className="text-sm text-500 mb-1">{workOrder ? "Current Photo:" : "Preview:"}</p>
                            <Image src={form.current_photo_url} alt="Issue Photo" width="100" preview />
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
                        chooseLabel="Choose Photo"
                        uploadLabel="Upload (Not used here)"
                        cancelLabel="Clear"
                        customUpload={true}
                        emptyTemplate={<p className="m-0">Drag and drop photo here or click to browse</p>}
                    />
                    <small className="text-500 block mt-1">Max file size: 1MB. Accepted format: image</small>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
                <Button label={workOrder ? "Save" : "Submit"} icon="pi pi-check" onClick={handleSubmit} loading={loading} disabled={loading} />
            </div>
        </Dialog>
    );
};

export default WorkRequestFormDialog;
