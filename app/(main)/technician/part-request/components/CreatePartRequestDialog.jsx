"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";

export default function CreatePartRequestDialog({ visible, onHide, workOrder, fetchPartRequests, showToast }) {
    const [loading, setLoading] = useState(false);
    const [workOrders, setWorkOrders] = useState([]);
    const [allParts, setAllParts] = useState([]);
    const [filteredParts, setFilteredParts] = useState([]);
    const [formData, setFormData] = useState({
        work_order_id: null,
        note: "",
        items: [{ part_id: null, quantity_requested: 1 }]
    });

    // Use ref untuk items untuk menghindari infinite loop
    const itemsRef = useRef(formData.items);

    const fetchDataForForm = useCallback(async () => {
        try {
            const woRes = await fetch("/api/technician/work-orders");
            const woResult = await woRes.json();
            if (!woRes.ok) throw new Error(woResult.message || "Failed to load work orders.");
            const woData = Array.isArray(woResult) ? woResult : woResult.data || [];
            // Exclude work orders with status 'completed' (case-insensitive)
            const visibleWorkOrders = woData.filter((wo) => !(wo && wo.status && String(wo.status).toLowerCase() === "completed"));
            setWorkOrders(
                visibleWorkOrders.map((wo) => ({
                    label: wo.title,
                    value: wo.id,
                    // try to get machine id from multiple possible shapes returned by backend
                    machineId: wo.machine_id || (wo.machine && wo.machine.id) || (wo.issue && wo.issue.machine && wo.issue.machine.id) || null,
                    // also include asset id when WO refers to an asset
                    assetId: wo.asset_id || (wo.asset && wo.asset.id) || (wo.issue && wo.issue.asset && wo.issue.asset.id) || null
                }))
            );

            const partsRes = await fetch("/api/technician/part");
            const partsResult = await partsRes.json();
            if (!partsRes.ok) throw new Error(partsResult.message || "Failed to load parts.");

            const partsData = Array.isArray(partsResult) ? partsResult : partsResult.data || [];
            setAllParts(
                partsData.map((p) => ({
                    label: `${p.name} (${p.part_number})`,
                    value: p.id,
                    machineId: p.machine_id || (p.machine && p.machine.id) || null,
                    assetId: p.asset_id || (p.asset && p.asset.id) || null
                }))
            );
        } catch (error) {
            showToast("error", "Error", error.message);
        }
    }, [showToast]);

    useEffect(() => {
        if (visible) {
            setFormData({
                work_order_id: null,
                note: "",
                items: [{ part_id: null, quantity_requested: 1 }]
            });
            fetchDataForForm();
        }
    }, [visible, fetchDataForForm]);

    // Update ref ketika items berubah
    useEffect(() => {
        itemsRef.current = formData.items;
    }, [formData.items]);

    // Filter parts based on selected work order
    useEffect(() => {
        if (formData.work_order_id) {
            const selectedWorkOrder = workOrders.find((wo) => wo.value === formData.work_order_id);
                if (selectedWorkOrder) {
                // Filter parts that match either the machine or the asset related to the selected work order
                const filtered = allParts.filter((part) => {
                    const matchesMachine = selectedWorkOrder.machineId && part.machineId && part.machineId === selectedWorkOrder.machineId;
                    const matchesAsset = selectedWorkOrder.assetId && part.assetId && part.assetId === selectedWorkOrder.assetId;
                    return matchesMachine || matchesAsset;
                });
                setFilteredParts(filtered);

                // Gunakan ref untuk mengakses items terbaru tanpa menyebabkan infinite loop
                const currentItems = itemsRef.current;
                const needsUpdate = currentItems.some((item) => item.part_id && !filtered.some((p) => p.value === item.part_id));

                if (needsUpdate) {
                    const newItems = currentItems.map((item) => {
                        if (item.part_id && !filtered.some((p) => p.value === item.part_id)) {
                            return { ...item, part_id: null };
                        }
                        return item;
                    });
                    setFormData((prev) => ({ ...prev, items: newItems }));
                }
            }
        } else {
            setFilteredParts([]);
        }
    }, [formData.work_order_id, workOrders, allParts]); // formData.items dihapus dari dependencies

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { part_id: null, quantity_requested: 1 }]
        }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async () => {
        if (!formData.work_order_id) {
            showToast("error", "Validation Error", "Work Order must be selected.");
            return;
        }
        if (formData.items.some((item) => !item.part_id || item.quantity_requested < 1)) {
            showToast("error", "Validation Error", "Each item must have a valid part and quantity.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                workOrderId: formData.work_order_id,
                note: formData.note,
                items: formData.items.map((item) => ({
                    partId: item.part_id,
                    quantityRequested: item.quantity_requested
                }))
            };

            const response = await fetch("/api/technician/part-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to create part request.");

            showToast("success", "Success", "Part request created successfully.");
            fetchPartRequests();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div>
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button label="Create" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    );

    return (
        <Dialog header="Create New Part Request" visible={visible} style={{ width: "min(90vw, 700px)" }} footer={footer} onHide={onHide} modal>
            <div className="p-fluid">
                <div className="field">
                    <label htmlFor="work_order_id">Work Order</label>
                    <Dropdown id="work_order_id" value={formData.work_order_id} options={workOrders} onChange={(e) => setFormData((prev) => ({ ...prev, work_order_id: e.value }))} placeholder="Select Work Order" filter />
                </div>
                <div className="field">
                    <label htmlFor="note">Note</label>
                    <InputTextarea id="note" value={formData.note} onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))} rows={3} />
                </div>
                <h5>Items</h5>
                {formData.items.map((item, index) => (
                    <div key={index} className="grid align-items-center mb-2">
                        <div className="col-6">
                            <Dropdown value={item.part_id} options={filteredParts} onChange={(e) => handleItemChange(index, "part_id", e.value)} placeholder="Select Part" filter disabled={!formData.work_order_id} />
                        </div>
                        <div className="col-4">
                            <InputNumber value={item.quantity_requested} onValueChange={(e) => handleItemChange(index, "quantity_requested", e.value)} min={1} showButtons />
                        </div>
                        <div className="col-2">
                            <Button icon="pi pi-trash" className="p-button-danger" onClick={() => removeItem(index)} disabled={formData.items.length === 1} />
                        </div>
                    </div>
                ))}
                <Button label="Add Item" icon="pi pi-plus" className="p-button-secondary mt-2" onClick={addItem} disabled={!formData.work_order_id} />
            </div>
        </Dialog>
    );
}
