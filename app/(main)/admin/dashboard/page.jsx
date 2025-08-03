// app/(main)/admin/dashboard/page.jsx
"use client";

import { Knob } from "primereact/knob";
import { useEffect, useState } from "react";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { useRef } from "react";

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
        mtbf: '7.9H',
        maintenanceExpenses: 100.76
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
                    const errorResult = await response.json();
                    throw new Error(`HTTP error! status: ${response.status}. Detail: ${errorResult.message || 'Failed to fetch dashboard data'}`);
                }

                const result = await response.json();

                if (result.success && result.data) {
                    setDashboardData(result.data);
                } else {
                    throw new Error('Invalid data format from API');
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showToast('error', 'Error', 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Calculate work order completion rate
    const completionRate = dashboardData.totalWorkOrders > 0
        ? Math.round((dashboardData.closedWorkOrders / dashboardData.totalWorkOrders) * 100)
        : 0;

    // Calculate overdue rate
    const overdueRate = dashboardData.totalWorkOrders > 0
        ? Math.round((dashboardData.overdueWorkOrders / dashboardData.totalWorkOrders) * 100)
        : 0;

    return (
        <>
            <Toast ref={toast} position="top-right" />
            <div className="card">
                <h2 className="font-semibold">Admin Dashboard</h2>
                <div className="grid">
                    {/* Large Work Order Completion Rate */}
                    <div className="col-12 md:col-6">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "575px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h4 className="font-bold">WORK ORDER ON-TIME COMPLETION RATE</h4>
                                <p>All Assets & All Groups</p>
                            </div>
                            {loading ? (
                                <Skeleton shape="circle" size="250px" />
                            ) : (
                                <Knob value={completionRate} valueTemplate={"{value}%"} readOnly size={250} />
                            )}
                        </div>
                    </div>

                    {/* Right side metrics */}
                    <div className="col-12 md:col-6">
                        <div className="grid">
                            {/* Overdue Work Orders */}
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">OVERDUE WORK ORDERS</h6>
                                        <p>All Assets & All Groups</p>
                                    </div>
                                    {loading ? (
                                        <Skeleton height="100px" />
                                    ) : (
                                        <Knob
                                            value={dashboardData.overdueWorkOrders}
                                            max={dashboardData.totalWorkOrders || 100}
                                            valueTemplate={`{value} of ${dashboardData.totalWorkOrders}`}
                                            readOnly
                                            strokeWidth={8}
                                            valueColor="#ef4444"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Closed Work Orders */}
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">CLOSED WORK ORDERS</h6>
                                        <p>All Assets & All Groups</p>
                                    </div>
                                    {loading ? (
                                        <Skeleton height="4rem" />
                                    ) : (
                                        <h3>{dashboardData.closedWorkOrders}</h3>
                                    )}
                                </div>
                            </div>

                            {/* Work Requests (Open Issues) */}
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">OPEN WORK REQUESTS</h6>
                                        <p>All Assets & All Groups</p>
                                    </div>
                                    {loading ? (
                                        <Skeleton height="4rem" />
                                    ) : (
                                        <h3 className="text-yellow-500">{dashboardData.openIssues}</h3>
                                    )}
                                </div>
                            </div>

                            {/* MTTR */}
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">MTTR (FROM WORK ORDER)</h6>
                                        <p>All Assets</p>
                                    </div>
                                    {loading ? (
                                        <Skeleton height="4rem" />
                                    ) : (
                                        <h3>{dashboardData.mttr || 'N/A'}</h3>
                                    )}
                                </div>
                            </div>

                            {/* Current Offline Assets */}
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">CURRENT OFFLINE ASSETS</h6>
                                        <p>All Assets</p>
                                    </div>
                                    {loading ? (
                                        <Skeleton height="4rem" />
                                    ) : (
                                        <h3>{dashboardData.offlineMachines}</h3>
                                    )}
                                </div>
                            </div>

                            {/* Low Stock Items */}
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">LOW STOCK ITEMS</h6>
                                        <p>All Assets</p>
                                    </div>
                                    {loading ? (
                                        <Skeleton height="4rem" />
                                    ) : (
                                        <h3 className="text-yellow-500">{dashboardData.lowStockParts}</h3>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom row metrics */}
                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">MTBF (FROM AVAILABILITY TRACKER)</h6>
                                <p>All Assets</p>
                            </div>
                            {loading ? (
                                <Skeleton height="4rem" />
                            ) : (
                                <h3>{dashboardData.mtbf}</h3>
                            )}
                        </div>
                    </div>

                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">MAINTENANCE EXPENSES</h6>
                                <p>All Assets</p>
                            </div>
                            {loading ? (
                                <Skeleton height="4rem" />
                            ) : (
                                <h3>${dashboardData.maintenanceExpenses}</h3>
                            )}
                        </div>
                    </div>

                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">TOTAL WORK ORDERS</h6>
                                <p>All Assets</p>
                            </div>
                            {loading ? (
                                <Skeleton height="4rem" />
                            ) : (
                                <h3>{dashboardData.totalWorkOrders}</h3>
                            )}
                        </div>
                    </div>

                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">IN PROGRESS ISSUES</h6>
                                <p>All Assets</p>
                            </div>
                            {loading ? (
                                <Skeleton height="4rem" />
                            ) : (
                                <h3 className="text-blue-500">{dashboardData.inProgressIssues}</h3>
                            )}
                        </div>
                    </div>

                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">TOTAL MACHINES</h6>
                                <p>All Assets</p>
                            </div>
                            {loading ? (
                                <Skeleton height="4rem" />
                            ) : (
                                <h3>{dashboardData.totalMachines}</h3>
                            )}
                        </div>
                    </div>

                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">RESOLVED ISSUES</h6>
                                <p>All Assets</p>
                            </div>
                            {loading ? (
                                <Skeleton height="4rem" />
                            ) : (
                                <h3 className="text-green-500">{dashboardData.resolvedIssues}</h3>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
