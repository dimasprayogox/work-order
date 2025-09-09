"use client";

import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";
import { Divider } from "primereact/divider";
import { Avatar } from "primereact/avatar";
import { useState, useEffect, useCallback } from "react";

const IssueDetailDialog = ({ visible, onHide, issue }) => {
    const [reportedByUser, setReportedByUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);

    // Fetch user data when issue changes
    const fetchReportedByUser = useCallback(async () => {
        if (!issue?.reported_by_id) return;
        setLoadingUser(true);
        try {
            // NOTE: Fetching all users to find one is inefficient.
            // Ideally, you'd have an endpoint like /api/users/{id}
            const res = await fetch("/api/admin/issues/users", {
                credentials: "include"
            });
            const data = await res.json();
            if (res.ok) {
                const users = data.data || [];
                const user = users.find((u) => u.id === issue.reported_by_id);
                setReportedByUser(user);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setLoadingUser(false);
        }
    }, [issue?.reported_by_id]);

    useEffect(() => {
        // Fetch only if user data isn't already included in the 'issue' object
        if (issue && issue.reported_by_id && !issue.reportedBy) {
            fetchReportedByUser();
        }
    }, [issue, fetchReportedByUser]);

    // Return null if no issue is provided to prevent errors
    if (!issue) return null;

    const getStatusConfig = (status) => {
        const statusMap = {
            open: { label: "Pending", bgColor: "bg-yellow-100", textColor: "text-yellow-800", icon: "pi-clock" },
            in_progress: { label: "In Progress", bgColor: "bg-cyan-100", textColor: "text-cyan-800", icon: "pi-spin pi-spinner" },
            resolved: { label: "Resolved", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" },
            closed: { label: "Closed", bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi-times-circle" }
        };
        return statusMap[status] || { label: status, bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi-question" };
    };

    const getPriorityConfig = (priority) => {
        const priorityMap = {
            high: { label: "High", color: "bg-red-100 text-red-800 border-red-300", icon: "pi-exclamation-triangle" },
            medium: { label: "Medium", color: "bg-orange-100 text-orange-800 border-orange-300", icon: "pi-info-circle" },
            low: { label: "Low", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "pi-arrow-down" }
        };
        return priorityMap[priority] || { label: priority || "Medium", color: "bg-gray-100 text-gray-800 border-gray-300", icon: "pi-question" };
    };

    const getReportedByName = () => {
        if (issue.reportedBy?.full_name) return issue.reportedBy.full_name;
        if (reportedByUser?.full_name) return reportedByUser.full_name;
        if (loadingUser) return "Loading...";
        return "Unknown User";
    };

    const getReportedByEmail = () => {
        if (issue.reportedBy?.email) return issue.reportedBy.email;
        if (reportedByUser?.email) return reportedByUser.email;
        return null;
    };

    const statusConfig = getStatusConfig(issue.status);
    const priorityConfig = getPriorityConfig(issue.workOrder?.priority || "medium");

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-info-circle text-primary"></i>
                    <span className="font-semibold text-xl">Issue Details</span>
                </div>
            }
            visible={visible}
            style={{ width: "min(90vw, 700px)" }}
            modal
            onHide={onHide}
            className="modern-dialog"
        >
            <div className="p-fluid">
                {/* Header Section */}
                <div className="grid mb-4">
                    <div className="col-8">
                        <h3 className="font-bold text-2xl mb-2 text-900">{issue.title}</h3>
                        <p className="text-900 leading-6 m-0">{issue.description || "No description provided"}</p>
                    </div>
                    <div className="col-4 flex justify-content-end gap-2">
                        <div className={`flex align-items-center gap-2 px-3 py-2 rounded-lg ${statusConfig.bgColor} ${statusConfig.textColor} border-1 border-200`}>
                            <i className={`pi ${statusConfig.icon}`}></i>
                            <span className="font-semibold">{statusConfig.label}</span>
                        </div>
                        <div className={`flex align-items-center gap-2 px-3 py-2 rounded-lg ${priorityConfig.color} border-1`}>
                            <i className={`pi ${priorityConfig.icon}`}></i>
                            <span className="font-semibold">{priorityConfig.label}</span>
                        </div>
                    </div>
                </div>

                <Divider className="my-4" />

                {/* Equipment and Reported By - Equal Height Cards */}
                <div className="grid mb-6">
                    {/* Equipment Card */}
                    <div className="col-12 md:col-6">
                        <div className="flex align-items-center gap-2 mb-3">
                            <i className="pi pi-cog text-primary"></i>
                            <h5 className="font-semibold text-lg m-0 text-700">Equipment</h5>
                        </div>
                        <div className="p-3 border-round-lg border-1 border-200 bg-surface-50 h-full">
                            {issue.machine?.name ? (
                                <div className="flex align-items-center gap-3">
                                    <Avatar icon="pi pi-desktop" className="bg-blue-100 text-blue-800" size="large" />
                                    <div>
                                        <p className="font-semibold text-900 m-0">{issue.machine.name}</p>
                                        <p className="text-sm text-600 m-0">Machine • {issue.machine.machine_code || "No Code"}</p>
                                    </div>
                                </div>
                            ) : issue.asset?.name ? (
                                <div className="flex align-items-center gap-3">
                                    <Avatar icon="pi pi-box" className="bg-green-100 text-green-800" size="large" />
                                    <div>
                                        <p className="font-semibold text-900 m-0">{issue.asset.name}</p>
                                        <p className="text-sm text-600 m-0">Asset • {issue.asset.asset_code || "No Code"}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex align-items-center gap-3">
                                    <Avatar icon="pi pi-question" className="bg-gray-100 text-gray-600" size="large" />
                                    <span className="text-600">No equipment assigned</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reported By Card */}
                    <div className="col-12 md:col-6">
                        <div className="flex align-items-center gap-2 mb-3">
                            <i className="pi pi-user text-primary"></i>
                            <h5 className="font-semibold text-lg m-0 text-700">Reported By</h5>
                        </div>
                        <div className="p-3 border-round-lg border-1 border-200 bg-surface-50 h-full">
                            <div className="flex align-items-center gap-3">
                                <Avatar icon="pi pi-user" className="bg-primary-100 text-primary-800" size="large" shape="circle" />
                                <div>
                                    <p className="font-semibold text-900 m-0">{getReportedByName()}</p>
                                    {getReportedByEmail() && <p className="text-sm text-600 m-0">{getReportedByEmail()}</p>}
                                    <p className="text-xs text-500 mt-1">Reported on {issue.created_at ? new Date(issue.created_at).toLocaleString() : "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technician Note Section */}
                {issue.workOrder?.notes && (
                    <div className="mb-4 mt-2">
                        <div className="flex align-items-center gap-2 mb-3">
                            <i className="pi pi-comment text-primary"></i>
                            <h5 className="font-semibold text-lg m-0 text-700">Technician Notes</h5>
                        </div>
                        <div className="p-3 bg-blue-50 border-round-lg border-left-3 border-blue-500">
                            <p className="text-900 m-0" style={{ whiteSpace: "pre-line" }}>
                                <i className="pi pi-quote-left text-blue-500 mr-2"></i>
                                {issue.workOrder.notes}
                            </p>
                        </div>
                    </div>
                )}

                {/* Photo Section */}
                {issue.photo_url && (
                    <>
                        <Divider className="my-4" />
                        <div className="mb-4">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-image text-primary"></i>
                                <h5 className="font-semibold text-lg m-0 text-700">Attached Photo</h5>
                            </div>
                            <div className="text-center">
                                <Image
                                    src={issue.photo_url}
                                    alt="Issue Photo"
                                    width="300"
                                    height="200"
                                    preview
                                    className="border-round shadow-2"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/300x200/cccccc/000000?text=Image+Not+Found";
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    );
};

export default IssueDetailDialog;
