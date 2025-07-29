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

const formatFrequencyText = (frequency) => {
    if (!frequency) return "N/A";
    return frequency.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const getFrequencySeverity = (frequency) => {
    switch (frequency) {
        case "daily": return "danger";
        case "weekly": return "warning";
        case "monthly": return "info";
        case "yearly": return "success";
        default: return "secondary";
    }
};

const renderDetailRow = (label, value) => (
    <div className="field grid align-items-center mb-2">
        <label className="col-4 md:col-3 font-semibold text-color-secondary">{label}:</label>
        <div className="col-8 md:col-9 text-color text-lg">{value}</div>
    </div>
);

export default function ScheduleDetailsDialog({ visible, onHide, schedule }) {
    return (
        <Dialog
            header="Detail Jadwal Perawatan"
            visible={visible}
            style={{ width: "min(95vw, 600px)" }}
            onHide={onHide}
            modal
            draggable={false}
            resizable={false}
            className="p-shadow-24 surface-card border-round"
        >
            {!schedule ? (
                <div className="p-4 text-center text-color-secondary">
                    <i className="pi pi-info-circle text-2xl mr-2"></i>
                    <p>Tidak ada Jadwal Perawatan yang dipilih.</p>
                </div>
            ) : (
                <ScrollPanel style={{ width: '100%', height: 'calc(80vh - 100px)' }} className="custombar p-4">
                    <h3 className="text-2xl font-bold mb-4 text-color">{schedule.title}</h3>
                    
                    {renderDetailRow("Deskripsi", schedule.description || "Tidak ada deskripsi")}
                    {renderDetailRow("Mesin", schedule.machine?.name || 'N/A')}
                    {renderDetailRow("Prioritas", schedule.priority || 'N/A')}
                    
                    {renderDetailRow("Frekuensi", (
                        <Tag
                            value={formatFrequencyText(schedule.frequency)}
                            severity={getFrequencySeverity(schedule.frequency)}
                            className="font-medium text-base"
                        />
                    ))}
                    
                    {renderDetailRow("Jatuh Tempo Berikutnya", formatDateTime(schedule.next_due_date))}
                    {renderDetailRow("Dibuat Oleh", schedule.createdBy?.full_name || schedule.createdBy?.username || 'N/A')}
                    {renderDetailRow("Dibuat Pada", formatDateTime(schedule.created_at))}
                    {schedule.updated_at && renderDetailRow("Terakhir Diperbarui", formatDateTime(schedule.updated_at))}
                    
                </ScrollPanel>
            )}
        </Dialog>
    );
}
