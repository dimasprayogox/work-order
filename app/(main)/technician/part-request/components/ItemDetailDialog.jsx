"use client";

import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";

export default function ItemDetailDialog({ visible, onHide, items }) {
    return (
        <Dialog
            header="Requested Items Detail"
            visible={visible}
            style={{ width: "min(90vw, 500px)" }}
            modal
            onHide={onHide}
        >
            <div className="p-fluid">
                {items && items.length > 0 ? (
                    items.map((item, index) => (
                        <div key={item.id}>
                            <div className="grid">
                                <div className="col-8">
                                    <p className="font-bold text-lg mb-1">{item.part.name}</p>
                                    <p className="text-sm text-gray-500 m-0">Part Number: {item.part.part_number}</p>
                                </div>
                                <div className="col-4 text-right">
                                    <p className="font-bold text-lg mb-1">Qty: {item.quantity_requested}</p>
                                </div>
                                <div className="col-12">
                                    <p className="text-sm mt-1">{item.part.description}</p>
                                </div>
                            </div>
                            {index < items.length - 1 && <Divider />}
                        </div>
                    ))
                ) : (
                    <p>No items in this request.</p>
                )}
            </div>
        </Dialog>
    );
}
