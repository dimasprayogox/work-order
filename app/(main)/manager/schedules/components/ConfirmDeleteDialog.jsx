"use client";

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

export default function ConfirmDeleteDialog({ visible, onHide, onConfirm, itemType, itemName }) {
    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Tidak" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Ya, Hapus" icon="pi pi-trash" severity="danger" onClick={onConfirm} />
        </div>
    );

    return (
        <Dialog
            header="Konfirmasi Hapus"
            visible={visible}
            style={{ width: "min(90vw, 400px)" }}
            modal
            onHide={onHide}
            footer={dialogFooter}
        >
            <div className="flex align-items-center">
                <i className="pi pi-exclamation-triangle mr-3 text-4xl text-yellow-500" />
                <span>
                    Anda yakin ingin menghapus {itemType} <b>{itemName}</b> secara permanen?
                </span>
            </div>
        </Dialog>
    );
}
