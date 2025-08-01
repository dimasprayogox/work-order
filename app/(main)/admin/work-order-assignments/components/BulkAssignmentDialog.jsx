// app/(main)/work-order-assignments/components/BulkAssignmentDialog.jsx
"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { Chip } from "primereact/chip";
import { ProgressBar } from "primereact/progressbar";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const BulkAssignmentDialog = ({
    visible,
    onHide,
    workOrders,
    technicians,
    onSuccess,
    showToast
}) => {
    const [assignments, setAssignments] = useState([]);
    const [globalAssignment, setGlobalAssignment] = useState({
        assigned_to_id: "",
        priority: "",
        scheduled_date: null
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Initialize assignments when workOrders change
    useEffect(() => {
        if (workOrders && workOrders.length > 0) {
            const initialAssignments = workOrders.map(wo => ({
                work_order_id: wo.id,
                work_order: wo,
                assigned_to_id: "",
                priority: wo.priority || "medium",
                scheduled_date: wo.scheduled_date ? new Date(wo.scheduled_date) : null
            }));
            setAssignments(initialAssignments);
        }
    }, [workOrders]);

    // Apply global settings to all assignments
    const applyGlobalSettings = () => {
        if (!globalAssignment.assigned_to_id) {
            showToast("warn", "Warning", "Pilih teknisi terlebih dahulu");
            return;
        }

        setAssignments(prev => prev.map(assignment => ({
            ...assignment,
            assigned_to_id: globalAssignment.assigned_to_id,
            priority: globalAssignment.priority || assignment.priority,
            scheduled_date: globalAssignment.scheduled_date || assignment.scheduled_date
        })));

        showToast("info", "Applied", "Global settings applied to all work orders");
    };

    // Update individual assignment
    const updateAssignment = (workOrderId, field, value) => {
        setAssignments(prev => prev.map(assignment =>
            assignment.work_order_id === workOrderId
                ? { ...assignment, [field]: value }
                : assignment
        ));
    };

    // Validate assignments
    const validateAssignments = () => {
        return assignments.every(assignment => assignment.assigned_to_id);
    };

    // Auto-assign based on workload balancing
    const autoAssignByWorkload = () => {
        const availableTechnicians = [...technicians].sort((a, b) =>
            (a.current_workload || 0) - (b.current_workload || 0)
        );

        let techIndex = 0;
        const updatedAssignments = assignments.map(assignment => {
            const selectedTech = availableTechnicians[techIndex % availableTechnicians.length];
            techIndex++;

            return {
                ...assignment,
                assigned_to_id: selectedTech.id
            };
        });

        setAssignments(updatedAssignments);
        showToast("success", "Auto-assigned", "Work orders distributed based on current workload");
    };

    // Submit bulk assignment
    const handleSubmit = async () => {
        setSubmitted(true);

        if (!validateAssignments()) {
            showToast("error", "Error", "Semua work order harus memiliki teknisi yang ditugaskan");
            return;
        }

        setLoading(true);
        try {
            const assignmentData = assignments.map(({ work_order_id, assigned_to_id, priority, scheduled_date }) => ({
                work_order_id,
                assigned_to_id,
                priority,
                scheduled_date: scheduled_date?.toISOString()
            }));

            const res = await fetch("/api/admin/work-order-assignments/bulk-assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ assignments: assignmentData })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showToast("success", "Berhasil",
                `${data.data.successful_assignments} work order berhasil ditugaskan`
            );

            if (data.data.errors && data.data.errors.length > 0) {
                showToast("warn", "Warning",
                    `${data.data.failed_assignments} work order gagal ditugaskan`
                );
            }

            onSuccess();
            onHide();
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const technicianOptions = technicians.map(tech => ({
        label: `${tech.full_name} (${tech.current_workload || 0} WO)`,
        value: tech.id,
        technician: tech
    }));

    const priorityOptions = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' }
    ];

    // Templates for DataTable
    const workOrderTemplate = (rowData) => (
        <div>
            <div className="font-medium">{rowData.work_order.title}</div>
            <div className="text-sm text-gray-500">
                {rowData.work_order.machine?.name || 'N/A'}
            </div>
        </div>
    );

    const statusTemplate = (rowData) => {
        const status = rowData.work_order.status;
        let severity = "info";

        switch (status) {
            case "pending": severity = "warning"; break;
            case "in_progress": severity = "info"; break;
            case "completed": severity = "success"; break;
            case "cancelled": severity = "danger"; break;
        }

        return <Tag value={status?.toUpperCase()} severity={severity} />;
    };

    const assignedTechTemplate = (rowData) => {
        const selectedTech = technicians.find(t => t.id === rowData.assigned_to_id);

        if (!selectedTech) {
            return <Badge value="Not Assigned" severity="warning" />;
        }

        return (
            <div className="flex align-items-center gap-2">
                <Avatar
                    image={selectedTech.profile_photo_url}
                    label={selectedTech.full_name?.charAt(0)}
                    size="small"
                    style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                />
                <div>
                    <div className="font-medium text-sm">{selectedTech.full_name}</div>
                    <div className="text-xs text-gray-500">
                        Workload: {selectedTech.current_workload || 0}
                    </div>
                </div>
            </div>
        );
    };

    const technicianDropdownTemplate = (rowData) => (
        <Dropdown
            value={rowData.assigned_to_id}
            options={technicianOptions}
            onChange={(e) => updateAssignment(rowData.work_order_id, 'assigned_to_id', e.value)}
            placeholder="Select technician"
            className="w-full"
            filter
        />
    );

    const priorityDropdownTemplate = (rowData) => (
        <Dropdown
            value={rowData.priority}
            options={priorityOptions}
            onChange={(e) => updateAssignment(rowData.work_order_id, 'priority', e.value)}
            className="w-full"
        />
    );

    const scheduleDateTemplate = (rowData) => (
        <Calendar
            value={rowData.scheduled_date}
            onChange={(e) => updateAssignment(rowData.work_order_id, 'scheduled_date', e.value)}
            showTime
            hourFormat="24"
            placeholder="Select date"
            className="w-full"
            minDate={new Date()}
        />
    );

    const assignedCount = assignments.filter(a => a.assigned_to_id).length;
    const totalCount = assignments.length;
    const progressPercentage = totalCount > 0 ? (assignedCount / totalCount) * 100 : 0;

    const footerContent = (
        <div className="flex justify-content-between align-items-center">
            <div className="flex align-items-center gap-2">
                <span className="text-sm">Progress:</span>
                <ProgressBar
                    value={progressPercentage}
                    style={{ width: '100px' }}
                    className="h-1rem"
                />
                <span className="text-sm">{assignedCount}/{totalCount}</span>
            </div>
            <div className="flex gap-2">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={onHide}
                    className="p-button-text"
                    disabled={loading}
                />
                <Button
                    label={`Assign ${totalCount} Work Orders`}
                    icon="pi pi-check"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={loading || assignedCount === 0}
                />
            </div>
        </div>
    );

    return (
        <Dialog
            header="Bulk Assignment"
            visible={visible}
            style={{ width: "90vw", height: "80vh" }}
            onHide={onHide}
            modal
            maximizable
            footer={footerContent}
        >
            {/* Global Settings */}
            <div className="mb-4 p-3 border-1 border-blue-300 border-round bg-blue-50">
                <div className="flex justify-content-between align-items-center mb-3">
                    <h5 className="mt-0 mb-0 text-blue-800">Global Assignment Settings</h5>
                    <div className="flex gap-2">
                        <Button
                            label="Auto-assign by Workload"
                            icon="pi pi-bolt"
                            size="small"
                            onClick={autoAssignByWorkload}
                            className="p-button-outlined"
                        />
                        <Button
                            label="Apply to All"
                            icon="pi pi-copy"
                            size="small"
                            onClick={applyGlobalSettings}
                        />
                    </div>
                </div>

                <div className="grid">
                    <div className="col-12 md:col-4">
                        <label className="block text-sm font-medium mb-1">Technician</label>
                        <Dropdown
                            value={globalAssignment.assigned_to_id}
                            options={technicianOptions}
                            onChange={(e) => setGlobalAssignment(prev => ({
                                ...prev, assigned_to_id: e.value
                            }))}
                            placeholder="Select technician"
                            className="w-full"
                            filter
                        />
                    </div>
                    <div className="col-12 md:col-4">
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <Dropdown
                            value={globalAssignment.priority}
                            options={priorityOptions}
                            onChange={(e) => setGlobalAssignment(prev => ({
                                ...prev, priority: e.value
                            }))}
                            placeholder="Select priority"
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-4">
                        <label className="block text-sm font-medium mb-1">Scheduled Date</label>
                        <Calendar
                            value={globalAssignment.scheduled_date}
                            onChange={(e) => setGlobalAssignment(prev => ({
                                ...prev, scheduled_date: e.value
                            }))}
                            showTime
                            hourFormat="24"
                            placeholder="Select date"
                            className="w-full"
                            minDate={new Date()}
                        />
                    </div>
                </div>
            </div>

            {/* Technician Summary */}
            <div className="mb-4">
                <h5>Technician Workload Summary</h5>
                <div className="flex flex-wrap gap-2">
                    {technicians.map(tech => (
                        <Chip
                            key={tech.id}
                            label={`${tech.full_name}: ${tech.current_workload || 0} WO`}
                            className={classNames({
                                'bg-green-100 text-green-800': (tech.current_workload || 0) <= 1,
                                'bg-yellow-100 text-yellow-800': (tech.current_workload || 0) > 1 && (tech.current_workload || 0) <= 3,
                                'bg-red-100 text-red-800': (tech.current_workload || 0) > 3
                            })}
                        />
                    ))}
                </div>
            </div>

            {/* Assignment Table */}
            <DataTable
                value={assignments}
                scrollable
                scrollHeight="400px"
                className="border-round"
                emptyMessage="No work orders to assign"
            >
                <Column
                    header="Work Order"
                    body={workOrderTemplate}
                    style={{ minWidth: '200px' }}
                />
                <Column
                    header="Status"
                    body={statusTemplate}
                    style={{ minWidth: '100px' }}
                />
                <Column
                    header="Current Assignment"
                    body={assignedTechTemplate}
                    style={{ minWidth: '180px' }}
                />
                <Column
                    header="Assign To"
                    body={technicianDropdownTemplate}
                    style={{ minWidth: '200px' }}
                />
                <Column
                    header="Priority"
                    body={priorityDropdownTemplate}
                    style={{ minWidth: '120px' }}
                />
                <Column
                    header="Schedule"
                    body={scheduleDateTemplate}
                    style={{ minWidth: '180px' }}
                />
            </DataTable>
        </Dialog>
    );
};

export default BulkAssignmentDialog;
