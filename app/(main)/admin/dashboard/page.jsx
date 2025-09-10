"use client";

import { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";
import { Archive, Bell, Clock, Users, Cog, Package, Wrench, Calendar } from "lucide-react";

// Import komponen-komponen baru
import MetricCard from "./components/MetricCard";
import IssueTrendsChart from "./components/IssueTrendsChart";
import WorkOrderStatusChart from "./components/WorkOrderStatusChart";
import UsersDivisionChart from "./components/UsersDivisionChart";
import HighPriorityPendingWOChart from "./components/HighPriorityPendingWOChart";
import ActionItemsList from "./components/ActionItemsList";

const AdminDashboardPage = () => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        keyMetrics: {},
        actionItems: { overdueWorkOrders: [] },
        chartData: { workOrderStatus: [], issueTypeDistribution: [], completedWOLast7Days: [] },
        recentActivities: [],
        users: []
    });

    // --- State untuk data dan opsi grafik ---
    const [trendsChartData, setTrendsChartData] = useState({});
    const [trendsChartOptions, setTrendsChartOptions] = useState({});

    const [donutChartData, setDonutChartData] = useState({});
    const [donutChartOptions, setDonutChartOptions] = useState({});
    const [barChartData, setBarChartData] = useState({});
    const [barChartOptions, setBarChartOptions] = useState({});

    const [userDivisionChartData, setUserDivisionChartData] = useState({});
    const [userDivisionChartOptions, setUserDivisionChartOptions] = useState({});

    const [loadingHighPriorityWO, setLoadingHighPriorityWO] = useState(true);
    const [highPriorityWO, setHighPriorityWO] = useState([]);

    // --- Efek untuk mengambil data dari API (Tidak ada perubahan) ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch("/api/admin/dashboard/overview");
                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.message || "Gagal mengambil data dasbor");
                }
                const result = await response.json();
                if (result.success && result.data) {
                    setDashboardData(result.data);
                } else {
                    throw new Error("Format data dari API tidak valid");
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                toast.current?.show({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
            } finally {
                setLoading(false);
                setPageLoading(false);
                setLoadingHighPriorityWO(false);
            }
        };
        fetchDashboardData();
    }, []);

    // --- Efek untuk memproses dan mengatur data semua grafik ---
    useEffect(() => {
        if (!dashboardData.chartData) return;

        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue("--text-color");
        const textColorSecondary = documentStyle.getPropertyValue("--text-color-secondary");
        const surfaceBorder = documentStyle.getPropertyValue("--surface-border");

        // HAPUS: Konfigurasi untuk grafik "Aktivitas Selesai" dihapus

        // BARU: Konfigurasi untuk Grafik Tren Laporan Bulanan
        const trendsData = dashboardData.chartData.issueTrendsByMonth || [];
        setTrendsChartData({
            labels: trendsData.map((d) => d.month),
            datasets: [
                {
                    label: "Machines Report",
                    data: trendsData.map((d) => d.machine),
                    fill: false,
                    borderColor: documentStyle.getPropertyValue("--blue-500"),
                    tension: 0.4,
                    pointBackgroundColor: documentStyle.getPropertyValue("--blue-500"),
                    pointRadius: 4
                },
                {
                    label: "Assets Report",
                    data: trendsData.map((d) => d.asset),
                    fill: false,
                    borderColor: documentStyle.getPropertyValue("--teal-500"),
                    tension: 0.4,
                    pointBackgroundColor: documentStyle.getPropertyValue("--teal-500"),
                    pointRadius: 4
                }
            ]
        });
        setTrendsChartOptions({
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: { legend: { labels: { color: textColor, usePointStyle: true, padding: 20 } } },
            scales: {
                x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } },
                y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false }, beginAtZero: true }
            }
        });
        // Konfigurasi Grafik Donat (Status Perintah Kerja)
        const woStatus = dashboardData.chartData.workOrderStatus || [];
        setDonutChartData({
            labels: woStatus.map((s) => s.status.charAt(0).toUpperCase() + s.status.slice(1)),
            datasets: [
                {
                    data: woStatus.map((s) => s.count),
                    backgroundColor: [documentStyle.getPropertyValue("--yellow-500"), documentStyle.getPropertyValue("--blue-500"), documentStyle.getPropertyValue("--green-500")],
                    hoverBackgroundColor: [documentStyle.getPropertyValue("--yellow-400"), documentStyle.getPropertyValue("--blue-400"), documentStyle.getPropertyValue("--green-400")],
                    borderWidth: 0
                }
            ]
        });
        setDonutChartOptions({
            cutout: "65%",
            plugins: {
                legend: { position: "bottom", labels: { color: textColor, usePointStyle: true, padding: 15, font: { weight: "500" } } }
            }
        });

        // Konfigurasi Grafik Batang (Tipe Isu)
        const issueTypes = dashboardData.chartData.issueTypeDistribution || [];
        setBarChartData({
            labels: issueTypes.map((t) => t.type.charAt(0).toUpperCase() + t.type.slice(1)),
            datasets: [
                {
                    label: "Jumlah Laporan",
                    data: issueTypes.map((t) => t.count),
                    backgroundColor: [documentStyle.getPropertyValue("--cyan-500"), documentStyle.getPropertyValue("--orange-500")],
                    hoverBackgroundColor: [documentStyle.getPropertyValue("--cyan-400"), documentStyle.getPropertyValue("--orange-400")],
                    borderRadius: 8,
                    maxBarThickness: 40
                }
            ]
        });
        setBarChartOptions({
            maintainAspectRatio: false,
            aspectRatio: 1.5,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: textColorSecondary }, grid: { display: false, drawBorder: false } },
                y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false }, beginAtZero: true }
            }
        });
        const users = dashboardData.users || [];
        const divisionCounts = users.reduce((acc, user) => {
            const divisionName = user.division_name || "Tidak Ditugaskan";
            acc[divisionName] = (acc[divisionName] || 0) + 1;
            return acc;
        }, {});

        setUserDivisionChartData({
            labels: Object.keys(divisionCounts),
            datasets: [
                {
                    label: "Jumlah Pengguna",
                    data: Object.values(divisionCounts),
                    backgroundColor: [documentStyle.getPropertyValue("--purple-500"), documentStyle.getPropertyValue("--pink-500"), documentStyle.getPropertyValue("--indigo-500"), documentStyle.getPropertyValue("--gray-500")],
                    hoverBackgroundColor: [documentStyle.getPropertyValue("--purple-400"), documentStyle.getPropertyValue("--pink-400"), documentStyle.getPropertyValue("--indigo-400"), documentStyle.getPropertyValue("--gray-400")],
                    borderRadius: 8,
                    maxBarThickness: 40
                }
            ]
        });
        setUserDivisionChartOptions({
            maintainAspectRatio: false,
            aspectRatio: 1.5,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: textColorSecondary }, grid: { display: false, drawBorder: false } },
                y: { ticks: { color: textColorSecondary, precision: 0 }, grid: { color: surfaceBorder, drawBorder: false }, beginAtZero: true }
            }
        });
    }, [dashboardData]);

    // Set highPriorityWO setiap kali dashboardData berubah
    useEffect(() => {
        setHighPriorityWO(dashboardData.highPriorityPendingWO || []);
    }, [dashboardData]);

    const { keyMetrics, actionItems } = dashboardData;

    const metricCards = [
        {
            title: "Users",
            value: keyMetrics.allUsers?.value ?? 0,
            icon: <Users className="h-6 w-6 text-orange-500" />,
            color: "orange",
            trendLabel: "total users"
        },
        {
            title: "UnAssigned WO",
            value: keyMetrics.unassignedWorkOrders?.value ?? 0,
            icon: <Clock className="h-6 w-6 text-yellow-500" />,
            color: "yellow",
            trend: keyMetrics.unassignedWorkOrders?.trend ?? "-",
            trendLabel: "compared to yesterday"
        },
        {
            title: "Low Stock Part",
            value: keyMetrics.lowStockParts?.value ?? 0,
            icon: <Archive className="h-6 w-6 text-purple-500" />,
            color: "purple",
            trendLabel: "current low stock"
        },
        {
            title: "In Progress WO",
            value: keyMetrics.inProgressWorkOrders?.value ?? 0,
            icon: <Wrench className="h-6 w-6 text-blue-500" />,
            color: "blue",
            trend: keyMetrics.inProgressWorkOrders?.trend ?? "-",
            trendLabel: "compared to yesterday"
        }
    ];
    return (
        <>
            <div className="card">
                <Toast ref={toast} />
                <div className="grid mb-4">
                    <div className="col">
                        <h2 className="font-semibold">Admin Dashboard</h2>
                        <p className="text-color-secondary mt-0">Welcome back, here&apos;s a summary of today&apos;s activities.</p>{" "}
                    </div>

                    <div className="col-fixed flex align-items-center gap-2 text-right">
                        <Calendar className="text-color-secondary" size={18} />
                        <span className="font-medium text-900">
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                            })}
                        </span>
                    </div>
                </div>

                {pageLoading ? (
                    <Skeleton height="8rem"></Skeleton>
                ) : (
                    <>
                        <div className="grid">
                            <div className="col-12">
                                <div className="grid">
                                    {metricCards.map((metric) => (
                                        <div className="col-12 md:col-6 lg:col-3" key={metric.title}>
                                            <MetricCard loading={loading} {...metric} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid mt-1">
                            <div className="col-12 lg:col-8">
                                <IssueTrendsChart loading={loading} data={trendsChartData} options={trendsChartOptions} />
                            </div>
                            <div className="col-12 lg:col-4">
                                <div className="card border-round-xl surface-0 shadow-2 border-1 border-50 border-round transition-all transition-duration-300 hover:shadow-3" style={{ maxHeight: "380px", overflowY: "auto" }}>
                                    <ActionItemsList loading={loading} items={actionItems.overdueWorkOrders} />
                                </div>
                            </div>

                            <div className="col-12 md:col-6 mt-1 ">
                                <div className=" border-round-xl surface-0 shadow-2 border-1 border-50 border-round transition-all transition-duration-300 hover:shadow-3" style={{ height: "320px" }}>
                                    <WorkOrderStatusChart loading={loading} data={donutChartData} options={donutChartOptions} />
                                </div>
                            </div>
                            <div className="col-12 md:col-6 mt-1">
                                <div className=" border-round-xl surface-0 shadow-2 border-1 border-50 border-round transition-all transition-duration-300 hover:shadow-3" style={{ height: "320px" }}>
                                    <HighPriorityPendingWOChart loading={loadingHighPriorityWO} data={highPriorityWO} />{" "}
                                </div>
                            </div>
                        </div>
                        <div className="grid mt-1">
                            <div className="col-12">
                                <div className="card border-round-xl surface-0 shadow-2 border-1 border-50 border-round transition-all transition-duration-300 hover:shadow-3" style={{ height: "320px" }}>
                                    <UsersDivisionChart loading={loading} data={userDivisionChartData} options={userDivisionChartOptions} />
                                </div>
                            </div>
                        </div>
                        {/* ======================== SELESAI DI SINI ======================== */}
                    </>
                )}
            </div>
        </>
    );
};

export default AdminDashboardPage;