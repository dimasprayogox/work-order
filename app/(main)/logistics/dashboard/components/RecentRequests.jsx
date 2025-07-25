"use client";

import { Card, DataTable, Column } from "primereact";
import StatusBadge from "./StatusBadge";

const RecentRequests = ({ data }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Card title="Recent Requests" className="col-10 md:col-6 shadow-md">
            <DataTable value={data} paginator rows={5}>
                <Column field="part_name" header="Part Name" />
                <Column field="quantity" header="Quantity" />
                <Column field="date" header="Date" body={(row) => formatDate(row.date)} />
                <Column field="status" header="Status" body={(row) => <StatusBadge status={row.status} />} />
            </DataTable>
        </Card>
    );
};

export default RecentRequests;
