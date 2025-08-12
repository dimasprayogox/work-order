"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";

export default function DelegateTechnicianDialog({ visible, onHide, workOrder, showToast, onTechnicianAssigned, fetchWorkOrders }) {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        assigned_to_id: "",
        notes: ""
    });
    const [formErrors, setFormErrors] = useState({});

    const fetchTechnicians = useCallback(async () => {
        try {
            const response = await fetch("/api/manager/technicians/available", {
                credentials: "include"
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Gagal mengambil daftar teknisi yang tersedia");
            }
            setTechnicians(result.data.map((t) => ({ label: t.name, value: t.id })));
        } catch (error) {
            showToast("error", "Error", error.message);
        }
    }, [showToast]);

    useEffect(() => {
        if (visible) {
            fetchTechnicians();
            setFormData({
                assigned_to_id: workOrder?.assigned_to_id || "",
                notes: workOrder?.notes || ""
            });
            setFormErrors({});
        }
    }, [visible, workOrder, fetchTechnicians]);

   if (workOrder?.assignedTo) {
       return (
           <Dialog header={`Work Order : '${workOrder?.title}'`} visible={visible} style={{ width: "670px" }} onHide={onHide} dismissableMask>
               <div className="p-fluid">
                   <Message severity="info" text={`This Work Order cannot be Assigned because its Assigned to teknisi '${workOrder.assignedTo.full_name}'.`} className="mb-4" />
               </div>
           </Dialog>
       );
   }

    const validateForm = () => {
        const errors = {};
        if (!formData.assigned_to_id) errors.assigned_to_id = "Teknisi wajib diisi";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                assigned_to_id: formData.assigned_to_id,
                notes: formData.notes
            };

            const response = await fetch(`/api/manager/work-orders/${workOrder.id}/assign-technician`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Gagal menugaskan teknisi");
            }

            showToast("success", "Berhasil", "Teknisi berhasil ditugaskan.");
            if (onTechnicianAssigned) {
                onTechnicianAssigned(result.data);
            }
            fetchWorkOrders();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const technicianOptionTemplate = (option) => {
        const isCurrentlyAssigned = workOrder?.assigned_to_id === option.value;
        return (
            <div className="flex align-items-center">
                {isCurrentlyAssigned && <i className="pi pi-check mr-2 text-green-500" />}
                <span>{option.label}</span>
            </div>
        );
    };

    const selectedTechnicianTemplate = (option, props) => {
        if (option) {
            const isCurrentlyAssigned = workOrder?.assigned_to_id === option.value;
            return (
                <div className="flex align-items-center">
                    {isCurrentlyAssigned && <i className="pi pi-check mr-2 text-green-500" />}
                    <span>{option.label}</span>
                </div>
            );
        }
        return props.placeholder;
    };

    return (
        <Dialog
            header={`Tugaskan Teknisi untuk: ${workOrder?.title || ""}`}
            visible={visible}
            style={{ width: "min(90vw, 500px)" }}
            modal
            onHide={onHide}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Batal" icon="pi pi-times" outlined onClick={onHide} />
                    <Button label="Tugaskan" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
                </div>
            }
        >
            <div className="p-fluid">
                <div className="field mb-4">
                    <label htmlFor="technician" className="font-bold mb-2 block">
                        Pilih Teknisi
                    </label>
                    <Dropdown
                        id="technician"
                        value={formData.assigned_to_id}
                        options={technicians}
                        onChange={(e) => setFormData({ ...formData, assigned_to_id: e.value })}
                        placeholder="Pilih teknisi"
                        className={formErrors.assigned_to_id ? "p-invalid" : ""}
                        itemTemplate={technicianOptionTemplate}
                        valueTemplate={selectedTechnicianTemplate}
                    />
                    {formErrors.assigned_to_id && <Message severity="error" text={formErrors.assigned_to_id} />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="notes" className="font-bold mb-2 block">
                        Catatan Tambahan
                    </label>
                    <InputTextarea id="notes" rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} autoResize />
                </div>
            </div>
        </Dialog>
    );
}