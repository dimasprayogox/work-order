"use client";
import { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';

export default function CreatePartRequestDialog({ visible, onHide, fetchPartRequests, showToast }) {
    const [loading, setLoading] = useState(false);
    const [workOrders, setWorkOrders] = useState([]);
    const [parts, setParts] = useState([]);
    const [formData, setFormData] = useState({
        work_order_id: null,
        note: '',
        items: [{ part_id: null, quantity_requested: 1 }]
    });

    // Mengambil data untuk dropdown
    const fetchDataForForm = useCallback(async () => {
        try {
            // Mengambil work order dari API route yang sudah ada
            const woRes = await fetch('/api/technician/work-orders');
            const woResult = await woRes.json();
            if (!woRes.ok) throw new Error(woResult.message || 'Failed to load work orders.');
            const woData = Array.isArray(woResult) ? woResult : woResult.data || [];
            setWorkOrders(woData.map(wo => ({ label: wo.title, value: wo.id })));

            // Fetch parts from API
            const partsRes = await fetch('/api/technician/part');
            const partsResult = await partsRes.json();
            if (!partsRes.ok) throw new Error(partsResult.message || 'Failed to load parts.');

            // Ensure data is array
            const partsData = Array.isArray(partsResult) ? partsResult : partsResult.data || [];
            setParts(partsData.map(p => ({ label: `${p.name} (${p.part_number})`, value: p.id })));

        } catch (error) {
            showToast('error', 'Error', error.message);
        }
    }, [showToast]);

    useEffect(() => {
        if (visible) {
            // Reset form setiap kali dialog dibuka
            setFormData({
                work_order_id: null,
                note: '',
                items: [{ part_id: null, quantity_requested: 1 }]
            });
            fetchDataForForm();
        }
    }, [visible, fetchDataForForm]);


    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { part_id: null, quantity_requested: 1 }]
        }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async () => {
        // Validasi frontend sebelum mengirim
        if (!formData.work_order_id) {
            showToast('error', 'Validation Error', 'Work Order must be selected.');
            return;
        }
        if (formData.items.some(item => !item.part_id || item.quantity_requested < 1)) {
            showToast('error', 'Validation Error', 'Each item must have a valid part and quantity.');
            return;
        }

        setLoading(true);
        try {
            // Transform data to match backend schema
            const payload = {
                workOrderId: formData.work_order_id,
                note: formData.note,
                items: formData.items.map(item => ({
                    partId: item.part_id,
                    quantityRequested: item.quantity_requested
                }))
            };

            const response = await fetch('/api/technician/part-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) // Mengirim payload yang sudah ditransformasi
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to create part request.');

            showToast('success', 'Success', 'Part request created successfully.');
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
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button label="Create" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    );

    return (
        <Dialog header="Create New Part Request" visible={visible} style={{ width: 'min(90vw, 700px)' }} footer={footer} onHide={onHide} modal>
            <div className="p-fluid">
                <div className="field">
                    <label htmlFor="work_order_id">Work Order</label>
                    <Dropdown id="work_order_id" value={formData.work_order_id} options={workOrders} onChange={(e) => setFormData(prev => ({ ...prev, work_order_id: e.value }))} placeholder="Select Work Order" filter />
                </div>
                <div className="field">
                    <label htmlFor="note">Note</label>
                    <InputTextarea id="note" value={formData.note} onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))} rows={3} />
                </div>
                <h5>Items</h5>
                {formData.items.map((item, index) => (
                    <div key={index} className="grid align-items-center mb-2">
                        <div className="col-6">
                            <Dropdown value={item.part_id} options={parts} onChange={(e) => handleItemChange(index, 'part_id', e.value)} placeholder="Select Part" filter />
                        </div>
                        <div className="col-4">
                            <InputNumber value={item.quantity_requested} onValueChange={(e) => handleItemChange(index, 'quantity_requested', e.value)} min={1} showButtons />
                        </div>
                        <div className="col-2">
                            <Button icon="pi pi-trash" className="p-button-danger" onClick={() => removeItem(index)} disabled={formData.items.length === 1} />
                        </div>
                    </div>
                ))}
                <Button label="Add Item" icon="pi pi-plus" className="p-button-secondary mt-2" onClick={addItem} />
            </div>
        </Dialog>
    );
}
