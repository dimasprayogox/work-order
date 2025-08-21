"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";
import { Divider } from "primereact/divider";
import React from "react";

const WorkOrderDetailDialog = ({ visible, onHide, workOrder }) => {
    if (!workOrder) return null;

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
            case "pending":
                return { bgColor: "bg-orange-100", textColor: "text-orange-800", icon: "pi pi-clock", label: "Pending" };
            case "in_progress":
                return { bgColor: "bg-cyan-100", textColor: "text-cyan-800", icon: "pi pi-spin pi-spinner", label: "In Progress" };
            case "completed":
                return { bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi pi-check-circle", label: "Completed" };
            case "rejected":
                return { bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi pi-times-circle", label: "Rejected" };
            default:
                return { bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi pi-question", label: status };
        }
    };

    const statusDetails = getStatusDetails(workOrder.status);
    const priority = workOrder.priority || workOrder.issue?.workOrder?.priority || "medium";

    const getPriorityDetails = (p) => {
        switch (p) {
            case 'low': return { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Low' };
            case 'high': return { bgColor: 'bg-red-100', textColor: 'text-red-800', label: 'High' };
            default: return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', label: 'Medium' };
        }
    };

    const priorityDetails = getPriorityDetails(priority);

    const targetLabel = workOrder.machine ? 'Machine' : workOrder.asset ? 'Asset' : (workOrder.issue?.machine ? 'Machine (from Issue)' : (workOrder.issue?.asset ? 'Asset (from Issue)' : 'Target'));
    const targetName = workOrder.machine?.name || workOrder.asset?.name || workOrder.issue?.machine?.name || workOrder.issue?.asset?.name || 'N/A';
    const targetCode = workOrder.machine?.machine_code || workOrder.asset?.asset_code || workOrder.issue?.machine?.machine_code || workOrder.issue?.asset?.asset_code || null;

    const photoSrc = workOrder.photo_url || workOrder.issue?.photo_url || null;

    const footer = (
        <div className="flex justify-content-end">
            <Button label="Close" icon="pi pi-times" onClick={onHide} className="p-button-text" />
        </div>
    );

    return (
        <Dialog header={`Work Order: ${workOrder.title || ''}`} visible={visible} style={{ width: '50rem' }} modal onHide={onHide} footer={footer}>
            <div className="grid">
                <div className="col-12 md:col-8">
                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Title</label>
                        <p className="text-lg font-medium">{workOrder.title}</p>
                    </div>

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Description</label>
                        <p className="line-height-3 text-gray-700">{workOrder.description}</p>
                    </div>

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">{targetLabel}</label>
                        <div className="flex align-items-center gap-2">
                            <i className={`pi ${workOrder.machine ? 'pi-cog' : 'pi-box'} text-blue-500`}></i>
                            <span className="font-medium">{targetName}</span>
                            {targetCode && <Tag value={targetCode} className="p-tag-secondary" />}
                        </div>
                    </div>

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Status</label>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusDetails.bgColor} ${statusDetails.textColor}`} style={{ width: 'fit-content', minWidth: '120px' }}>
                            <i className={`pi ${statusDetails.icon}`}></i>
                            <span className="font-medium">{statusDetails.label}</span>
                        </div>
                    </div>

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Priority</label>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${priorityDetails.bgColor} ${priorityDetails.textColor}`} style={{ width: 'fit-content', minWidth: '100px' }}>
                            <span className="font-medium">{priorityDetails.label}</span>
                        </div>
                    </div>

                    {workOrder.issue && (
                        <>
                            <Divider />
                            <div className="field mb-4">
                                <label className="font-semibold text-gray-800 block mb-2"><i className="pi pi-exclamation-circle mr-2"></i>Related Issue</label>
                                <div className="p-3 border-1 border-gray-300 border-round bg-gray-50">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <span className="font-medium">{workOrder.issue.title}</span>
                                        <Tag value={workOrder.issue.status} severity={workOrder.issue.status === 'resolved' ? 'success' : 'info'} />
                                    </div>
                                    {workOrder.issue.description && <p className="text-gray-600 text-sm">{workOrder.issue.description}</p>}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="col-12 md:col-4">
                    {photoSrc && (
                        <div className="field mb-4">
                            <label className="font-semibold text-gray-800 block mb-2">Photo</label>
                            <Image src={photoSrc} alt="Work Order Photo" width="100%" preview className="border-round shadow-2" onError={(e)=>{e.target.onerror=null; e.target.src='https://placehold.co/600x400/cccccc/000000?text=Image+Not+Found'}} />
                        </div>
                    )}

                    <div className="field mb-3">
                        <label className="font-semibold text-gray-800 block mb-2">Work Order ID</label>
                        <div className="p-2 bg-gray-100 border-round"><code className="text-sm text-gray-700">{workOrder.id}</code></div>
                    </div>

                    <div className="field mb-3">
                        <label className="font-semibold text-gray-800 block mb-2">Created</label>
                        <div className="flex align-items-center gap-2"><i className="pi pi-calendar text-gray-500"></i><span className="text-sm text-gray-700">{formatDate(workOrder.created_at)}</span></div>
                    </div>

                    {workOrder.updated_at && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Last Updated</label>
                            <div className="flex align-items-center gap-2"><i className="pi pi-clock text-gray-500"></i><span className="text-sm text-gray-700">{formatDate(workOrder.updated_at)}</span></div>
                        </div>
                    )}

                    {workOrder.createdBy && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Created By</label>
                            <div className="flex align-items-center gap-2"><i className="pi pi-user text-gray-500"></i><span className="text-sm text-gray-700">{workOrder.createdBy?.full_name || workOrder.createdBy?.name || 'Unknown'}</span></div>
                        </div>
                    )}

                    {workOrder.notes && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Technician Note</label>
                            <div className="p-3 bg-gray-50 border-1 border-gray-200 border-round">
                                <p className="text-sm text-gray-700 whitespace-pre-line">{workOrder.notes}</p>
                            </div>
                        </div>
                    )}

                    {workOrder.status === 'completed' && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Repairable</label>
                            <div className="flex align-items-center gap-2">
                                {(() => {
                                    const val = (typeof workOrder.repairable === 'boolean') ? workOrder.repairable : (typeof workOrder.issue?.repairable === 'boolean' ? workOrder.issue.repairable : null);
                                    const config = val === true
                                        ? { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check', label: 'Repairable' }
                                        : val === false
                                            ? { bgColor: 'bg-red-100', textColor: 'text-red-800', icon: 'pi-times-circle', label: 'Not Repairable' }
                                            : { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: 'pi-question', label: '-' };

                                    return (
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                                            <i className={`pi ${config.icon}`}></i>
                                            <span className="font-medium">{config.label}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                            <small className="text-xs text-gray-500 block mt-2">Indicates whether the machine/asset was repairable when this work order was completed.</small>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default WorkOrderDetailDialog;
