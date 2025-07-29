import React from 'react';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';

export const statusBodyTemplate = (rowData) => {
    const statusMap = {
        pending: { label: "Pending", severity: "danger" },
        in_progress: { label: "In Progress", severity: "info" },
        completed: { label: "Completed", severity: "success" },
    };
    const statusInfo = statusMap[rowData.status] || { label: rowData.status, severity: "warning" };
    return <Tag value={statusInfo.label} severity={statusInfo.severity} />;
};

export const dateBodyTemplate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("id-ID", {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const technicianBodyTemplate = (rowData) => {
    if (!rowData.assignedTo || !rowData.assignedTo.full_name) {
        return "Belum Ditugaskan";
    }

    let icon = null;

    switch (rowData.status) {
        case "in_progress":
            icon = <i className="pi pi-cog pi-spin text-blue-500 mr-2" />;
            break;
        case "completed":
            icon = <i className="pi pi-check-square text-green-700 mr-2" />;
            break;
        default:
            break;
    }

    return (
        <div className="flex align-items-center">
            {icon}
            <span>{rowData.assignedTo.full_name}</span>
        </div>
    );
};