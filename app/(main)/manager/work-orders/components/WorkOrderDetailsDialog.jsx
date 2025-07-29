"use client";

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { ScrollPanel } from 'primereact/scrollpanel';

const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

const WorkOrderDetailsDialog = ({ visible, onHide, workOrder }) => {
    const getStatusSeverity = (status) => {
        switch (status) {
            case "pending": return "warning";
            case "in_progress": return "info";
            case "completed": return "success";
            default: return "secondary";
        }
    };

    const formattedStatusText = workOrder?.status
        ? workOrder.status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
        : "N/A";

    const renderDetailRow = (label, value) => (
        <div className="field grid align-items-center mb-2">
            <label className="col-4 md:col-3 font-semibold text-color-secondary">{label}:</label>
            <div className="col-8 md:col-9 text-color text-lg">{value}</div>
        </div>
    );

    return (
        <Dialog
            header="Detail Work Order"
            visible={visible}
            style={{ width: "min(95vw, 600px)" }}
            onHide={onHide}
            modal
            draggable={false}
            resizable={false}
            className="p-shadow-24 surface-card border-round"
        >
            {!workOrder ? (
                <div className="p-4 text-center text-color-secondary">
                    <i className="pi pi-info-circle text-2xl mr-2"></i>
                    <p>Tidak ada Work Order yang dipilih.</p>
                </div>
            ) : (
                <ScrollPanel style={{ width: '100%', height: 'calc(80vh - 100px)' }} className="custombar p-4">
                    <h3 className="text-2xl font-bold mb-4 text-color">{workOrder.title}</h3>

                    {renderDetailRow("Deskripsi", workOrder.description || "Tidak ada deskripsi")}
                    {renderDetailRow("Mesin", workOrder.machine?.name || 'N/A')}
                    {renderDetailRow("Prioritas", workOrder.priority || 'N/A')}
                    
                    {renderDetailRow("Status", (
                        <Tag
                            value={formattedStatusText}
                            severity={getStatusSeverity(workOrder.status)}
                            className="font-medium text-base"
                        />
                    ))}
                    
                    {renderDetailRow("Ditugaskan Kepada", workOrder.assignedTo?.full_name || 'Belum Ditugaskan')}
                    {renderDetailRow("Tanggal Terjadwal", formatDateTime(workOrder.scheduled_date))}
                    {renderDetailRow("Dibuat Oleh", workOrder.createdBy?.full_name || workOrder.createdBy?.username || 'N/A')}
                    {renderDetailRow("Dibuat Pada", formatDateTime(workOrder.created_at))}
                    {renderDetailRow("Mulai Pada", formatDateTime(workOrder.started_at))}
                    {renderDetailRow("Selesai Pada", formatDateTime(workOrder.completed_at))}
                    {renderDetailRow("Catatan", workOrder.notes || 'Tidak ada catatan')}

                    {workOrder.issue && (
                        <>
                            <Divider align="left">
                                <span className="p-tag">Detail Isu Terkait</span>
                            </Divider>
                            {renderDetailRow("Judul Isu", workOrder.issue.title || 'N/A')}
                            {renderDetailRow("Deskripsi Isu", workOrder.issue.description || 'Tidak ada deskripsi')}
                            {renderDetailRow("Dilaporkan Oleh", workOrder.issue.reportedBy?.full_name || workOrder.issue.reportedBy?.username || 'N/A')}
                        </>
                    )}
                    
                    <Divider align="left">
                        <span className="p-tag">Lampiran</span>
                    </Divider>

                    {workOrder.attachments && workOrder.attachments.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {workOrder.attachments.map((attachment, index) => (
                                <div key={index} className="col-span-1 border-1 surface-border p-2 border-round flex flex-column align-items-center">
                                    {attachment.url && /\.(jpeg|jpg|png|gif)$/i.test(attachment.url) ? (
                                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block text-center">
                                            <img
                                                src={attachment.url}
                                                alt={`Lampiran ${index + 1}`}
                                                className="w-full object-cover rounded-md shadow-sm"
                                                style={{ maxHeight: '120px', minHeight: '80px' }}
                                            />
                                            <span className="text-sm text-color-secondary mt-1 block">Lihat Gambar</span>
                                        </a>
                                    ) : (
                                        <div className="flex flex-column align-items-center justify-content-center h-full">
                                            <i className="pi pi-file text-5xl text-blue-500 mb-2"></i>
                                            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                                Lihat File
                                            </a>
                                            <span className="text-xs text-color-secondary mt-1">{attachment.url?.split('/').pop() || `File ${index + 1}`}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-color-secondary text-center">Tidak ada lampiran.</p>
                    )}
                </ScrollPanel>
            )}
        </Dialog>
    );
};

export default WorkOrderDetailsDialog;