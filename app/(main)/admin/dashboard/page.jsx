// app/(main)/admin/dashboard/page.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";

// Charts
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

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
    const [providedKeys, setProvidedKeys] = useState([]);

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

                if (result && result.data) {
                    setDashboardData(result.data);
                    setProvidedKeys(Object.keys(result.data));
                } else if (result && result.success && result.data) {
                    // fallback (keeps compatibility)
                    setDashboardData(result.data);
                    setProvidedKeys(Object.keys(result.data));
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

    // Top 4 cards only
    const topCards = [
        { id: 'totalWorkOrders', title: 'Total Work Orders', value: dashboardData.totalWorkOrders, icon: 'pi pi-briefcase', colorClass: 'bg-blue-100 text-blue-500' },
        { id: 'closedWorkOrders', title: 'Closed Work Orders', value: dashboardData.closedWorkOrders, icon: 'pi pi-check', colorClass: 'bg-green-100 text-green-500' },
        { id: 'overdueWorkOrders', title: 'Overdue Work Orders', value: dashboardData.overdueWorkOrders, icon: 'pi pi-clock', colorClass: 'bg-red-100 text-red-500' },
        { id: 'completionRate', title: 'Completion Rate', value: `${completionRate}%`, icon: 'pi pi-chart-line', colorClass: 'bg-purple-100 text-purple-500' }
    ];

    const secondaryCards = [
        { id: 'openIssues', title: 'Open Issues', value: dashboardData.openIssues, icon: 'pi pi-exclamation-triangle', colorClass: 'bg-orange-100 text-orange-500' },
        { id: 'inProgressIssues', title: 'In Progress', value: dashboardData.inProgressIssues, icon: 'pi pi-spinner', colorClass: 'bg-indigo-100 text-indigo-500' },
        { id: 'resolvedIssues', title: 'Resolved Issues', value: dashboardData.resolvedIssues, icon: 'pi pi-check-circle', colorClass: 'bg-cyan-100 text-cyan-500' },
        { id: 'totalMachines', title: 'Total Machines', value: dashboardData.totalMachines, icon: 'pi pi-cog', colorClass: 'bg-amber-100 text-amber-500' },
        { id: 'offlineMachines', title: 'Offline Machines', value: dashboardData.offlineMachines, icon: 'pi pi-power-off', colorClass: 'bg-gray-100 text-gray-700' },
        { id: 'lowStockParts', title: 'Low Stock Parts', value: dashboardData.lowStockParts, icon: 'pi pi-box', colorClass: 'bg-yellow-100 text-yellow-600' },
        { id: 'mttr', title: 'MTTR', value: dashboardData.mttr || 'N/A', icon: 'pi pi-clock', colorClass: 'bg-teal-100 text-teal-500' },
        { id: 'maintenanceExpenses', title: 'Maintenance Expenses', value: `$${dashboardData.maintenanceExpenses}`, icon: 'pi pi-dollar', colorClass: 'bg-green-50 text-green-700' },
    ];

    // Chart data (only use if backend returned required fields)
    const workOrderChartData = {
        labels: ['Closed', 'Overdue', 'Other Open'],
        datasets: [
            {
                data: [
                    dashboardData.closedWorkOrders || 0,
                    dashboardData.overdueWorkOrders || 0,
                    Math.max((dashboardData.totalWorkOrders || 0) - (dashboardData.closedWorkOrders || 0) - (dashboardData.overdueWorkOrders || 0), 0)
                ],
                backgroundColor: ['#34d399', '#f87171', '#60a5fa'],
                hoverBackgroundColor: ['#10b981', '#ef4444', '#3b82f6']
            }
        ]
    };

    const issuesChartData = {
        labels: ['Open', 'In Progress', 'Resolved'],
        datasets: [
            {
                data: [dashboardData.openIssues || 0, dashboardData.inProgressIssues || 0, dashboardData.resolvedIssues || 0],
                backgroundColor: ['#fb923c', '#7c3aed', '#06b6d4'],
                hoverBackgroundColor: ['#f97316', '#6d28d9', '#0891b2']
            }
        ]
    };

    return (
        <>
            <Toast ref={toast} position="top-right" />

            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h2 className="font-semibold">Admin Dashboard</h2>
                    </div>
                </div>

                {/* Top 4 cards */}
                {topCards
                    .filter(card => providedKeys.length === 0 ? true : providedKeys.includes(card.id) || card.id === 'completionRate')
                    .map(card => (
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
                            </Card>
                        </div>
                    ))}

                {/* Charts area */}
                <div className="col-12 lg:col-6 mt-2">
                    <Card className="p-3 shadow-2">
                        <div className="text-500 text-sm">Work Orders</div>
                        <div className="text-900 font-bold text-xl mt-1 mb-3">Distribusi Work Orders</div>
                        {loading ? <Skeleton height="260px" /> : <Doughnut data={workOrderChartData} />}
                    </Card>
                </div>

                <div className="col-12 lg:col-6 mt-2">
                    <Card className="p-3 shadow-2">
                        <div className="text-500 text-sm">Issues</div>
                        <div className="text-900 font-bold text-xl mt-1 mb-3">Tren Issues</div>
                        {loading ? <Skeleton height="260px" /> : <Bar data={{ labels: issuesChartData.labels, datasets: issuesChartData.datasets }} />}
                    </Card>
                </div>

                {/* Optional line chart: only if backend provides `history` array */}
                {(!loading && dashboardData.history && Array.isArray(dashboardData.history) && dashboardData.history.length > 0) && (
                    <div className="col-12 mt-2">
                        <Card className="p-3 shadow-2">
                            <div className="text-500 text-sm">Activity History</div>
                            <div className="text-900 font-bold text-xl mt-1 mb-3">Tren Waktu</div>
                            <Line data={{
                                labels: dashboardData.history.map(h => h.label),
                                datasets: [{
                                    label: 'Work Orders',
                                    data: dashboardData.history.map(h => h.workOrders || 0),
                                    borderColor: '#3b82f6',
                                    backgroundColor: 'rgba(59,130,246,0.2)'
                                }]
                            }} />
                        </Card>
                    </div>
                )}

                {/* Secondary metric cards: show only when backend provides keys */}
                {secondaryCards
                    .filter(card => providedKeys.length === 0 ? true : providedKeys.includes(card.id))
                    .map(card => (
                        <div key={card.id} className="col-12 md:col-6 lg:col-3 mt-2">
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
                            </Card>
                        </div>
                    ))}
            </div>
        </>
    );
};

export default AdminDashboard;
