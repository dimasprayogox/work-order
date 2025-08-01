import React from 'react';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { motion } from 'framer-motion';

export const frequencyBodyTemplate = (rowData) => {
    const formattedFrequency = rowData.frequency
        ? rowData.frequency.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
        : "N/A";
    let severity;
    switch (rowData.frequency) {
        case "daily": severity = "danger"; break;
        case "weekly": severity = "warning"; break;
        case "monthly": severity = "info"; break;
        case "yearly": severity = "success"; break;
        default: severity = "secondary"; break;
    }
    return (
        <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
            <Tag value={formattedFrequency} severity={severity} />
        </motion.div>
    );
};

export const nextDueDateBodyTemplate = (rowData) => {
    if (!rowData.next_due_date) return "N/A";
    const date = new Date(rowData.next_due_date);
    return (
        <motion.span whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            {date.toLocaleString("id-ID", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })}
        </motion.span>
    );
};

export const machineBodyTemplate = (rowData) => {
    return (
        <motion.span whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            {rowData.machine?.name || "N/A"}
        </motion.span>
    );
};

export const createdByBodyTemplate = (rowData) => {
    return (
        <motion.span whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            {rowData.createdBy?.full_name || rowData.createdBy?.username || "N/A"}
        </motion.span>
    );
};

export const actionBodyTemplate = (rowData, onEdit, onDetails) => {
    return (
        <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-secondary"
                    tooltip="Edit Jadwal"
                    onClick={() => onEdit(rowData)}
                />
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-info"
                    tooltip="Lihat Detail"
                    onClick={() => onDetails(rowData)}
                />
            </motion.div>
        </div>
    );
};