/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "primereact/skeleton";

// Ganti dengan URL API Anda
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

// Warna tema
const themeColors = {
    primary: "#3B82F6",
    secondary: "#6366F1",
    danger: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
    info: "#06B6D4"
};

// Komponen untuk kartu statistik dengan animasi lebih kaya
const StatCard = ({ title, value, icon, color }) => (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ y: -5, scale: 1.02 }} className="h-full">
        <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 h-full border-l-4 border-${color}-500`}>
            <div className="flex justify-between items-center">
                <div>
                    <span className="block text-gray-500 font-medium text-sm uppercase tracking-wider">{title}</span>
                    <span className="text-3xl font-bold text-gray-800 mt-2">{value}</span>
                    <div className="mt-3 h-2 w-full bg-gray-200 rounded-full">
                        <motion.div className={`h-full rounded-full bg-${color}-500`} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1, delay: 0.3 }} />
                    </div>
                </div>
                <div className={`flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600 shadow-md`}>
                    <i className={`pi ${icon} text-2xl text-white`}></i>
                </div>
            </div>
        </Card>
    </motion.div>
);

// Template untuk kolom status di tabel dengan desain lebih baik
const statusBodyTemplate = (rowData) => {
    const statusConfig = {
        open: { label: "Pending", color: "red", icon: "pi-clock" },
        in_progress: { label: "In Progress", color: "blue", icon: "pi-spinner pi-spin" },
        resolved: { label: "Completed", color: "green", icon: "pi-check" }
    };

    const config = statusConfig[rowData.status] || { label: rowData.status, color: "gray" };

    return <Tag value={config.label} severity={config.color} icon={config.icon} className="flex items-center gap-2 px-3 py-1 rounded-full" />;
};

const EmployeeDashboard = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, inProgress: 0 });
    const [chartData, setChartData] = useState([]);
    const [trendData, setTrendData] = useState([]);

    const fetchMyIssues = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues/my-issues`, {
                method: "GET",
                credentials: "include"
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Gagal memuat data laporan.");
            }

            const data = Array.isArray(result.data) ? result.data : [];
            setIssues(data);

            // Kalkulasi statistik dari data yang didapat
            const total = data.length;
            const pending = data.filter((i) => i.status === "open").length;
            const resolved = data.filter((i) => i.status === "resolved").length;
            const inProgress = data.filter((i) => i.status === "in_progress").length;
            setStats({ total, pending, resolved, inProgress });

            // Menyiapkan data untuk pie chart
            setChartData([
                { name: "Pending", value: pending, color: themeColors.danger },
                { name: "In Progress", value: inProgress, color: themeColors.primary },
                { name: "Completed", value: resolved, color: themeColors.success }
            ]);

            // Data untuk trend chart (contoh data bulanan)
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
            setTrendData(
                months.map((month) => ({
                    name: month,
                    issues: Math.floor(Math.random() * 10) + 2, // Simulasi data
                    resolved: Math.floor(Math.random() * 8) + 1
                }))
            );
        } catch (error) {
            console.error("Error fetching issues:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyIssues();
    }, [fetchMyIssues]);

    const recentIssues = issues.slice(0, 5); // Ambil 5 data terbaru

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-white shadow-md">
                        <i className="pi pi-user text-2xl text-blue-500"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Dasbor Karyawan</h1>
                        <p className="text-gray-600">Selamat datang! Berikut adalah ringkasan laporan Anda.</p>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="shadow-md h-full">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Skeleton width="120px" height="20px" className="mb-2" />
                                    <Skeleton width="80px" height="30px" className="mb-3" />
                                    <Skeleton width="100%" height="8px" borderRadius="16px" />
                                </div>
                                <Skeleton shape="circle" width="56px" height="56px" />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <>
                    {/* Grid untuk Kartu Statistik */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Laporan" value={stats.total} icon="pi-inbox" color="blue" />
                        <StatCard title="Pending" value={stats.pending} icon="pi-exclamation-circle" color="red" />
                        <StatCard title="In Progress" value={stats.inProgress} icon="pi-spinner" color="info" />
                        <StatCard title="Completed" value={stats.resolved} icon="pi-check-circle" color="green" />
                    </div>

                    {/* Grid untuk Chart dan Tabel */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <motion.div className="lg:col-span-1" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                            <Card title="Status Laporan" className="shadow-lg h-full border-t-4 border-blue-500" headerClassName="border-b-0">
                                {chartData.every((d) => d.value === 0) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8" style={{ minHeight: "300px" }}>
                                        <i className="pi pi-chart-pie text-4xl mb-4 text-gray-300"></i>
                                        <p>Belum ada data untuk ditampilkan</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [`${value} laporan`, "Jumlah"]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex justify-center gap-4 mt-4">
                                            {chartData.map((entry, index) => (
                                                <div key={`legend-${index}`} className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-sm text-gray-600">{entry.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </motion.div>

                        <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                            <Card title="Trend Laporan 6 Bulan Terakhir" className="shadow-lg h-full border-t-4 border-purple-500" headerClassName="border-b-0">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="issues" name="Laporan Dibuat" fill={themeColors.secondary} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="resolved" name="Laporan Selesai" fill={themeColors.success} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}

            {/* Tabel Laporan Terbaru */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
                <Card title="Laporan Terbaru Anda" className="shadow-lg border-t-4 border-green-500" headerClassName="border-b-0">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-200">
                                    <Skeleton width="30%" height="20px" />
                                    <Skeleton width="20%" height="20px" />
                                    <Skeleton width="15%" height="20px" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <DataTable
                            value={recentIssues}
                            emptyMessage={
                                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                    <i className="pi pi-inbox text-4xl mb-4 text-gray-300"></i>
                                    <p>Anda belum membuat laporan</p>
                                </div>
                            }
                            responsiveLayout="scroll"
                            className="p-datatable-sm"
                            rowClassName={() => "hover:bg-gray-50 cursor-pointer"}
                        >
                            <Column
                                field="title"
                                header="Judul"
                                body={(rowData) => (
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${rowData.status === "open" ? "bg-red-500" : rowData.status === "in_progress" ? "bg-blue-500" : "bg-green-500"}`}></div>
                                        <span className="font-semibold">{rowData.title}</span>
                                    </div>
                                )}
                            ></Column>
                            <Column field="machine.name" header="Mesin" body={(rowData) => <Tag value={rowData.machine?.name || "N/A"} severity="info" className="bg-blue-100 text-blue-800" />}></Column>
                            <Column field="createdAt" header="Tanggal" body={(rowData) => new Date(rowData.createdAt).toLocaleDateString()}></Column>
                            <Column field="status" header="Status" body={statusBodyTemplate} align="right"></Column>
                        </DataTable>
                    )}
                    {issues.length > 5 && (
                        <div className="flex justify-end mt-4">
                            <button className="flex items-center gap-2 text-blue-500 hover:text-blue-700 font-medium">
                                Lihat Semua Laporan <i className="pi pi-arrow-right"></i>
                            </button>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default EmployeeDashboard;
