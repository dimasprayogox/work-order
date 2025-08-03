// app/(main)/issues/components/IssueDetailDialog.jsx
"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";
import { Divider } from "primereact/divider";
import { useState, useEffect, useCallback } from "react";

const IssueDetailDialog = ({ visible, onHide, issue }) => {
    const [reportedByUser, setReportedByUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);

    // Fetch user data when issue changes
    const fetchReportedByUser = useCallback(async () => {
        setLoadingUser(true);
        try {
            const res = await fetch("/api/admin/issues/users", {
                credentials: "include"
            });
            const data = await res.json();
            if (res.ok) {
                const users = data.data || [];
                const user = users.find(u => u.id === issue.reported_by_id);
                setReportedByUser(user);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoadingUser(false);
        }
    }, [issue?.reported_by_id]);

    useEffect(() => {
        if (issue && issue.reported_by_id && !issue.reported_by?.full_name) {
            fetchReportedByUser();
        }
    }, [issue, fetchReportedByUser]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusDetails = (status) => {
        switch (status) {
            case "open":
                return {
                    bgColor: "bg-orange-100",
                    textColor: "text-orange-800",
                    icon: "pi pi-clock",
                    label: "Pending"
                };
            case "in_progress":
                return {
                    bgColor: "bg-cyan-100",
                    textColor: "text-cyan-800",
                    icon: "pi pi-spin pi-spinner",
                    label: "In Progress"
                };
            case "resolved":
                return {
                    bgColor: "bg-green-100",
                    textColor: "text-green-800",
                    icon: "pi pi-check-circle",
                    label: "Resolved"
                };
            case "closed":
                return {
                    bgColor: "bg-gray-200",
                    textColor: "text-gray-800",
                    icon: "pi pi-lock",
                    label: "Closed"
                };
            default:
                return {
                    bgColor: "bg-gray-100",
                    textColor: "text-gray-800",
                    icon: "pi pi-question",
                    label: status
                };
        }
    };

    const getReportedByName = () => {
        if (issue?.reported_by?.full_name) {
            return issue.reported_by.full_name;
        }
        if (reportedByUser?.full_name) {
            return reportedByUser.full_name;
        }
        if (loadingUser) {
            return "Loading...";
        }
        return "Unknown User";
    };

    // Return null after all hooks
    if (!issue) return null;

    const statusDetails = getStatusDetails(issue.status);

    const footerContent = (
        <div className="flex justify-content-end">
            <Button
                label="Close"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
            />
        </div>
    );

    return (
        <Dialog
            header="Issue Details"
            visible={visible}
            style={{ width: "50rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            footer={footerContent}
        >
            <div className="grid">
                {/* Left Column */}
                <div className="col-12 md:col-8">
                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Title</label>
                        <p className="text-lg font-medium">{issue.title}</p>
                    </div>

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Description</label>
                        <p className="line-height-3 text-gray-700">{issue.description}</p>
                    </div>

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Machine</label>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-cog text-blue-500"></i>
                            <span className="font-medium">{issue.machine?.name || 'N/A'}</span>
                            {issue.machine?.machine_code && (
                                <Tag value={issue.machine.machine_code} className="p-tag-secondary" />
                            )}
                        </div>
                        {issue.machine?.location && (
                            <div className="flex align-items-center gap-2 mt-1">
                                <i className="pi pi-map-marker text-gray-500"></i>
                                <span className="text-gray-600">{issue.machine.location}</span>
                            </div>
                        )}
                    </div>

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Status</label>
                        <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusDetails.bgColor} ${statusDetails.textColor}`}
                            style={{ width: "fit-content", minWidth: "120px" }}
                        >
                            <i className={`pi ${statusDetails.icon}`}></i>
                            <span className="font-medium">{statusDetails.label}</span>
                        </div>
                    </div>

                    {issue.workOrder && (
                        <>
                            <Divider />
                            <div className="field mb-4">
                                <label className="font-semibold text-gray-800 block mb-2">
                                    <i className="pi pi-wrench mr-2"></i>
                                    Related Work Order
                                </label>
                                <div className="p-3 border-1 border-gray-300 border-round bg-gray-50">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <span className="font-medium">{issue.workOrder.title}</span>
                                        <Tag
                                            value={issue.workOrder.status}
                                            severity={issue.workOrder.status === 'completed' ? 'success' : 'info'}
                                        />
                                    </div>
                                    {issue.workOrder.description && (
                                        <p className="text-gray-600 text-sm">{issue.workOrder.description}</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column */}
                <div className="col-12 md:col-4">
                    {issue.photo_url && (
                        <div className="field mb-4">
                            <label className="font-semibold text-gray-800 block mb-2">Photo</label>
                            <Image
                                src={issue.photo_url}
                                alt="Issue Photo"
                                width="100%"
                                preview
                                className="border-round shadow-2"
                            />
                        </div>
                    )}

                    <div className="field mb-3">
                        <label className="font-semibold text-gray-800 block mb-2">Issue ID</label>
                        <div className="p-2 bg-gray-100 border-round">
                            <code className="text-sm text-gray-700">{issue.id}</code>
                        </div>
                    </div>

                    <div className="field mb-3">
                        <label className="font-semibold text-gray-800 block mb-2">Created</label>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar text-gray-500"></i>
                            <span className="text-sm text-gray-700">{formatDate(issue.created_at)}</span>
                        </div>
                    </div>

                    {issue.updated_at && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Last Updated</label>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-clock text-gray-500"></i>
                                <span className="text-sm text-gray-700">{formatDate(issue.updated_at)}</span>
                            </div>
                        </div>
                    )}

                    {(issue.reported_by_id || issue.reported_by) && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Reported By</label>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-user text-gray-500"></i>
                                <span className="text-sm text-gray-700">
                                    {getReportedByName()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default IssueDetailDialog;
