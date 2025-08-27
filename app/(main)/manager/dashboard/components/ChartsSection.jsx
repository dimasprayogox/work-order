import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const ChartsSection = ({ overviewData, getStatusStyle, machines, assets }) => {
   const assetStatusDistribution = useMemo(() => {
       const statusCount = {};

       assets.forEach((asset) => {
           const status = asset.status || "unknown";
           statusCount[status] = (statusCount[status] || 0) + 1;
       });

       return Object.entries(statusCount)
           .map(([status, count]) => {
               const config = getStatusStyle(status);
               return { name: config.label, value: count, color: config.color };
           })
           .filter((item) => item.value > 0);
   }, [assets, getStatusStyle]);

    // Calculate machine status distribution from machines data
    const machineStatusDistribution = useMemo(() => {
        const statusCount = {};

        machines.forEach((machine) => {
            const status = machine.status || "unknown";
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        return Object.entries(statusCount)
            .map(([status, count]) => {
                const config = getStatusStyle(status);
                return { name: config.label, value: count, color: config.color };
            })
            .filter((item) => item.value > 0);
    }, [machines, getStatusStyle]);

   

    const ChartContainer = ({ title, data, icon }) => (
        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "400px", flexDirection: "column", padding: "2rem" }}>
            <h5 className="font-bold mb-4 self-start">{title}</h5>
            {data.length > 0 ? (
                <div style={{ width: "100%", height: "350px" }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex flex-column align-items-center justify-content-center w-full h-full text-gray-500">
                    <i className={icon} style={{ fontSize: "3rem" }}></i>
                    <p className="mt-2">Tidak ada data untuk grafik.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="grid mt-4">
            <div className="col-12 md:col-6">
                <ChartContainer title="Assets Status" data={assetStatusDistribution} icon="pi pi-chart-pie" />
            </div>
            <div className="col-12 md:col-6">
                <ChartContainer title="Machines Status" data={machineStatusDistribution} icon="pi pi-cog" />
            </div>
        </div>
    );

};

export default ChartsSection;
