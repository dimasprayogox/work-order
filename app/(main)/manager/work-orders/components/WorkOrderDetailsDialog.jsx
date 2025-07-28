"use client";

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';

const dateBodyTemplate = (rowData, field) => {
    return rowData[field] ? new Date(rowData[field]).toLocaleString("id-ID") : "N/A";
};

const WorkOrderDetailsDialog = ({ visible, onHide, workOrder }) => {
    if (!workOrder) {
        return (
            <Dialog
                header="Work Order Details"
                visible={visible}
                style={{ width: "50vw" }}
                onHide={onHide}
                modal
            >
                <p>No work order selected.</p>
            </Dialog>
        );
    }

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

    const formattedStatus = workOrder.status
        ? workOrder.status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
        : "";

    return (
        <Dialog
            header="Work Order Details"
            visible={visible}
            style={{ width: "50vw" }}
            onHide={onHide}
            modal
        >
            <div className="p-fluid">
                <div className="p-field grid">
                    <label htmlFor="title" className="col-fixed" style={{ width: '120px' }}>Title:</label>
                    <div className="col">{workOrder.title}</div>
                </div>
                <div className="p-field grid">
                    <label htmlFor="description" className="col-fixed" style={{ width: '120px' }}>Description:</label>
                    <div className="col">{workOrder.description}</div>
                </div>
                <div className="p-field grid">
                    <label htmlFor="machine" className="col-fixed" style={{ width: '120px' }}>Machine:</label>
                    <div className="col">{workOrder.machine?.name || 'N/A'}</div>
                </div>
                <div className="p-field grid">
                    <label htmlFor="priority" className="col-fixed" style={{ width: '120px' }}>Priority:</label>
                    <div className="col">{workOrder.priority}</div>
                </div>
                <div className="p-field grid">
                    <label htmlFor="status" className="col-fixed" style={{ width: '120px' }}>Status:</label>
                    <div className="col">
                        <Tag
                            value={formattedStatus}
                            severity={getStatusSeverity(workOrder.status)}
                            className="font-medium"
                        />
                    </div>
                </div>
                <div className="p-field grid">
                    <label htmlFor="assignedTo" className="col-fixed" style={{ width: '120px' }}>Assigned To:</label>
                    <div className="col">{workOrder.assignedTo?.name || 'Not Assigned'}</div>
                </div>
                <div className="p-field grid">
                    <label htmlFor="scheduledDate" className="col-fixed" style={{ width: '120px' }}>Scheduled Date:</label>
                    <div className="col">{dateBodyTemplate(workOrder, "scheduled_date")}</div>
                </div>
                <div className="p-field grid">
                    <label htmlFor="createdAt" className="col-fixed" style={{ width: '120px' }}>Created At:</label>
                    <div className="col">{dateBodyTemplate(workOrder, "created_at")}</div>
                </div>
            </div>

            {workOrder.attachments && workOrder.attachments.length > 0 && (
                <div className="mt-4">
                    <h4>Attached Photos:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {workOrder.attachments.map((attachment, index) => (
                            <div key={index} className="col-span-1">
                                {attachment.url && /\.(jpeg|jpg|png|gif)$/i.test(attachment.url) ? (
                                    <img
                                        src={attachment.url}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-auto object-cover rounded-md shadow-sm"
                                        style={{ maxHeight: '150px' }}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Attachment {index + 1}: <a href={attachment.url} target="_blank" rel="noopener noreferrer">View File</a>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {workOrder.attachments && workOrder.attachments.length === 0 && (
                <p className="mt-4 text-gray-500">No photos attached.</p>
            )}
            {!workOrder.attachments && (
                <p className="mt-4 text-gray-500">No attachment information available.</p>
            )}
        </Dialog>
    );
};

export default WorkOrderDetailsDialog;