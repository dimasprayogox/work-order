"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const AdminPartFormDialog = ({ visible, onHide, part, fetchParts, showToast }) => {
  const [form, setForm] = useState({
    name: "",
    part_number: "",
    description: "",
    quantity_in_stock: 0,
    min_stock: 0,
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (part) {
      setForm({
        name: part.name || "",
        part_number: part.part_number || "",
        description: part.description || "",
        quantity_in_stock: part.quantity_in_stock || 0,
        min_stock: part.min_stock || 0,
        location: part.location || "",
      });
    } else {
      setForm({
        name: "",
        part_number: "",
        description: "",
        quantity_in_stock: 0,
        min_stock: 0,
        location: "",
      });
    }
    setSubmitted(false);
  }, [part, visible]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    return form.name && form.part_number && form.location;
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!validateForm()) {
      showToast("error", "Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Menggunakan API route handler yang baru
      const endpoint = part
        ? `/api/admin/parts/${part.id}`
        : "/api/admin/parts";

      const method = part ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(
          "success",
          "Sukses",
          data.message || `Part ${part ? "updated" : "created"} successfully`
        );
        fetchParts();
        onHide();
      } else {
        throw new Error(data.message || "Gagal menyimpan part");
      }
    } catch (error) {
      showToast("error", "Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header={part ? "Edit Part" : "Add New Part"}
      visible={visible}
      style={{ width: "40rem" }}
      breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      onHide={onHide}
      modal
      className="p-fluid"
    >
      <div className="grid">
        {/* Part Name */}
        <div className="field col-12 md:col-6 mb-4">
          <label htmlFor="name" className="block mb-2 font-medium">
            Part Name <span className="text-red-500">*</span>
          </label>
          <InputText
            id="name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter part name"
            className={classNames({
              "p-invalid": submitted && !form.name,
            })}
          />
          {submitted && !form.name && (
            <small className="p-error">Part name is required</small>
          )}
        </div>

        {/* Part Number */}
        <div className="field col-12 md:col-6 mb-4">
          <label htmlFor="part_number" className="block mb-2 font-medium">
            Part Number <span className="text-red-500">*</span>
          </label>
          <InputText
            id="part_number"
            value={form.part_number}
            onChange={(e) => handleChange("part_number", e.target.value)}
            placeholder="Enter part number"
            className={classNames({
              "p-invalid": submitted && !form.part_number,
            })}
          />
          {submitted && !form.part_number && (
            <small className="p-error">Part number is required</small>
          )}
        </div>

        {/* Description */}
        <div className="field col-12 mb-4">
          <label htmlFor="description" className="block mb-2 font-medium">
            Description
          </label>
          <InputTextarea
            id="description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Enter description (optional)"
            rows={3}
          />
        </div>

        {/* Current Stock */}
        <div className="field col-12 md:col-6 mb-4">
          <label htmlFor="quantity" className="block mb-2 font-medium">
            Current Stock
          </label>
          <InputNumber
            id="quantity"
            value={form.quantity_in_stock}
            onValueChange={(e) =>
              handleChange("quantity_in_stock", e.value)
            }
            mode="decimal"
            min={0}
            showButtons
          />
        </div>

        {/* Minimum Stock */}
        <div className="field col-12 md:col-6 mb-4">
          <label htmlFor="min_stock" className="block mb-2 font-medium">
            Minimum Stock
          </label>
          <InputNumber
            id="min_stock"
            value={form.min_stock}
            onValueChange={(e) => handleChange("min_stock", e.value)}
            mode="decimal"
            min={0}
            showButtons
          />
        </div>

        {/* Location */}
        <div className="field col-12 md:col-6 mb-4">
          <label htmlFor="location" className="block mb-2 font-medium">
            Location <span className="text-red-500">*</span>
          </label>
          <InputText
            id="location"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="Enter location"
            className={classNames({
              "p-invalid": submitted && !form.location,
            })}
          />
          {submitted && !form.location && (
            <small className="p-error">Location is required</small>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button
          label="Cancel"
          icon="pi pi-times"
          onClick={onHide}
          className="p-button-text"
          disabled={loading}
        />
        <Button
          label={part ? "Update" : "Save"}
          icon="pi pi-check"
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </div>
    </Dialog>
  );
};

export default AdminPartFormDialog;
