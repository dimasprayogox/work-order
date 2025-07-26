"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

export default function ConfirmDeleteDialog({
    visible,
    onHide,
    onConfirm,
    itemType,
    itemName
}) {
    const footer = (
        <div>
            <Button
                label="No"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
            />
            <Button
                label="Yes"
                icon="pi pi-check"
                onClick={() => {
                    onConfirm();
                    onHide();
                }}
                className="p-button-danger"
                autoFocus
            />
        </div>
    );

    return (
        <Dialog
            header="Confirm Deletion"
            visible={visible}
            style={{ width: "350px" }}
            modal
            footer={footer}
            onHide={onHide}
        >
            <div className="flex align-items-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
                <span>
                    Are you sure you want to delete this {itemType} <b>{itemName}</b>?
                </span>
            </div>
        </Dialog>
    );
}