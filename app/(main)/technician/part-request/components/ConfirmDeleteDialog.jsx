"use client";

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useState } from 'react';

export default function ConfirmDeleteDialog({ visible, onHide, request, fetchPartRequests, showToast }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!request) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/technician/part-request/${request.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Gagal menghapus permintaan.');
            }
            showToast('success', 'Success', 'Permintaan part berhasil dihapus.');
            fetchPartRequests();
            onHide();
        } catch (error) {
            showToast('error', 'Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div>
            <Button label="Tidak" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button label="Ya" icon="pi pi-check" onClick={handleDelete} loading={loading} className="p-button-danger" autoFocus />
        </div>
    );

    return (
        <Dialog
            header="Konfirmasi Hapus"
            visible={visible}
            style={{ width: '350px' }}
            modal
            footer={footer}
            onHide={onHide}
        >
            <div className="flex align-items-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Anda yakin ingin menghapus permintaan untuk <b>{request?.workOrder?.title}</b>?</span>
            </div>
        </Dialog>
    );
}
