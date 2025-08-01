// app/(main)/work-order-assignments/components/AssignmentDialog.jsx
"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const AssignmentDialog = ({
    visible,
    onHide,
    workOrder,
    technicians,
    onSuccess,
    showToast
}) => {
    const [form, setForm] = useState({
        assigned_to_id: "",
        priority: "",
        scheduled_date: null,
        notes: "",
        reason: "" // For reassignment
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const isReassignment = workOrder?.assigned_to_id;

    useEffect(() => {
        if (workOrder && visible) {
            setForm({
                assigned_to_id: workOrder.assigned_to_id || "",
                priority: workOrder.priority || "medium",
                scheduled_date: workOrder.scheduled_date ? new Date(workOrder.scheduled_date) : null,
                notes: workOrder.notes || "",
                reason: ""
            });
        } else {
            setForm({
                assigned_to_id: "",
                priority: "medium",
                scheduled_date: null,
                notes: "",
                reason: ""
            });
        }
        setSubmitted(false);
    }, [workOrder, visible]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!form.assigned_to_id) return false;
        if (isReassignment && !form.reason.trim()) return false;
        return true;
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        if (!validateForm()) {
            showToast("error", "Error", "Harap lengkapi semua field yang wajib diisi");
            return;
        }

        setLoading(true);
        try {
            let endpoint, method, body;

            if (isReassignment) {
                // Reassignment
                endpoint = `/api/admin/work-order-assignments/${workOrder.id}/reassign`;
                method = "PATCH";
                body = {
                    new_assigned_to_id: form.assigned_to_id,
                    reason: form.reason,
                    priority: form.priority
                };
            } else {
                // New assignment
                endpoint = "/api/admin/work-order-assignments/assign";
                method = "POST";
                body = {
                    work_order_id: workOrder.id,
                    assigned_to_id: form.assigned_to_id,
                    priority: form.priority,
                    scheduled_date: form.scheduled_date?.toISOString(),
                    notes: form.notes
                };
            }

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showToast("success", "Berhasil", data.message);
            onSuccess();
            onHide();
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedTechnician = technicians.find(t => t.id === form.assigned_to_id);
    const currentTechnician = workOrder?.assignedTo || technicians.find(t => t.id === workOrder?.assigned_to_id);

    const technicianOptions = technicians.map(tech => ({
        label: `${tech.full_name} - Workload: ${tech.current_workload || 0}`,
        value: tech.id,
        technician: tech
    }));

    const priorityOptions = [
        { label: 'Low Priority', value: 'low' },
        { label: 'Medium Priority', value: 'medium' },
        { label: 'High Priority', value: 'high' }
    ];

    const technicianItemTemplate = (option) => {
        if (!option) return null;

        const tech = option.technician;
        const workloadColor = tech.current_workload > 3 ? 'danger' : tech.current_workload > 1 ? 'warning' : 'success';

        return (
            <div className="flex align-items-center gap-2 p-2">
                <Avatar
                    image={tech.profile_photo_url}
                    label={tech.full_name?.charAt(0)}
                    size="small"
                    style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                />
                <div className="flex-1">
                    <div className="font-medium">{tech.full_name}</div>
                    <div className="text-sm text-gray-500">{tech.email}</div>
                </div>
                <Tag
                    value={`${tech.current_workload || 0} WO`}
                    severity={workloadColor}
                    className="text-xs"
                />
            </div>
        );
    };

    const footerContent = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
                disabled={loading}
            />
            <Button
                label={isReassignment ? "Reassign" : "Assign"}
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
            />
        </div>
    );

    if (!workOrder) return null;

    return (
        <Dialog
            header={isReassignment ? "Reassign Work Order" : "Assign Work Order"}
            visible={visible}
            style={{ width: "50rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
            footer={footerContent}
        >
            {/* Work Order Info */}
            <div className="mb-4 p-3 border-1 border-gray-300 border-round bg-gray-50">
                <h4 className="mt-0 mb-2">Work Order Details</h4>
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <strong>Title:</strong> {workOrder.title}
                    </div>
                    <div className="col-12 md:col-6">
                        <strong>Machine:</strong> {workOrder.machine?.name || 'N/A'}
                    </div>
                    <div className="col-12 md:col-6">
                        <strong>Status:</strong>
                        <Tag
                            value={workOrder.status?.toUpperCase()}
                            severity={workOrder.status === 'pending' ? 'warning' : 'info'}
                            className="ml-2"
                        />
                    </div>
                    <div className="col-12 md:col-6">
                        <strong>Current Priority:</strong>
                        <Tag
                            value={workOrder.priority?.toUpperCase() || 'MEDIUM'}
                            severity={workOrder.priority === 'high' ? 'danger' : workOrder.priority === 'low' ? 'success' : 'warning'}
                            className="ml-2"
                        />
                    </div>
                </div>
                {workOrder.description && (
                    <div className="mt-2">
                        <strong>Description:</strong>
                        <p className="mt-1 text-gray-700">{workOrder.description}</p>
                    </div>
                )}
            </div>

            {/* Current Assignment Info (for reassignment) */}
            {isReassignment && currentTechnician && (
                <div className="mb-4 p-3 border-1 border-blue-300 border-round bg-blue-50">
                    <h5 className="mt-0 mb-2 text-blue-800">Currently Assigned To:</h5>
                    <div className="flex align-items-center gap-2">
                        <Avatar
                            image={currentTechnician.profile_photo_url}
                            label={currentTechnician.full_name?.charAt(0)}
                            size="normal"
                            style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                        />
                        <div>
                            <div className="font-medium text-blue-800">{currentTechnician.full_name}</div>
                            <div className="text-sm text-blue-600">
                                Workload: {currentTechnician.current_workload || 0} work orders
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="formgrid grid">
                {/* Technician Selection */}
                <div className="field col-12">
                    <label htmlFor="assigned_to_id" className="font-medium">
                        {isReassignment ? 'Reassign to Technician' : 'Assign to Technician'}
                        <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="assigned_to_id"
                        value={form.assigned_to_id}
                        options={technicianOptions}
                        onChange={(e) => handleChange("assigned_to_id", e.value)}
                        placeholder="Select technician"
                        filter
                        showClear
                        itemTemplate={technicianItemTemplate}
                        className={classNames({ "p-invalid": submitted && !form.assigned_to_id })}
                    />
                    {submitted && !form.assigned_to_id && (
                        <small className="p-error">Technician is required</small>
                    )}
                </div>

                {/* Selected Technician Preview */}
                {selectedTechnician && (
                    <div className="field col-12">
                        <div className="p-3 border-1 border-green-300 border-round bg-green-50">
                            <div className="flex align-items-center gap-2 mb-2">
                                <i className="pi pi-user text-green-600"></i>
                                <span className="font-medium text-green-800">Selected Technician:</span>
                            </div>
                            <div className="grid">
                                <div className="col-12 md:col-6">
                                    <strong>Name:</strong> {selectedTechnician.full_name}
                                </div>
                                <div className="col-12 md:col-6">
                                    <strong>Email:</strong> {selectedTechnician.email}
                                </div>
                                <div className="col-12 md:col-6">
                                    <strong>Current Workload:</strong>
                                    <Tag
                                        value={`${selectedTechnician.current_workload || 0} WO`}
                                        severity={selectedTechnician.current_workload > 3 ? 'danger' : selectedTechnician.current_workload > 1 ? 'warning' : 'success'}
                                        className="ml-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Priority */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="priority" className="font-medium">Priority</label>
                    <Dropdown
                        id="priority"
                        value={form.priority}
                        options={priorityOptions}
                        onChange={(e) => handleChange("priority", e.value)}
                        placeholder="Select priority"
                    />
                </div>

                {/* Scheduled Date */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="scheduled_date" className="font-medium">Scheduled Date</label>
                    <Calendar
                        id="scheduled_date"
                        value={form.scheduled_date}
                        onChange={(e) => handleChange("scheduled_date", e.value)}
                        showTime
                        hourFormat="24"
                        placeholder="Select date and time"
                        minDate={new Date()}
                        showIcon
                    />
                </div>

                {/* Reason (for reassignment) */}
                {isReassignment && (
                    <div className="field col-12">
                        <label htmlFor="reason" className="font-medium">
                            Reason for Reassignment <span className="text-red-500">*</span>
                        </label>
                        <InputTextarea
                            id="reason"
                            value={form.reason}
                            onChange={(e) => handleChange("reason", e.target.value)}
                            placeholder="Explain why this work order is being reassigned"
                            rows={3}
                            className={classNames({ "p-invalid": submitted && !form.reason.trim() })}
                        />
                        {submitted && !form.reason.trim() && (
                            <small className="p-error">Reason is required for reassignment</small>
                        )}
                    </div>
                )}

                {/* Notes */}
                <div className="field col-12">
                    <label htmlFor="notes" className="font-medium">
                        {isReassignment ? 'Additional Notes' : 'Notes'}
                    </label>
                    <InputTextarea
                        id="notes"
                        value={form.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        placeholder="Add any additional notes or instructions"
                        rows={3}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default AssignmentDialog;
