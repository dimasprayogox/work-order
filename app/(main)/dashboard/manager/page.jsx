/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Panel } from "primereact/panel";
import { Knob } from "primereact/knob";
import { ProgressBar } from "primereact/progressbar"; // ProgressBar tidak digunakan, dipertahankan jika ada rencana
import { Chart } from 'primereact/chart';
import { DataTable } from "primereact/datatable"; // DataTable tidak digunakan, dipertahankan jika ada rencana
import { Column } from "primereact/column"; // Column tidak digunakan, dipertahankan jika ada rencana
import { Tag } from "primereact/tag"; // Tag tidak digunakan, dipertahankan jika ada rencana

const ManagerDashboardPage = () => { // Nama komponen diubah
    const [onTimeCompletionRate, setOnTimeCompletionRate] = useState(0);
    const [overdueWorkOrders, setOverdueWorkOrders] = useState(0);
    const [closedWorkOrders, setClosedWorkOrders] = useState(0);
    const [workRequests, setWorkRequests] = useState(0);
    const [mttr, setMttr] = useState("0H");
    const [mtbf, setMtbf] = useState("0H");
    const [maintenanceExpenses, setMaintenanceExpenses] = useState(0);
    const [plannedMaintenancePercentage, setPlannedMaintenancePercentage] = useState(0);
    const [offlineAssets, setOfflineAssets] = useState(0);
    const [lowStockItemsCount, setLowStockItemsCount] = useState(0);
    const [pendingPurchaseOrders, setPendingPurchaseOrders] = useState(0);

    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});

    useEffect(() => {
        // Simulasi pengambilan data
        const fetchData = setTimeout(() => {
            setOnTimeCompletionRate(85); // 85%
            setOverdueWorkOrders(8);
            setClosedWorkOrders(120);
            setWorkRequests(15);
            setMttr("4.2H");
            setMtbf("150H");
            setMaintenanceExpenses(5750.25);
            setPlannedMaintenancePercentage(70); // 70%
            setOfflineAssets(3);
            setLowStockItemsCount(25);
            setPendingPurchaseOrders(2);

            // Data untuk grafik
            const documentStyle = getComputedStyle(document.documentElement);
            const textColor = documentStyle.getPropertyValue('--text-color');
            const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
            const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

            const data = {
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
            };
            const options = {
                maintainAspectRatio: false,
                aspectRatio: 0.6,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            color: surfaceBorder
                        }
                    },
                    y: {
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            color: surfaceBorder
                        }
                    }
                }
            };
            setChartData(data);
            setChartOptions(options);

        }, 3000);

        return () => clearTimeout(fetchData);
    }, []);

    return (
        <>
            <div className="card">
                <h2 className="font-semibold">Dashboard Manajer</h2>
                <div className="grid">
                    {/* Baris Pertama: KPI Utama */}
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">WO ON-TIME COMPLETION RATE</h6>
                                <p>Semua Aset</p>
                            </div>
                            <Knob value={onTimeCompletionRate} valueTemplate={"{value}%"} readOnly size={100} />
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">WO OVERDUE</h6>
                                <p>Semua Aset</p>
                            </div>
                            <h3 className="text-red-500">{overdueWorkOrders}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">WO DITUTUP</h6>
                                <p>Bulan Ini</p>
                            </div>
                            <h3>{closedWorkOrders}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">PERMINTAAN KERJA BARU</h6>
                                <p>Menunggu</p>
                            </div>
                            <h3 className="text-yellow-500">{workRequests}</h3>
                        </div>
                    </div>

                    {/* Baris Kedua: Metrik Teknis & Keuangan */}
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">MTTR (FROM WORK ORDER)</h6>
                                <p>Semua Aset</p>
                            </div>
                            <h3>{mttr}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">MTBF (FROM AVAILABILITY TRACKER)</h6>
                                <p>Semua Aset</p>
                            </div>
                            <h3>{mtbf}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">BIAYA PEMELIHARAAN</h6>
                                <p>Bulan Ini</p>
                            </div>
                            <h3>${maintenanceExpenses.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">PERSENTASE PEMELIHARAAN TERENCANA</h6>
                                <p>Semua Aset</p>
                            </div>
                            <h3>{plannedMaintenancePercentage}%</h3>
                        </div>
                    </div>

                    {/* Baris Ketiga: Status Operasional & Logistik */}
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">ASET OFFLINE SAAT INI</h6>
                                <p>Semua Aset</p>
                            </div>
                            <h3 className="text-red-500">{offlineAssets}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">ITEM STOK RENDAH</h6>
                                <p>Semua Gudang</p>
                            </div>
                            <h3 className="text-orange-500">{lowStockItemsCount}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">PO MENUNGGU PERSETUJUAN</h6>
                                <p>Pembelian</p>
                            </div>
                            <h3 className="text-yellow-500">{pendingPurchaseOrders}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">TOTAL BIAYA INVENTARIS</h6>
                                <p>Semua Aset</p>
                            </div>
                            <h3>$800.00</h3> {/* Contoh nilai, perlu dihubungkan ke state */}
                        </div>
                    </div>

                    {/* Grafik */}
                    <div className="col-12">
                        <Panel header="TREN BIAYA & WORK ORDER">
                            <Chart type="line" data={chartData} options={chartOptions} className="h-20rem" />
                        </Panel>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ManagerDashboardPage;