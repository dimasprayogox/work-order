// app/(main)/work-order-assignments/page.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";

import WorkOrderAssignmentTable from "./components/WorkOrderAssignmentTable";
import AssignmentDialog from "./components/AssignmentDialog";
import BulkAssignmentDialog from "./components/BulkAssignmentDialog";
import ExclusionConfirmDialog from "./components/ExclusionConfirmDialog";

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
    const [excludeDialogVisible, setExcludeDialogVisible] = useState(false);
    const [pendingValidSelections, setPendingValidSelections] = useState([]);
    // store richer excluded item info: { label, reason }
    const [excludedItems, setExcludedItems] = useState([]);
    const [excludedCount, setExcludedCount] = useState(0);

    // Filter states
    const [filters, setFilters] = useState({
        status: '',
        assigned: '',
        priority: '',
        type: ''
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
        if (!selectedWorkOrders || selectedWorkOrders.length === 0) {
            showToast("warn", "Warning", "Pilih work order terlebih dahulu");
            return;
        }

        // Keep only work orders that are not completed and are unassigned
        const valid = selectedWorkOrders.filter(wo => {
            const status = wo.status || wo.work_order?.status;
            const assignedId = wo.assigned_to_id ?? wo.work_order?.assigned_to_id ?? wo.assignedTo?.id;
            return status !== 'completed' && !assignedId;
        });

        if (valid.length === 0) {
            showToast("warn", "Warning", "Selected work orders are either completed or already assigned. Tidak ada yang bisa ditugaskan.");
            return;
        }

        if (valid.length < selectedWorkOrders.length) {
            const excluded = selectedWorkOrders.filter(wo => {
                const status = wo.status || wo.work_order?.status;
                const assignedId = wo.assigned_to_id ?? wo.work_order?.assigned_to_id ?? wo.assignedTo?.id;
                return status === 'completed' || !!assignedId;
            });

            setPendingValidSelections(valid);
            setExcludedCount(excluded.length);
            // keep a short preview with reason (completed or assigned)
            setExcludedItems(excluded.slice(0, 5).map(e => {
                const status = e.status || e.work_order?.status;
                const assignedId = e.assigned_to_id ?? e.work_order?.assigned_to_id ?? e.assignedTo?.id;
                return {
                    label: e.title || e.work_order?.title || `WO:${e.id || e.work_order_id}`,
                    reason: status === 'completed' ? 'Completed' : (assignedId ? 'Already assigned' : 'Excluded')
                };
            }));
            setExcludeDialogVisible(true);
            return;
        }

        // Proceed only with eligible (unassigned & not completed) items
        setSelectedWorkOrders(valid);
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
            type: ''
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

    const typeOptions = [
        { label: 'All Types', value: '' },
        { label: 'Machine', value: 'machine' },
        { label: 'Asset', value: 'asset' }
    ];

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

            <div className="card">
                {/* Page Header */}
                <div className="flex justify-content-between align-items-center mb-5"
                     style={{
                         background: '#ffffff',
                         borderRadius: '16px',
                         padding: '24px',
                         border: '1px solid #e5e7eb',
                         boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                     }}>
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-gray-800">Work Order Assignment</h1>
                        <p className="text-lg text-gray-600">Manage work order assignments to technicians efficiently</p>
                    </div>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e2e8f0'
                    }}>
                        <i className="pi pi-users text-3xl text-blue-600"></i>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid mb-5">
                        <div className="col-12 md:col-3 mb-3">
                            <div className="p-4 border-round text-center h-full bg-white"
                                 style={{
                                     boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                     border: '1px solid #e5e7eb',
                                     borderLeft: '4px solid #3b82f6'
                                 }}>
                                <div className="flex align-items-center justify-content-center mb-3">
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: '#eff6ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #dbeafe'
                                    }}>
                                        <i className="pi pi-clock text-2xl text-blue-600"></i>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-800 mb-2">
                                    {workOrders.filter(wo => !wo.assigned_to_id).length}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Unassigned Orders</div>
                            </div>
                        </div>
                        <div className="col-12 md:col-3 mb-3">
                            <div className="p-4 border-round text-center h-full bg-white"
                                 style={{
                                     boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                     border: '1px solid #e5e7eb',
                                     borderLeft: '4px solid #10b981'
                                 }}>
                                <div className="flex align-items-center justify-content-center mb-3">
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: '#ecfdf5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #d1fae5'
                                    }}>
                                        <i className="pi pi-check-circle text-2xl text-green-600"></i>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-800 mb-2">
                                    {workOrders.filter(wo => wo.assigned_to_id).length}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Assigned Orders</div>
                            </div>
                        </div>
                        <div className="col-12 md:col-3 mb-3">
                            <div className="p-4 border-round text-center h-full bg-white"
                                 style={{
                                     boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                     border: '1px solid #e5e7eb',
                                     borderLeft: '4px solid #f59e0b'
                                 }}>
                                <div className="flex align-items-center justify-content-center mb-3">
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: '#fffbeb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #fed7aa'
                                    }}>
                                        <i className="pi pi-user text-2xl text-amber-600"></i>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-800 mb-2">
                                    {stats.summary?.total_technicians || 0}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Active Technicians</div>
                            </div>
                        </div>
                        <div className="col-12 md:col-3 mb-3">
                            <div className="p-4 border-round text-center h-full bg-white"
                                 style={{
                                     boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                     border: '1px solid #e5e7eb',
                                     borderLeft: '4px solid #8b5cf6'
                                 }}>
                                <div className="flex align-items-center justify-content-center mb-3">
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: '#faf5ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #e9d5ff'
                                    }}>
                                        <i className="pi pi-chart-bar text-2xl text-violet-600"></i>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-800 mb-2">
                                    {Math.round(stats.summary?.avg_workload || 0)}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Avg Workload</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters Section */}
                <div className="mb-4">
                    <div className="p-3 border-round bg-white"
                         style={{
                             border: '1px solid #e5e7eb',
                             boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                         }}>
                        <div className="flex align-items-center justify-content-between">
                            <div className="flex align-items-center">
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: '#f8fafc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <i className="pi pi-filter text-gray-600 text-sm"></i>
                                </div>
                                <span className="font-semibold text-gray-700">Filters</span>
                            </div>

                            <div className="flex align-items-center gap-2 flex-1 justify-content-center">
                                <div style={{ width: '160px' }}>
                                    <Dropdown
                                        value={filters.status}
                                        options={statusOptions}
                                        onChange={(e) => handleFilterChange('status', e.value)}
                                        placeholder="Status"
                                        className="w-full p-inputtext-sm"
                                        style={{ borderRadius: '6px', fontSize: '13px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ width: '160px' }}>
                                    <Dropdown
                                        value={filters.assigned}
                                        options={assignedOptions}
                                        onChange={(e) => handleFilterChange('assigned', e.value)}
                                        placeholder="Assignment"
                                        className="w-full p-inputtext-sm"
                                        style={{ borderRadius: '6px', fontSize: '13px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ width: '160px' }}>
                                    <Dropdown
                                        value={filters.priority}
                                        options={priorityOptions}
                                        onChange={(e) => handleFilterChange('priority', e.value)}
                                        placeholder="Priority"
                                        className="w-full p-inputtext-sm"
                                        style={{ borderRadius: '6px', fontSize: '13px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ width: '160px' }}>
                                    <Dropdown
                                        value={filters.type}
                                        options={typeOptions}
                                        onChange={(e) => handleFilterChange('type', e.value)}
                                        placeholder="Type"
                                        className="w-full p-inputtext-sm"
                                        style={{ borderRadius: '6px', fontSize: '13px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                            </div>

                            <Button
                                icon="pi pi-times"
                                onClick={clearFilters}
                                className="p-button-text p-button-sm"
                                tooltip="Clear All Filters"
                                style={{
                                    borderRadius: '6px',
                                    color: '#6b7280',
                                    padding: '4px 8px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-5 p-4 border-round bg-white"
                     style={{
                         border: '1px solid #e5e7eb',
                         boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                     }}>
                    <div className="flex align-items-center gap-3">
                        <Button
                            label="Assign Selected"
                            icon="pi pi-users"
                            severity="success"
                            onClick={handleBulkAssign}
                            disabled={selectedWorkOrders.length === 0}
                            style={{
                                borderRadius: '10px',
                                padding: '12px 24px',
                                fontWeight: '600',
                                boxShadow: selectedWorkOrders.length > 0 ? '0 4px 12px rgba(34, 197, 94, 0.2)' : 'none',
                                background: selectedWorkOrders.length > 0 ? '#22c55e' : '#94a3b8',
                                border: 'none'
                            }}
                        />
                        {selectedWorkOrders.length > 0 && (
                            <div className="px-3 py-2 border-round" style={{
                                background: '#f0fdf4',
                                color: '#166534',
                                border: '1px solid #bbf7d0'
                            }}>
                                <i className="pi pi-check-circle mr-2"></i>
                                <span className="font-semibold">{selectedWorkOrders.length} selected</span>
                            </div>
                        )}
                    </div>

                    <Button
                        label="Refresh Data"
                        icon="pi pi-refresh"
                        className="p-button-outlined"
                        onClick={() => {
                            fetchWorkOrders();
                            fetchStats();
                        }}
                        disabled={loading}
                        style={{
                            borderRadius: '10px',
                            padding: '12px 20px',
                            fontWeight: '600',
                            border: '2px solid #d1d5db',
                            color: '#374151',
                            background: '#ffffff'
                        }}
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

                {/* Exclusion Confirmation Dialog */}
                <ExclusionConfirmDialog
                    visible={excludeDialogVisible}
                    onHide={() => setExcludeDialogVisible(false)}
                    excludedItems={excludedItems}
                    excludedCount={excludedCount}
                    onContinue={() => {
                        setSelectedWorkOrders(pendingValidSelections);
                        setExcludeDialogVisible(false);
                        setBulkAssignDialogOpen(true);
                    }}
                />
            </div>
        </div>
    );
};

export default WorkOrderAssignmentPage;
