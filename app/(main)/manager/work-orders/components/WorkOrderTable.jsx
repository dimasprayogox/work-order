import React from 'react';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';

export const statusBodyTemplate = (rowData) => {
    const getStatusSeverity = (status) => {
        switch (status) {
            case "pending": return "warning";
            case "assigned": return "success";
            case "in_progress": return "primary";
            case "completed": return "success";
            case "rejected": return "danger";
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
        />
    );
};

export const dateBodyTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleString("id-ID") : "N/A";
};

export const technicianBodyTemplate = (rowData) => {
    if (!rowData.assignedTo || !rowData.assignedTo.name) {
        return "Not Assigned";
    }

    let icon = null;
    let tooltipText = rowData.assignedTo.name;

    switch (rowData.status) {
        case "assigned":
            icon = <i className="pi pi-check-circle text-green-500 mr-2" data-pr-tooltip="Assigned" />;
            tooltipText = `${rowData.assignedTo.name} (Assigned)`;
            break;
        case "in_progress":
            icon = <i className="pi pi-spin pi-cog text-blue-500 mr-2" data-pr-tooltip="In Progress" />;
            tooltipText = `${rowData.assignedTo.name} (In Progress)`;
            break;
        case "completed":
            icon = <i className="pi pi-check-square text-green-700 mr-2" data-pr-tooltip="Completed" />;
            tooltipText = `${rowData.assignedTo.name} (Completed)`;
            break;
        default:
            break;
    }

    return (
        <div className="flex align-items-center">
            <Tooltip target=".pi" />
            {icon}
            <span>{rowData.assignedTo.name}</span>
        </div>
    );
};