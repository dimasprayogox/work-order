"use client";

import React, { useEffect, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import TopUsedPartsTable from "./components/TopUsedPartsTable";
import UsageLogTable from "./components/UsageLogTable";
import { API_ENDPOINTS } from "../../../api/api";

const PartUsagePage = () => {
    const [topUsedParts, setTopUsedParts] = useState([]);
    const [usageLogs, setUsageLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const topRes = await fetch(API_ENDPOINTS.TOP_USED_PARTS, { credentials: "include" });
            const topData = await topRes.json();

            const logRes = await fetch(API_ENDPOINTS.USAGE_LOG, { credentials: "include" });
            const logData = await logRes.json();

            setTopUsedParts(topData.data || []);
            setUsageLogs(logData.data || []);
        } catch (err) {
            console.error("Gagal mengambil data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="p-5 space-y-6">
            <Card title="Top 10 Part Terpakai">
                <TopUsedPartsTable data={topUsedParts} loading={loading} />
            </Card>

            <Card title="Log Penggunaan Part">
                <UsageLogTable data={usageLogs} loading={loading} />
            </Card>
        </div>
    );
};

export default PartUsagePage;
