"use client";

import { useEffect, useState } from "react";
import { getLogisticsDashboard } from "../../../api/logistics/dashboard/routes";
import { ProgressSpinner } from "primereact/progressspinner";
import PartSummary from "./components/PartSummary";
import PartRequestSummary from "./components/PartRequestSummary";
import TopUsedParts from "./components/TopUsedParts";
import RecentRequests from "./components/RecentRequests";

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
        return (
            <div className="flex justify-center items-center h-64">
                <ProgressSpinner />
                <span className="ml-2">Loading dashboard...</span>
            </div>
        );
    }

    if (!data) {
        return <div className="flex justify-center items-center h-64 text-red-500">Failed to load dashboard data</div>;
    }

    return (
        <div className="card">
            <h2 className="font-semibold text-2xl mb-4">Dashboard</h2>

            <div className="grid">
                <PartSummary title="TOTAL PARTS" value={data.part_summary.total_parts} icon="total" color="total" />
                <PartSummary title="LOW STOCK" value={data.part_summary.low_stock} icon="low" color="low" />
                <PartSummary title="OUT OF STOCK" value={data.part_summary.out_of_stock || 0} icon="out" color="out" />
                <PartSummary title="CRITICAL PARTS" value={data.part_summary.critical_parts || 0} icon="critical" color="critical" />
            </div>
            <div className="grid mt-4">
                <PartRequestSummary data={data.part_requests} />
                <RecentRequests data={data.recent_requests} />
            </div>

            <div className="grid mt-2">
                <TopUsedParts data={data.top_used_parts} />
            </div>
        </div>
    );
};

export default LogisticsDashboardPage;