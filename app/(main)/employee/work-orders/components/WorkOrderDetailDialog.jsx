"use client";

import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";

export default function WorkOrderDetailDialog({ visible, onHide, workOrder }) {
    if (!workOrder) return null;

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
            high: { label: "High", color: "bg-red-100 text-red-800" },
            medium: { label: "Medium", color: "bg-orange-100 text-orange-800" },
            low: { label: "Low", color: "bg-yellow-100 text-yellow-800" }
        };
        return priorityMap[priority] || { label: priority || "Medium", color: "bg-gray-100 text-gray-800" };
    };

    const statusConfig = getStatusConfig(workOrder.status);
    const priorityConfig = getPriorityConfig(workOrder.priority);

    return (
        <Dialog
            header="Work Order Details"
            visible={visible}
            style={{ width: "min(90vw, 600px)" }}
            modal
            onHide={onHide}
        >
            <div className="p-fluid">
                {/* Title and Status */}
                <div className="grid mb-3">
                    <div className="col-8">
                        <h4 className="font-bold text-xl mb-2 text-primary">{workOrder.title}</h4>
                    </div>
                    <div className="col-4 text-right">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} inline-flex`}>
                            <i className={`pi ${statusConfig.icon}`}></i>
                            <span className="font-medium">{statusConfig.label}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                    <label className="font-semibold text-sm text-gray-700 mb-1 block">Description</label>
                    <p className="text-gray-900 p-3 bg-gray-50 border-round">{workOrder.description || "No description provided"}</p>
                </div>

                {/* Machine/Asset Information */}
                <div className="grid mb-3">
                    <div className="col-6">
                        <label className="font-semibold text-sm text-gray-700 mb-1 block">Machine/Asset</label>
                        {workOrder.machine?.name ? (
                            <Tag value={`Machine: ${workOrder.machine.name}`} className="bg-blue-100 text-blue-800 font-medium w-full" />
                        ) : workOrder.asset?.name ? (
                            <Tag value={`Asset: ${workOrder.asset.name}`} className="bg-green-100 text-green-800 font-medium w-full" />
                        ) : (
                            <span className="text-gray-400">N/A</span>
                        )}
                    </div>
                    <div className="col-6">
                        <label className="font-semibold text-sm text-gray-700 mb-1 block">Priority</label>
                        <Tag value={priorityConfig.label} className={`${priorityConfig.color} font-medium w-full`} />
                    </div>
                </div>

                {/* Reported By Information */}
                <div className="grid mb-3">
                    <div className="col-6">
                        <label className="font-semibold text-sm text-gray-700 mb-1 block">Reported By</label>
                        <p className="text-gray-900">
                            {workOrder.reportedBy?.full_name || workOrder.reported_by?.full_name || "Unknown User"}
                        </p>
                        {(workOrder.reportedBy?.email || workOrder.reported_by?.email) && (
                            <p className="text-sm text-gray-500">
                                {workOrder.reportedBy?.email || workOrder.reported_by?.email}
                            </p>
                        )}
                    </div>
                    <div className="col-6">
                        <label className="font-semibold text-sm text-gray-700 mb-1 block">Reported Date</label>
                        <p className="text-gray-900">
                            {workOrder.created_at ? new Date(workOrder.created_at).toLocaleString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            }) : "N/A"}
                        </p>
                    </div>
                </div>

                {/* Note/Additional Information */}
                {(workOrder.note || workOrder.workOrder?.notes) && (
                    <div className="mb-3">
                        <label className="font-semibold text-sm text-gray-700 mb-1 block">Note</label>
                        <p className="text-gray-900 p-3 bg-blue-50 border-round border-left-3 border-blue-500">
                            {workOrder.note || workOrder.workOrder?.notes}
                        </p>
                    </div>
                )}

                {/* Repairable Status */}
                <div className="grid mb-3">
                    <div className="col-6">
                        <label className="font-semibold text-sm text-gray-700 mb-1 block">Repairable</label>
                        {(() => {
                            // Determine repairable value from possible locations and types
                            let val = null;
                            if (typeof workOrder.repairable === 'boolean') {
                                val = workOrder.repairable;
                            } else if (workOrder.repairable === 1 || workOrder.repairable === '1') {
                                val = true;
                            } else if (workOrder.repairable === 0 || workOrder.repairable === '0') {
                                val = false;
                            } else if (typeof workOrder.workOrder?.repairable === 'boolean') {
                                val = workOrder.workOrder.repairable;
                            } else if (workOrder.workOrder?.repairable === 1 || workOrder.workOrder?.repairable === '1') {
                                val = true;
                            } else if (workOrder.workOrder?.repairable === 0 || workOrder.workOrder?.repairable === '0') {
                                val = false;
                            } else if (typeof workOrder.issue?.repairable === 'boolean') {
                                val = workOrder.issue.repairable;
                            }

                            const config = val === true
                                ? { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check', label: 'Repairable' }
                                : val === false
                                    ? { bgColor: 'bg-red-100', textColor: 'text-red-800', icon: 'pi-times-circle', label: 'Not Repairable' }
                                    : { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: 'pi-question', label: 'Not Specified' };

                            return (
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                                    <i className={`pi ${config.icon}`}></i>
                                    <span className="font-medium">{config.label}</span>
                                </div>
                            );
                        })()}
                    </div>
                    {workOrder.machine && (
                        <div className="col-6">
                            <label className="font-semibold text-sm text-gray-700 mb-1 block">Machine Status</label>
                            <Tag
                                value={workOrder.machine.status || "Unknown"}
                                className="bg-gray-100 text-gray-800"
                            />
                        </div>
                    )}
                </div>

                {/* Photo */}
                {workOrder.photo_url && (
                    <>
                        <Divider />
                        <div className="mb-3">
                            <label className="font-semibold text-sm text-gray-700 mb-2 block">Photo</label>
                            <div className="text-center">
                                <Image
                                    src={workOrder.photo_url}
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

                {/* Work Order Information */}
                {workOrder.workOrder && (
                    <>
                        <Divider />
                        <div className="mb-3">
                            <label className="font-semibold text-sm text-gray-700 mb-2 block">Work Order Information</label>
                            <div className="grid">
                                <div className="col-6">
                                    <p className="text-sm text-gray-600 mb-1">Work Order Status:</p>
                                    <Tag value={workOrder.workOrder.status || "N/A"} className="bg-cyan-100 text-cyan-800" />
                                </div>
                                <div className="col-6">
                                    <p className="text-sm text-gray-600 mb-1">Work Order Priority:</p>
                                    <Tag value={workOrder.workOrder.priority || "Medium"} className="bg-orange-100 text-orange-800" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    );
}
