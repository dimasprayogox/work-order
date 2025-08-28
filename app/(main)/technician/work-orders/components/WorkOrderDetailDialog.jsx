"use client";

import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag"; // Note: Tag is not used in the final template, but kept for context if needed.
import { Image } from "primereact/image";
import { Avatar } from "primereact/avatar";

// The component is now named WorkOrderDetailDialog based on the provided template
export default function WorkOrderDetailDialog({ visible, onHide, workOrder, photoSrc }) {
    if (!workOrder) return null;

    // Helper function to get configuration for work order status
    const getStatusConfig = (status) => {
        const statusMap = {
            open: { label: "Pending", bgColor: "bg-yellow-100", textColor: "text-yellow-800", icon: "pi-clock" },
            in_progress: { label: "In Progress", bgColor: "bg-cyan-100", textColor: "text-cyan-800", icon: "pi-spin pi-spinner" },
            // Assuming 'completed' from old code maps to 'resolved'
            completed: { label: "Resolved", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" },
            resolved: { label: "Resolved", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" },
            closed: { label: "Closed", bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi-times-circle" }
        };
        return statusMap[status] || { label: status, bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi-question" };
    };

    // Helper function to get configuration for work order priority
    const getPriorityConfig = (priority) => {
        const priorityMap = {
            high: { label: "High", color: "bg-red-100 text-red-800 border-red-300", icon: "pi-exclamation-triangle" },
            medium: { label: "Medium", color: "bg-orange-100 text-orange-800 border-orange-300", icon: "pi-info-circle" },
            low: { label: "Low", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "pi-arrow-down" }
        };
        return priorityMap[priority] || { label: priority || "Medium", color: "bg-gray-100 text-gray-800 border-gray-300", icon: "pi-question" };
    };

    const statusConfig = getStatusConfig(workOrder.status);
    const priorityConfig = getPriorityConfig(workOrder.priority);

    // Use photo_url from workOrder object, but fall back to photoSrc prop for compatibility
    const finalPhotoSrc = workOrder.photo_url || photoSrc;

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-ticket text-primary"></i>
                    <span className="font-semibold text-xl">Work Order Details</span>
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
                        <h3 className="font-bold text-2xl mb-2 text-900">{workOrder.title}</h3>
                        <p className="text-900 leading-6 m-0">{workOrder.description || "No description provided."}</p>
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
                            {workOrder.machine ? (
                                <div className="flex align-items-center gap-3">
                                    <Avatar icon="pi pi-desktop" className="bg-blue-100 text-blue-800" size="large" />
                                    <div>
                                        <p className="font-semibold text-900 m-0">{workOrder.machine.name}</p>
                                        <p className="text-sm text-600 m-0">Machine • {workOrder.machine.machine_code || "No Code"}</p>
                                    </div>
                                </div>
                            ) : workOrder.asset ? (
                                <div className="flex align-items-center gap-3">
                                    <Avatar icon="pi pi-box" className="bg-green-100 text-green-800" size="large" />
                                    <div>
                                        <p className="font-semibold text-900 m-0">{workOrder.asset.name}</p>
                                        <p className="text-sm text-600 m-0">Asset • {workOrder.asset.asset_code || "No Code"}</p>
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
                                    <p className="font-semibold text-900 m-0">{workOrder.createdBy?.full_name || workOrder.createdBy?.name || "Unknown User"}</p>
                                    {workOrder.createdBy?.email && <p className="text-sm text-600 m-0">{workOrder.createdBy.email}</p>}
                                    <p className="text-xs text-500 mt-1">Reported on {workOrder.created_at ? new Date(workOrder.created_at).toLocaleString() : "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                {workOrder.notes && (
                    <div className="mb-4 mt-2">
                        <div className="flex align-items-center gap-2 mb-3">
                            <i className="pi pi-comment text-primary"></i>
                            <h5 className="font-semibold text-lg m-0 text-700">Notes</h5>
                        </div>
                        <div className="p-3 bg-blue-50 border-round-lg border-left-3 border-blue-500">
                            <p className="text-900 m-0 whitespace-pre-line">
                                <i className="pi pi-quote-left text-blue-500 mr-2"></i>
                                {workOrder.notes}
                            </p>
                        </div>
                    </div>
                )}

                {/* Photo Section */}
                {finalPhotoSrc && (
                    <>
                        <Divider className="my-4" />
                        <div className="mb-4">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-image text-primary"></i>
                                <h5 className="font-semibold text-lg m-0 text-700">Attached Photo</h5>
                            </div>
                            <div className="text-center">
                                <Image
                                    src={finalPhotoSrc}
                                    alt="Work Order Photo"
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
}
