"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import { motion } from "framer-motion";
import { Toast } from "primereact/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

// This is now a regular component, not a page.
const EditRequestDialog = ({ visible, onHide, request, fetchWorkRequests, showToast }) => {
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState([]);
    const [formData, setFormData] = useState({
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
                throw new Error(errorData.message || "Failed to load machines.");
            }
            const result = await response.json();
            setMachines(result.data.map((machine) => ({ label: machine.name, value: machine.id })));
        } catch (error) {
            showToast("error", "Error", `Failed to load machines: ${error.message}`);
        }
    }, [showToast]);

    const validateForm = useCallback(() => {
        const errors = {};
        if (!formData.machine_id) errors.machine_id = "Machine must be selected";
        if (!formData.title.trim()) errors.title = "Title cannot be empty";
        if (formData.title.trim().length < 3) errors.title = "Title must be at least 3 characters";
        if (!formData.description.trim()) errors.description = "Description cannot be empty";
        if (formData.description.trim().length < 10) errors.description = "Description must be at least 10 characters";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleChange = useCallback((e, field) => {
        const value = e.target ? e.target.value : e.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0] || null;
        setFormData((prev) => ({ ...prev, photo: file }));
    }, []);

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast("error", "Validation Failed", "Please check the form for errors");
            return;
        }

        setLoading(true);
        const formDataToSend = new FormData();
        formDataToSend.append("machine_id", formData.machine_id);
        formDataToSend.append("title", formData.title);
        formDataToSend.append("description", formData.description);
        if (formData.photo) {
            formDataToSend.append("photo", formData.photo);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues/${request.id}`, {
                method: "PATCH", // Using PATCH for partial updates is common
                body: formDataToSend,
                credentials: "include"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update request");
            }

            const result = await response.json();
            showToast("success", "Success", result.message || "Request updated successfully");
            fetchWorkRequests();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    // PERBAIKAN: Tambahkan fetchMachines ke dependency array
    useEffect(() => {
        if (visible && request) {
            setFormData({
                machine_id: request.machine_id,
                title: request.title,
                description: request.description,
                photo: null // Reset photo field on open
            });
            fetchMachines();
        }
    }, [visible, request, fetchMachines]);

    const renderFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Update" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    );

    return (
        <Dialog header="Edit Work Request" visible={visible} style={{ width: "min(90vw, 600px)", borderRadius: "16px" }} modal className="p-fluid shadow-2xl" onHide={onHide} footer={renderFooter}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="field mb-4">
                    <label htmlFor="machine_id" className="font-bold mb-2 block">
                        Machine
                    </label>
                    <Dropdown id="machine_id" value={formData.machine_id} options={machines} onChange={(e) => handleChange(e, "machine_id")} placeholder="Select Machine" className={formErrors.machine_id ? "p-invalid" : ""} />
                    {formErrors.machine_id && <Message severity="error" text={formErrors.machine_id} className="mt-2" />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="title" className="font-bold mb-2 block">
                        Title
                    </label>
                    <InputText id="title" value={formData.title} onChange={(e) => handleChange(e, "title")} className={formErrors.title ? "p-invalid" : ""} />
                    {formErrors.title && <Message severity="error" text={formErrors.title} className="mt-2" />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="description" className="font-bold mb-2 block">
                        Description
                    </label>
                    <InputTextarea id="description" rows={5} value={formData.description} onChange={(e) => handleChange(e, "description")} className={formErrors.description ? "p-invalid" : ""} autoResize />
                    {formErrors.description && <Message severity="error" text={formErrors.description} className="mt-2" />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="photo" className="font-bold mb-2 block">
                        Photo (Optional)
                    </label>
                    <motion.div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => fileInputRef.current.click()}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                        <i className={`pi pi-cloud-upload text-3xl mb-2 transition-colors ${isHovering ? "text-blue-500" : "text-gray-500"}`} />
                        <p className={`mb-0 transition-colors ${isHovering ? "text-blue-500" : "text-gray-600"}`}>{formData.photo ? formData.photo.name : "Click to upload a new photo"}</p>
                    </motion.div>
                    {request?.photo_url && !formData.photo && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">Current photo:</p>
                            <img src={request.photo_url} alt="Current" className="mt-1 border-round" style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                        </div>
                    )}
                </div>
            </motion.div>
        </Dialog>
    );
};

// This is the actual page component. It should not receive props.
export default function EditWorkRequestPage() {
    // In a real application, you would fetch the specific request data here
    // based on a URL parameter (e.g., /work-request/edit/123)
    const [requestData, setRequestData] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const toast = useRef(null);

    // Dummy fetch function for demonstration
    const fetchWorkRequests = useCallback(() => {
        console.log("Refetching work requests...");
    }, []);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail });
    }, []);

    // Effect to open the dialog once data is "loaded"
    useEffect(() => {
        // Simulate fetching data for a specific request
        const mockRequest = {
            id: 1,
            machine_id: 2,
            title: "Mesin Berisik",
            description: "Mesin mengeluarkan suara aneh saat beroperasi pada kecepatan tinggi.",
            photo_url: "https://placehold.co/400x400?text=Old+Photo"
        };
        setRequestData(mockRequest);
        setIsDialogOpen(true);
    }, []);


    return (
        <div className="p-4">
            <Toast ref={toast} />
            <h1>Edit Work Request</h1>
            <p>Loading edit form...</p>

            {/* The dialog is controlled by the page's state */}
            {requestData && (
                <EditRequestDialog
                    visible={isDialogOpen}
                    onHide={() => setIsDialogOpen(false)}
                    request={requestData}
                    fetchWorkRequests={fetchWorkRequests}
                    showToast={showToast}
                />
            )}
        </div>
    );
}

