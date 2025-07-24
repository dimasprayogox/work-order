"use client";

import { useEffect, useState } from "react";
import { getLogisticsDashboard } from "@/app/api/logistics/dashboard/routes";
import PartSummary from "./components/PartSummary";
import PartRequestSummary from "./components/PartRequestSummary";
import TopUsedParts from "./components/TopUsedParts";
import { ProgressSpinner } from "primereact/progressspinner";

const LogisticsDashboardPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dashboardData = await getLogisticsDashboard();
                setData(dashboardData);
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><ProgressSpinner /></div>;
    }

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold mb-4">Logistics Dashboard</h2>
            <PartSummary data={data.part_summary} />
            <PartRequestSummary data={data.part_requests} />
            <TopUsedParts data={data.top_used_parts} />
        </div>
    );
};

export default LogisticsDashboardPage;
