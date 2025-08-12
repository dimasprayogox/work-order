"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../../../api/api";

const PartFormDialog = ({ visible, onHide, part, fetchParts, showToast }) => {
    const [form, setForm] = useState({
        name: "",
        part_number: "",
        description: "",
        quantity_in_stock: 0,
        min_stock: 0,
        location: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (part) {
            setForm(part);
        } else {
            setForm({
                name: "",
                part_number: "",
                description: "",
                quantity_in_stock: 0,
                min_stock: 0,
                location: ""
            });
        }
    }, [part]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                part ? `${API_ENDPOINTS.PARTS}/${part.id}` : API_ENDPOINTS.PARTS,
                {
                    method: part ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(form)
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan");
            showToast("success", "Sukses", data.message);
            fetchParts();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog header={part ? "Edit Part" : "Add Part"} visible={visible} style={{ width: "500px" }} onHide={onHide} modal>
            <div className="p-fluid space-y-4">
                <InputText value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Name" />
                <InputText value={form.part_number} onChange={(e) => handleChange("part_number", e.target.value)} placeholder="Part Number" />
                <InputText value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Description" />
                <InputNumber value={form.quantity_in_stock} onValueChange={(e) => handleChange("quantity_in_stock", e.value)} placeholder="Stock" />
                <InputNumber value={form.min_stock} onValueChange={(e) => handleChange("min_stock", e.value)} placeholder="Min Stock" />
                <InputText value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Location" />
                <Button label="Save" onClick={handleSubmit} loading={loading} />
            </div>
        </Dialog>
    );
};

export default PartFormDialog;
