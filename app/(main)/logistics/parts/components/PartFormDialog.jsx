"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

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
    const [submitted] = useState(false);

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
            const res = await fetch(part ? `/api/logistics/parts/${part.id}` : "/api/logistics/parts", {
                method: part ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form)
            });
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
        <Dialog header={part ? "Edit Part" : "Add New Part"} visible={visible} style={{ width: "32rem" }} breakpoints={{ "960px": "75vw", "641px": "90vw" }} onHide={onHide} modal className="p-fluid">
            <div className="field grid mb-4">
                <label htmlFor="name" className="col-12 mb-2 font-medium">
                    Part Name <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="" className={classNames({ "p-invalid": submitted && !form.name })} />
                    {submitted && !form.name && <small className="p-error">Part name is required</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="part_number" className="col-12 mb-2 font-medium">
                    Part Number <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText id="part_number" value={form.part_number} onChange={(e) => handleChange("part_number", e.target.value)} placeholder="" className={classNames({ "p-invalid": submitted && !form.part_number })} />
                    {submitted && !form.part_number && <small className="p-error">Part number is required</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="description" className="col-12 mb-2 font-medium">
                    Description
                </label>
                <div className="col-12">
                    <InputText id="description" value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="optional" />
                </div>
            </div>

            <div className="grid">
                <div className="field col-6 mb-4">
                    <label htmlFor="quantity" className="block mb-2 font-medium">
                        Current Stock
                    </label>
                    <InputNumber id="quantity" value={form.quantity_in_stock} onValueChange={(e) => handleChange("quantity_in_stock", e.value)} mode="decimal" min={0} showButtons />
                </div>

                <div className="field col-6 mb-4">
                    <label htmlFor="min_stock" className="block mb-2 font-medium">
                        Minimum Stock
                    </label>
                    <InputNumber id="min_stock" value={form.min_stock} onValueChange={(e) => handleChange("min_stock", e.value)} mode="decimal" min={0} showButtons />
                </div>
            </div>

            <div className="field grid mb-6">
                <label htmlFor="location" className="col-12 mb-2 font-medium">
                    Location <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <InputText id="location" value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="" className={classNames({ "p-invalid": submitted && !form.location })} />
                    {submitted && !form.location && <small className="p-error">Location is required</small>}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />
                <Button label={part ? "Update" : "Save"} icon="pi pi-check" onClick={handleSubmit} loading={loading} disabled={loading} />
            </div>
        </Dialog>
    );
};

export default PartFormDialog;
