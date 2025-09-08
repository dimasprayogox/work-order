// app/(main)/admin/dashboard/page.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";

const AdminDashboard = () => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        totalWorkOrders: 0,
        overdueWorkOrders: 0,
        closedWorkOrders: 0,
        totalIssues: 0,
        openIssues: 0,
        inProgressIssues: 0,
        resolvedIssues: 0,
        totalMachines: 0,
        offlineMachines: 0,
        lowStockParts: 0,
        mttr: null,
        mtbf: 'N/A',
        maintenanceExpenses: 0
    });

    const showToast = (severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/admin/dashboard/overview', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorResult = await response.json().catch(() => ({}));
                    throw new Error(`HTTP error! status: ${response.status}. Detail: ${errorResult.message || 'Failed to fetch dashboard data'}`);
                }

                const result = await response.json();

                if (result && result.success && result.data) {
                    setDashboardData(result.data);
                } else if (result && result.data) {
                    // Some endpoints may return data directly
                    setDashboardData(result.data);
                } else {
                    throw new Error('Invalid data format from API');
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showToast('error', 'Error', 'Gagal memuat data dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Derived metrics
    const completionRate = dashboardData.totalWorkOrders > 0
        ? Math.round((dashboardData.closedWorkOrders / dashboardData.totalWorkOrders) * 100)
        : 0;

    const overdueRate = dashboardData.totalWorkOrders > 0
        ? Math.round((dashboardData.overdueWorkOrders / dashboardData.totalWorkOrders) * 100)
        : 0;

    const metricCards = [
        { id: 'totalWorkOrders', title: 'Total Work Orders', value: dashboardData.totalWorkOrders, icon: 'pi pi-briefcase', colorClass: 'bg-blue-100 text-blue-500' },
        { id: 'closedWorkOrders', title: 'Closed Work Orders', value: dashboardData.closedWorkOrders, icon: 'pi pi-check', colorClass: 'bg-green-100 text-green-500' },
        { id: 'overdueWorkOrders', title: 'Overdue Work Orders', value: dashboardData.overdueWorkOrders, icon: 'pi pi-clock', colorClass: 'bg-red-100 text-red-500' },
        { id: 'completionRate', title: 'Completion Rate', value: `${completionRate}%`, icon: 'pi pi-chart-line', colorClass: 'bg-purple-100 text-purple-500' },
        { id: 'openIssues', title: 'Open Issues', value: dashboardData.openIssues, icon: 'pi pi-exclamation-triangle', colorClass: 'bg-orange-100 text-orange-500' },
        { id: 'inProgressIssues', title: 'In Progress', value: dashboardData.inProgressIssues, icon: 'pi pi-spinner', colorClass: 'bg-indigo-100 text-indigo-500' },
        { id: 'resolvedIssues', title: 'Resolved Issues', value: dashboardData.resolvedIssues, icon: 'pi pi-check-circle', colorClass: 'bg-cyan-100 text-cyan-500' },
        { id: 'totalMachines', title: 'Total Machines', value: dashboardData.totalMachines, icon: 'pi pi-cog', colorClass: 'bg-amber-100 text-amber-500' },
        { id: 'offlineMachines', title: 'Offline Machines', value: dashboardData.offlineMachines, icon: 'pi pi-power-off', colorClass: 'bg-gray-100 text-gray-700' },
        { id: 'lowStockParts', title: 'Low Stock Parts', value: dashboardData.lowStockParts, icon: 'pi pi-box', colorClass: 'bg-yellow-100 text-yellow-600' },
        { id: 'mttr', title: 'MTTR', value: dashboardData.mttr || 'N/A', icon: 'pi pi-clock', colorClass: 'bg-teal-100 text-teal-500' },
        { id: 'maintenanceExpenses', title: 'Maintenance Expenses', value: `$${dashboardData.maintenanceExpenses}`, icon: 'pi pi-dollar', colorClass: 'bg-green-50 text-green-700' },
    ];

    return (
        <>
            <Toast ref={toast} position="top-right" />

            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h2 className="font-semibold">Admin Dashboard</h2>
                        <p className="text-500">Ringkasan metrik utama sistem.</p>
                    </div>
                </div>

                {metricCards.map((card) => (
                    <div key={card.id} className="col-12 md:col-6 lg:col-3">
                        <Card className="p-3 shadow-2">
                            <div className="flex align-items-center justify-content-between mb-3">
                                <div>
                                    <div className="text-500 text-sm">{card.title}</div>
                                    <div className="text-900 font-bold text-2xl mt-1">
                                        {loading ? <Skeleton width="6rem" height="2rem" /> : card.value}
                                    </div>
                                </div>
                                <div className={`flex align-items-center justify-content-center ${card.colorClass} border-round`} style={{ width: 48, height: 48 }}>
                                    <i className={`${card.icon} text-lg`} />
                                </div>
                            </div>
                            <div className="text-500 text-sm">{card.id === 'completionRate' ? `Overdue ${overdueRate}%` : 'All Assets'}</div>
                        </Card>
                    </div>
                ))}
            </div>
        </>
    );
};

export default AdminDashboard;
