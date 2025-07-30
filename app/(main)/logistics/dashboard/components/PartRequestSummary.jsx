"use client";

import RequestsChart from "./charts/RequestsChart";

const PartRequestSummary = ({ data }) => {
    const chartData = {
        pending: data?.pending || 0,
        approved: data?.approved || 0,
        fulfilled: data?.fulfilled || 0,
        rejected: data?.rejected || 0
    };

    return (
        <div className="col-12 md:col-6">
            <div className="card flex flex-column p-4 " style={{ minHeight: "420px", maxHeight: "420px", height: "100%" }}>
                <h5 className="font-bold mb-2 self-start text-center">Requests Overview</h5>
                <RequestsChart data={chartData} />
            </div>
        </div>
    );
};

export default PartRequestSummary;
