/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Panel } from "primereact/panel";
import { Knob } from "primereact/knob";
import { Chart } from 'primereact/chart';
import { Card } from 'primereact/card';
// ProgressBar, DataTable, Column, Tag tidak digunakan di sini, bisa dihapus jika tidak diperlukan
// import { ProgressBar } from "primereact/progressbar"; 
// import { DataTable } from "primereact/datatable"; 
// import { Column } from "primereact/column"; 
// import { Tag } from "primereact/tag"; 

const ManagerDashboardPage = () => {
    // --- STATE ---
    const [dashboardData, setDashboardData] = useState(null); // Data gabungan dari berbagai API
    const [loading, setLoading] = useState(true);

    // State untuk KPI spesifik (akan diisi dari data backend)
    const [onTimeCompletionRate, setOnTimeCompletionRate] = useState(0); // Dari backend KPI
    const [overdueWorkOrdersCount, setOverdueWorkOrdersCount] = useState(0); // Dari overview
    const [closedWorkOrdersCount, setClosedWorkOrdersCount] = useState(0); // Dari overview
    const [newWorkRequestsCount, setNewWorkRequestsCount] = useState(0); // Dari overview / IssueController
    const [mttr, setMttr] = useState("N/A"); // Dari backend KPI
    const [mtbf, setMtbf] = useState("N/A"); // Dari backend KPI
    const [maintenanceExpenses, setMaintenanceExpenses] = useState(0); // Dari backend KPI / Grafik
    const [plannedMaintenancePercentage, setPlannedMaintenancePercentage] = useState(0); // Dari backend KPI
    const [offlineAssets, setOfflineAssets] = useState(0); // Dari overview
    const [lowStockItemsCount, setLowStockItemsCount] = useState(0); // Dari backend KPI
    const [pendingPurchaseOrders, setPendingPurchaseOrders] = useState(0); // Dari backend KPI
    const [totalInventoryValue, setTotalInventoryValue] = useState(0); // Dari backend KPI

    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});

    const API_BASE_URL = "http://localhost:3100/api";

    // Fungsi untuk mendapatkan warna severity dari status
    const getStatusSeverity = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'idle': return 'info';
            case 'maintenance': return 'warn';
            case 'broken': return 'danger';
            case 'open': return 'danger';
            case 'in_progress': return 'info';
            case 'completed': return 'success';
            case 'pending': return 'warning';
            default: return null;
        }
    };

    // --- FETCH DATA DARI BACKEND ---
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch data overview umum dari DashboardController.overview
            const overviewResponse = await fetch(`${API_BASE_URL}/manager/dashboard/overview`, {
                method: "GET",
                credentials: "include",
            });
            const overviewResult = await overviewResponse.json();

            if (!overviewResponse.ok) {
                console.error("Failed to fetch overview data:", overviewResult.message);
                throw new Error(overviewResult.message || "Gagal memuat data overview.");
            }
            setDashboardData(overviewResult.data); // Simpan semua data overview

            // Perbarui state dari data overview
            setOverdueWorkOrdersCount(overviewResult.data.overdueCount || 0);

            // Hitung Closed Work Orders dari workOrderStatus
            const closedWoStatus = overviewResult.data.workOrderStatus.find(s => s.status === 'completed');
            setClosedWorkOrdersCount(closedWoStatus ? closedWoStatus.count : 0);

            // Hitung New Work Requests (status 'open' atau 'pending' dari WorkOrderController.index)
            const openWoStatus = overviewResult.data.workOrderStatus.find(s => s.status === 'open');
            const pendingWoStatus = overviewResult.data.workOrderStatus.find(s => s.status === 'pending');
            setNewWorkRequestsCount((openWoStatus ? openWoStatus.count : 0) + (pendingWoStatus ? pendingWoStatus.count : 0));

            // Hitung Offline Assets dari machineStatus
            const offlineMachineStatus = overviewResult.data.machineStatus.find(s => s.status === 'broken' || s.status === 'maintenance');
            setOfflineAssets(offlineMachineStatus ? offlineMachineStatus.count : 0);

            // --- 2. Fetch data dari KPI Gabungan (Jika Anda membuat endpoint ini di backend) ---
            // Contoh endpoint: GET /api/manager/dashboard/kpi_metrics
            // Anda perlu mengimplementasikan endpoint ini di backend
            /*
            const kpiResponse = await fetch(`${API_BASE_URL}/manager/dashboard/kpi_metrics`, {
                method: "GET",
                credentials: "include",
            });
            const kpiResult = await kpiResponse.json();
            if (!kpiResponse.ok) {
                console.error("Failed to fetch KPI metrics:", kpiResult.message);
                // Lanjutkan dengan nilai default jika gagal
            } else {
                setOnTimeCompletionRate(kpiResult.data.onTimeRate || 0);
                setMttr(kpiResult.data.mttr || "N/A");
                setMtbf(kpiResult.data.mtbf || "N/A");
                setMaintenanceExpenses(kpiResult.data.expenses || 0);
                setPlannedMaintenancePercentage(kpiResult.data.plannedPercentage || 0);
                setLowStockItemsCount(kpiResult.data.lowStock || 0);
                setPendingPurchaseOrders(kpiResult.data.pendingPO || 0);
                setTotalInventoryValue(kpiResult.data.inventoryValue || 0);
            }
            */

            // --- 3. Fetch data untuk Grafik (Jika Anda membuat endpoint ini di backend) ---
            // Contoh endpoint: GET /api/manager/dashboard/monthly_trends
            /*
            const chartResponse = await fetch(`${API_BASE_URL}/manager/dashboard/monthly_trends`, {
                method: "GET",
                credentials: "include",
            });
            const chartResult = await chartResponse.json();
            if (!chartResponse.ok) {
                console.error("Failed to fetch chart data:", chartResult.message);
                // Lanjutkan dengan data simulasi/default jika gagal
            } else {
                const documentStyle = getComputedStyle(document.documentElement);
                const textColor = documentStyle.getPropertyValue('--text-color');
                const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
                const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

                setChartData({
                    labels: chartResult.data.labels,
                    datasets: chartResult.data.datasets.map(ds => ({
                        ...ds,
                        borderColor: documentStyle.getPropertyValue(ds.colorVar), // Asumsi colorVar di backend
                        tension: 0.4,
                        fill: false
                    }))
                });
                setChartOptions({
                    maintainAspectRatio: false,
                    aspectRatio: 0.6,
                    plugins: {
                        legend: { labels: { color: textColor } }
                    },
                    scales: {
                        x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } },
                        y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } }
                    }
                });
            }
            */

            // --- Untuk sementara, jika belum ada endpoint, isi dengan nilai default atau simulasi ---
            // Ini akan dihapus setelah endpoint backend di atas diimplementasikan
            setOnTimeCompletionRate(85);
            setMttr("4.2H");
            setMtbf("150H");
            setMaintenanceExpenses(5750.25);
            setPlannedMaintenancePercentage(70);
            setLowStockItemsCount(25);
            setPendingPurchaseOrders(2);
            setTotalInventoryValue(800.00);

            // Data grafik simulasi
            const documentStyle = getComputedStyle(document.documentElement);
            const textColor = documentStyle.getPropertyValue('--text-color');
            const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
            const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

            setChartData({
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                datasets: [
                    {
                        label: 'Biaya Pemeliharaan',
                        data: [650, 590, 800, 810, 560, 1000],
                        fill: false,
                        borderColor: documentStyle.getPropertyValue('--blue-500'),
                        tension: 0.4
                    },
                    {
                        label: 'Work Order Ditutup',
                        data: [28, 48, 40, 19, 86, 27],
                        fill: false,
                        borderColor: documentStyle.getPropertyValue('--green-500'),
                        tension: 0.4
                    }
                ]
            });
            setChartOptions({
                maintainAspectRatio: false,
                aspectRatio: 0.6,
                plugins: {
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } },
                    y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder } }
                }
            });


        } catch (error) {
            console.error("Final Error fetching manager dashboard data:", error);
            // Anda bisa menampilkan toast/pesan error di sini jika ada error
            // Misalnya: toast.current.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat dashboard manager.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);


    // --- JSX (Tampilan Dashboard) ---
    return (
        <>
            <div className="card">
                <h2 className="font-semibold">Dashboard Manajer</h2>
                {loading ? (
                    <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                        <span className="ml-2">Memuat data dashboard...</span>
                    </div>
                ) : (
                    <div className="grid">
                        {/* Baris Pertama: KPI Utama */}
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">WO ON-TIME COMPLETION RATE</h6>
                                    <p>Semua Aset</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <Knob value={onTimeCompletionRate} valueTemplate={"{value}%"} readOnly size={100} />
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">WO OVERDUE</h6>
                                    <p>Semua Aset</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3 className="text-red-500">{overdueWorkOrdersCount}</h3>
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">WO DITUTUP</h6>
                                    <p>Bulan Ini</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3>{closedWorkOrdersCount}</h3>
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">PERMINTAAN KERJA BARU</h6>
                                    <p>Menunggu</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3 className="text-yellow-500">{newWorkRequestsCount}</h3>
                                </div>
                            </Card>
                        </div>

                        {/* Baris Kedua: Metrik Teknis & Keuangan */}
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">MTTR (FROM WORK ORDER)</h6>
                                    <p>Semua Aset</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3>{mttr}</h3>
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">MTBF (FROM AVAILABILITY TRACKER)</h6>
                                    <p>Semua Aset</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3>{mtbf}</h3>
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">BIAYA PEMELIHARAAN</h6>
                                    <p>Bulan Ini</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3>${maintenanceExpenses.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</h3>
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">PERSENTASE PEMELIHARAAN TERENCANA</h6>
                                    <p>Semua Aset</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3>{plannedMaintenancePercentage}%</h3>
                                </div>
                            </Card>
                        </div>

                        {/* Baris Ketiga: Status Operasional & Logistik */}
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">ASET OFFLINE SAAT INI</h6>
                                    <p>Semua Aset</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3 className="text-red-500">{offlineAssets}</h3>
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">ITEM STOK RENDAH</h6>
                                    <p>Semua Gudang</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3 className="text-orange-500">{lowStockItemsCount}</h3>
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">PO MENUNGGU PERSETUJUAN</h6>
                                    <p>Pembelian</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3 className="text-yellow-500">{pendingPurchaseOrders}</h3>
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Card className="surface-0 shadow-2 p-3 border-round">
                                <div className="text-center mb-3">
                                    <h6 className="font-bold">TOTAL BIAYA INVENTARIS</h6>
                                    <p>Semua Aset</p>
                                </div>
                                <div className="flex align-items-center justify-content-center">
                                    <h3>${totalInventoryValue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</h3>
                                </div>
                            </Card>
                        </div>

                        {/* Grafik */}
                        <div className="col-12">
                            <Panel header="TREN BIAYA & WORK ORDER">
                                <Chart type="line" data={chartData} options={chartOptions} className="h-20rem" />
                            </Panel>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ManagerDashboardPage;