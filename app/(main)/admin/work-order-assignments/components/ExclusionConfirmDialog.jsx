// app/(main)/admin/work-order-assignments/components/ExclusionConfirmDialog.jsx
"use client";

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";

const ExclusionConfirmDialog = ({
    visible,
    onHide,
    excludedItems = [],
    excludedCount = 0,
    onContinue
}) => {
    const getReasonBadge = (reason) => {
        if (reason === 'Completed') {
            return (
                <span className="px-2 py-1 text-xs font-semibold border-round text-white" style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}>
                    ✓ Completed
                </span>
            );
        } else if (reason === 'Already assigned') {
            return (
                <span className="px-2 py-1 text-xs font-semibold border-round text-white" style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                }}>
                    👤 Already Assigned
                </span>
            );
        }
        return (
            <span className="px-2 py-1 text-xs font-semibold border-round text-white" style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
            }}>
                ❌ Excluded
            </span>
        );
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-3" style={{ padding: '12px 16px', background: 'linear-gradient(90deg,#3b82f6,#06b6d4)', borderRadius: '8px 8px 0 0' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg,#0ea5e9,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="pi pi-users text-white" style={{ fontSize: 18 }}></i>
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-white">Exclude invalid selections</div>
                        <div className="text-sm text-white-alpha-80">{excludedCount} item(s) will be removed from bulk assign</div>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            className="p-shadow-6"
            style={{ width: '640px', borderRadius: 8 }}
            breakpoints={{ '640px': '95vw' }}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        outlined
                        onClick={onHide}
                    />
                    <Button
                        label="Continue"
                        icon="pi pi-check"
                        severity="success"
                        onClick={onContinue}
                    />
                </div>
            }
        >
            <div className="p-4">
                <div className="flex gap-4 mb-4">
                    <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg,#fff7ed,#fff1f2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
                    }}>
                        <i className="pi pi-ban text-orange-500 text-3xl"></i>
                    </div>
                    <div className="flex flex-column justify-content-center">
                        <div className="text-lg font-semibold">Some selections were excluded</div>
                        <div className="text-sm text-gray-600">Work orders with status <strong>Completed</strong> or already assigned will not be included in the bulk assignment.</div>
                    </div>
                </div>

                {excludedItems.length > 0 && (
                    <div className="mb-3">
                        <div className="text-sm font-medium mb-3">Example excluded items</div>
                        <div className="grid grid-nogutter" style={{ rowGap: '12px' }}>
                            {excludedItems.map((item, idx) => (
                                <div key={idx} className="col-12">
                                    <div className="p-3 surface-card border-round flex align-items-center justify-content-between" style={{
                                        boxShadow: '0 4px 12px rgba(13,38,59,0.04)',
                                        border: '1px solid rgba(0,0,0,0.06)'
                                    }}>
                                        <div className="flex align-items-center gap-3">
                                            <div style={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: 8,
                                                background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid rgba(0,0,0,0.04)'
                                            }}>
                                                <i className="pi pi-file-edit text-gray-600"></i>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{item.label}</div>
                                                <div className="text-sm text-gray-500 mt-1">Work Order</div>
                                            </div>
                                        </div>
                                        <div>
                                            {getReasonBadge(item.reason)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {excludedCount > excludedItems.length && (
                            <div className="text-sm text-gray-500 mt-3 text-center">
                                <i className="pi pi-ellipsis-h mr-2"></i>
                                and {excludedCount - excludedItems.length} more items...
                            </div>
                        )}
                    </div>
                )}

                <Divider />
                <div className="text-sm text-gray-600 mt-3 text-center">
                    <i className="pi pi-info-circle mr-2 text-blue-500"></i>
                    Proceed to assign the remaining eligible work orders, or press Cancel to adjust your selection.
                </div>
            </div>
        </Dialog>
    );
};

export default ExclusionConfirmDialog;
