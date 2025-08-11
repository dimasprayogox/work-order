"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Message } from "primereact/message";
import { motion } from "framer-motion";

// Helper for default form state
const getDefaultFormData = () => ({
    status: "",
    description: "",
    started_at: null,
    completed_at: null,
});

export default function UpdateWorkOrderDialog({ visible, onHide, workOrder, fetchWorkOrders, showToast }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(getDefaultFormData());
    const [formErrors, setFormErrors] = useState({});

    // Determine if the form is editable based on the work order's current status
    // Add additional null checks
    const isEditable = workOrder && (workOrder.status === 'pending' || workOrder.status === 'in_progress');

    // Options for the status dropdown
    const statusOptions = [
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
    ];

    // Populate the form when the workOrder prop changes
    useEffect(() => {
        if (workOrder) {
            let nextStatus = workOrder.status;
            if (workOrder.status === 'pending') {
                nextStatus = 'in_progress';
            } else if (workOrder.status === 'in_progress') {
                nextStatus = 'completed';
            }

            setFormData({
                status: nextStatus,
                description: workOrder.description || "",
                // Set default start/completion time to now if not already set
                started_at: workOrder.started_at ? new Date(workOrder.started_at) : (nextStatus === 'in_progress' ? new Date() : null),
                completed_at: workOrder.completed_at ? new Date(workOrder.completed_at) : (nextStatus === 'completed' ? new Date() : null),
            });
            setFormErrors({}); // Reset errors on pending
        }
    }, [workOrder, visible]);

    // Validation logic
    const validateForm = () => {
        const errors = {};
        if (formData.status === 'in_progress' && !formData.started_at) {
            errors.started_at = "Start date is required for 'In Progress' status.";
        }
        if (formData.status === 'completed' && !formData.completed_at) {
            errors.completed_at = "Completion date is required for 'Completed' status.";
        }
        if (formData.status === 'completed' && !formData.description) {
            errors.description = "Work description cannot be empty when completing a work order.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Function to check if part requests are fulfilled before completing a work order
    const checkPartRequestEligibility = async () => {
        // Add null check for workOrder
        if (!workOrder || !workOrder.id) {
            showToast('error', 'Check Error', 'Work order information is not available.');
            return false;
        }

        try {
            // FIX: Use a GET request with a query parameter. No body.
            const response = await fetch(`/api/technician/part-request/${workOrder.id}`);

            // FIX: Properly check if the response is not OK (e.g., 404, 500)
            if (!response.ok) {
                const errorResult = await response.json();
                // If no part requests found (404), that's actually OK - work order can proceed
                if (response.status === 404) {
                    console.log("No part requests found for this work order, proceeding with update.");
                    return true;
                }
                throw new Error(errorResult.message || 'Failed to check part request status.');
            }

            const result = await response.json();
            
            // Check if there are part requests and if they are fulfilled
            if (!result.data || result.data.length === 0) {
                // No part requests is OK, allow the update
                console.log("No part requests found for this work order, proceeding with update.");
                return true;
            }

            const allFulfilled = result.data.every(request => request.status === 'fulfilled');
            console.log("Part request eligibility result:", result.data.map(pr => pr.status));
            
            // If there are part requests, they must all be fulfilled
            if (!allFulfilled) {
                showToast('error', 'Update Failed', 'Not all part requests for this work order have been fulfilled. Please ensure all part requests are fulfilled before updating the status.');
                return false; // Not eligible
            }
            return true; // Eligible
        } catch (error) {
            showToast('error', 'Check Error', error.message);
            return false;
        }
    };


    const handleSubmit = async () => {
        // Add null check for workOrder
        if (!workOrder || !workOrder.id) {
            showToast("error", "Error", "Work order information is not available.");
            return;
        }

        if (!validateForm()) {
            showToast("warn", "Validation Failed", "Please check the form for errors.");
            return;
        }

        setLoading(true);

        // If moving to 'completed' or 'in_progress', first check part request status
        // Only check if there are actually part requests for this work order
        if (formData.status === 'completed' || formData.status === 'in_progress') {
            // Check if the work order has part requests before validating them
            if (workOrder.partRequests && workOrder.partRequests.length > 0) {
                const isEligible = await checkPartRequestEligibility();
                if (!isEligible) {
                    setLoading(false);
                    return; // Stop execution if not eligible
                }
            }
            // If no part requests, proceed without checking
        }

        try {
            const payload = {
                status: formData.status,
                description: formData.description,
                // Conditionally add dates to payload only if they exist
                ...(formData.status === 'in_progress' && formData.started_at && { started_at: formData.started_at.toISOString() }),
                ...(formData.status === 'completed' && formData.completed_at && { completed_at: formData.completed_at.toISOString() }),
            };

            const response = await fetch(`/api/technician/work-orders/${workOrder.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Failed to update work order.");
            }

            showToast("success", "Success", "Work order updated successfully.");
            fetchWorkOrders();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    // Determine which status options to show based on the original status
    const getFilteredStatusOptions = () => {
        if (!workOrder) return [];
        if (workOrder.status === 'pending') return statusOptions.filter(opt => opt.value === 'in_progress');
        if (workOrder.status === 'in_progress') return statusOptions.filter(opt => opt.value === 'completed');
        return [];
    };

    const renderFooter = isEditable ? (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Update" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    ) : null;

    return (
        <Dialog
            header={`Update Work Order: ${workOrder?.title || "Loading..."}`}
            visible={visible}
            style={{ width: "min(90vw, 600px)" }}
            modal
            onHide={onHide}
            footer={renderFooter}
        >
            {/* Add loading state when workOrder is not available */}
            {!workOrder ? (
                <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}>
                    <i className="pi pi-spinner pi-spin" style={{ fontSize: '2rem' }}></i>
                    <span className="ml-2">Loading work order details...</span>
                </div>
            ) : isEditable ? (
                <motion.div className="p-fluid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="field mb-4">
                        <label htmlFor="status" className="font-bold mb-2 block">Update Status To</label>
                        <Dropdown
                            id="status"
                            value={formData.status}
                            options={getFilteredStatusOptions()}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.value }))}
                        />
                    </div>

                    {/* SIMPLIFIED: Show date fields based on selected form status */}
                    {formData.status === 'in_progress' && (
                        <div className="field mb-4">
                            <label htmlFor="started_at" className="font-bold mb-2 block">Start Date</label>
                            <Calendar id="started_at" value={formData.started_at} onChange={(e) => setFormData(prev => ({...prev, started_at: e.value}))} showIcon showTime hourFormat="24" className={formErrors.started_at ? "p-invalid" : ""} />
                            {formErrors.started_at && <Message severity="error" text={formErrors.started_at} className="mt-2" />}
                        </div>
                    )}

                    {formData.status === 'completed' && (
                         <div className="field mb-4">
                            <label htmlFor="completed_at" className="font-bold mb-2 block">Completion Date</label>
                            <Calendar id="completed_at" value={formData.completed_at} onChange={(e) => setFormData(prev => ({...prev, completed_at: e.value}))} showIcon showTime hourFormat="24" className={formErrors.completed_at ? "p-invalid" : ""} />
                            {formErrors.completed_at && <Message severity="error" text={formErrors.completed_at} className="mt-2" />}
                        </div>
                    )}

                    <div className="field mb-4">
                        <label htmlFor="description" className="font-bold mb-2 block">Work description</label>
                        <InputTextarea id="description" rows={5} value={formData.description} onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))} autoResize className={formErrors.description ? "p-invalid" : ""} />
                        {formErrors.description && <Message severity="error" text={formErrors.description} className="mt-2" />}
                    </div>
                </motion.div>
            ) : (
                <Message severity="info" text={`This work order cannot be updated because its status is '${workOrder?.status || 'unknown'}'.`} />
            )}
        </Dialog>
    );
}
