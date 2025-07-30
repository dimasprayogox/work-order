"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import TopUsedPartsTable from "./components/TopUsedPartsTable";
import UsageLogTable from "./components/UsageLogTable";
import { Toast } from "primereact/toast";

const PartUsagePage = () => {
    const [topUsedParts, setTopUsedParts] = useState([]);
    const [usageLogs, setUsageLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [topPartsResult, usageLogsResult] = await Promise.all([fetch("/api/logistics/top-used"), fetch("/api/logistics/usage-log")]);

                const topPartsData = await topPartsResult.json();
                const usageLogsData = await usageLogsResult.json();

                if (topPartsData.success) {
                    setTopUsedParts(topPartsData.data || []);
                } else {
                    throw new Error(topPartsData.message || "Failed to fetch top used parts");
                }

                if (usageLogsData.success) {
                    setUsageLogs(usageLogsData.data || []);
                } else {
                    throw new Error(usageLogsData.message || "Failed to fetch usage logs");
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: err.message || "Gagal memuat data"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="p-5 space-y-6">
            <Toast ref={toast} />
            <Card title="Top 10 Part Terpakai">
                <TopUsedPartsTable data={topUsedParts} loading={loading} error={null} />
            </Card>

            <Card title="Log Penggunaan Part" className="mt-6">
                <UsageLogTable data={usageLogs} loading={loading} error={null} />
            </Card>
        </div>
    );
};

export default PartUsagePage;
