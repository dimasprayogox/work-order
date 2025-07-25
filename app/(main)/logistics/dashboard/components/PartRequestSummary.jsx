"use client";

import { Card } from "primereact/card";
import RequestsChart from "./charts/RequestsChart";

const PartRequestSummary = ({ data }) => {
    return (
        <Card title="Requests Overview" className="col-10 md:col-6 ">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-4 ">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <h4 className="text-sm font-medium text-yellow-800">Pending</h4>
                    <p className="text-2xl font-bold text-yellow-600">{data?.pending || 0}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-medium text-blue-800">Approved</h4>
                    <p className="text-2xl font-bold text-blue-600">{data?.approved || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h4 className="text-sm font-medium text-green-800">Fulfilled</h4>
                    <p className="text-2xl font-bold text-green-600">{data?.completed || 0}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h4 className="text-sm font-medium text-red-800">Rejected</h4>
                    <p className="text-2xl font-bold text-red-600">{data?.rejected || 0}</p>
                </div>
            </div>
            <div className="" style={{ height: "250px" }}>
                <RequestsChart data={data} />
            </div>
        </Card>
    );
};

export default PartRequestSummary;
