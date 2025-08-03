// app/(main)/work-order-assignments/page.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip";

import WorkOrderAssignmentTable from "./components/WorkOrderAssignmentTable";
import AssignmentDialog from "./components/AssignmentDialog";
import BulkAssignmentDialog from "./components/BulkAssignmentDialog";

const WorkOrderAssignmentPage = () => {
    const toast = useRef(null);

    const [workOrders, setWorkOrders] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [selectedWorkOrders, setSelectedWorkOrders] = useState([]);

    const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
    const [isBulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        status: '',
        assigned: '',
        priority: '',
        machine_id: ''
    });

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    // Fetch work orders with filters
    const fetchWorkOrders = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const res = await fetch(`/api/admin/work-order-assignments?${queryParams}`, {
                credentials: "include"
            });
            const body = await res.json();

            if (res.ok) {
                setWorkOrders(body.data || []);
            } else {
                throw new Error(body.message);
            }
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data work order");
        } finally {
            setLoading(false);
        }
    }, [filters, showToast]);

    // Fetch available technicians
    const fetchTechnicians = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/work-order-assignments/technicians", {
                credentials: "include"
            });
            const body = await res.json();

            if (res.ok) {
                setTechnicians(body.data || []);
            }
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data teknisi");
        }
    }, [showToast]);

    // Fetch assignment statistics
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/work-order-assignments/stats", {
                credentials: "include"
            });
            const body = await res.json();

            if (res.ok) {
                setStats(body.data);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    }, []);

    useEffect(() => {
        fetchWorkOrders();
        fetchTechnicians();
        fetchStats();
    }, [fetchWorkOrders, fetchTechnicians, fetchStats]);

    // Handle single assignment
    const handleAssign = (workOrder) => {
        setSelectedWorkOrder(workOrder);
        setAssignDialogOpen(true);
    };

    // Handle reassignment
    const handleReassign = (workOrder) => {
        setSelectedWorkOrder(workOrder);
        setAssignDialogOpen(true);
    };

    // Handle unassign
    const handleUnassign = async (workOrder, reason = '') => {
        try {
            const res = await fetch(`/api/admin/work-order-assignments/${workOrder.id}/unassign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ reason })
            });

            const body = await res.json();
            if (!res.ok) throw new Error(body.message);

            showToast("success", "Berhasil", body.message);
            fetchWorkOrders();
            fetchStats();
        } catch (err) {
            showToast("error", "Error", err.message);
        }
    };

    // Handle bulk assignment
    const handleBulkAssign = () => {
        if (selectedWorkOrders.length === 0) {
            showToast("warn", "Warning", "Pilih work order terlebih dahulu");
            return;
        }
        setBulkAssignDialogOpen(true);
    };

    // Handle filter change
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            status: '',
            assigned: '',
            priority: '',
            machine_id: ''
        });
    };

    const statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
    ];

    const assignedOptions = [
        { label: 'All', value: '' },
        { label: 'Assigned', value: 'true' },
        { label: 'Unassigned', value: 'false' }
    ];

    const priorityOptions = [
        { label: 'All Priority', value: '' },
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' }
    ];

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

            <div className="card">
                <div className="flex justify-content-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-semibold">Work Order Assignment</h3>
                        <p className="text-sm text-gray-500">Manage work order assignments to technicians.</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-nogutter mb-4">
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-2xl font-bold text-blue-500">
                                    {workOrders.filter(wo => !wo.assigned_to_id).length}
                                </div>
                                <div className="text-sm text-gray-600">Unassigned</div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-2xl font-bold text-green-500">
                                    {workOrders.filter(wo => wo.assigned_to_id).length}
                                </div>
                                <div className="text-sm text-gray-600">Assigned</div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-2xl font-bold text-orange-500">
                                    {stats.summary?.total_technicians || 0}
                                </div>
                                <div className="text-sm text-gray-600">Active Technicians</div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-2xl font-bold text-purple-500">
                                    {Math.round(stats.summary?.avg_workload || 0)}
                                </div>
                                <div className="text-sm text-gray-600">Avg Workload</div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="grid grid-nogutter gap-2 mb-4 p-3 border-1 border-gray-300 border-round">
                    <div className="col-12 md:col-3">
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <Dropdown
                            value={filters.status}
                            options={statusOptions}
                            onChange={(e) => handleFilterChange('status', e.value)}
                            placeholder="Select Status"
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-3">
                        <label className="block text-sm font-medium mb-1">Assignment</label>
                        <Dropdown
                            value={filters.assigned}
                            options={assignedOptions}
                            onChange={(e) => handleFilterChange('assigned', e.value)}
                            placeholder="Select Assignment"
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-3">
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <Dropdown
                            value={filters.priority}
                            options={priorityOptions}
                            onChange={(e) => handleFilterChange('priority', e.value)}
                            placeholder="Select Priority"
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-3 flex align-items-end">
                        <Button
                            label="Clear Filters"
                            icon="pi pi-filter-slash"
                            onClick={clearFilters}
                            className="p-button-outlined w-full"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row flex-wrap items-center gap-2 mb-4">
                    <Button
                        size="small"
                        label="Assign Selected"
                        icon="pi pi-users"
                        outlined
                        severity="success"
                        onClick={handleBulkAssign}
                        disabled={selectedWorkOrders.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => {
                            fetchWorkOrders();
                            fetchStats();
                        }}
                        disabled={loading}
                    />
                </div>

                {/* Work Order Table */}
                <WorkOrderAssignmentTable
                    workOrders={workOrders}
                    technicians={technicians}
                    loading={loading}
                    selectedWorkOrders={selectedWorkOrders}
                    onSelectionChange={setSelectedWorkOrders}
                    onAssign={handleAssign}
                    onReassign={handleReassign}
                    onUnassign={handleUnassign}
                />

                {/* Assignment Dialog */}
                <AssignmentDialog
                    visible={isAssignDialogOpen}
                    onHide={() => {
                        setAssignDialogOpen(false);
                        setSelectedWorkOrder(null);
                    }}
                    workOrder={selectedWorkOrder}
                    technicians={technicians}
                    onSuccess={() => {
                        fetchWorkOrders();
                        fetchStats();
                    }}
                    showToast={showToast}
                />

                {/* Bulk Assignment Dialog */}
                <BulkAssignmentDialog
                    visible={isBulkAssignDialogOpen}
                    onHide={() => {
                        setBulkAssignDialogOpen(false);
                        setSelectedWorkOrders([]);
                    }}
                    workOrders={selectedWorkOrders}
                    technicians={technicians}
                    onSuccess={() => {
                        fetchWorkOrders();
                        fetchStats();
                        setSelectedWorkOrders([]);
                    }}
                    showToast={showToast}
                />
            </div>
        </div>
    );
};

export default WorkOrderAssignmentPage;
