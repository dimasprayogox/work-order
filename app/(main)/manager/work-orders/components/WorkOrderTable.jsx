import React from 'react';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { ProgressSpinner } from 'primereact/progressspinner';

export const statusBodyTemplate = (rowData) => {
    const getStatusSeverity = (status) => {
        switch (status) {
            case "pending": return "warning";
            case "assigned": return "info";
            case "in_progress": return "primary";
            case "completed": return "success";
            case "rejected": return "danger";
            default: return null;
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case "in_progress":
                return <ProgressSpinner style={{ width: '1rem', height: '1rem' }} strokeWidth="8" animationDuration=".5s" />;
            default: return null;
        }
    };

    const formattedStatus = rowData.status
        ? rowData.status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
        : "";

    return (
        <Tag
            value={formattedStatus}
            severity={getStatusSeverity(rowData.status)}
            className="font-medium"
            icon={getStatusIcon(rowData.status)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }} 
        />
    );
};

export const dateBodyTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleString("id-ID", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }) : "N/A";
};

export const technicianBodyTemplate = (rowData) => {
    if (!rowData.assigned_to || !rowData.assigned_to.name) {
        return "Not Assigned";
    }

    let icon = null;

    switch (rowData.status) {
        case "assigned":
            icon = <i className="pi pi-check-circle text-green-500 mr-2" />;
            break;
        case "in_progress":
            icon = <i className="pi pi-spin pi-cog text-blue-500 mr-2" />;
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
            <span>{rowData.assigned_to.name}</span>
        </div>
    );
};