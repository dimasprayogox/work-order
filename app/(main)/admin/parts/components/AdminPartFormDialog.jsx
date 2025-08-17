"use client";

import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";

const AdminPartFormDialog = ({ visible, onHide, part, fetchParts, showToast, assets = [], machines = [] }) => {
  const [form, setForm] = useState({
    name: "",
    part_number: "",
    description: "",
    quantity_in_stock: 0,
    min_stock: 0,
    location: "",
    asset_id: null,
    machine_id: null,
  });

  const [selectionType, setSelectionType] = useState(null); // 'asset' | 'machine' | null

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
  asset_id: part.asset?.id || null,
  machine_id: part.machine?.id || null,
      });
  // determine initial selection type based on existing relation
  if (part.asset) setSelectionType("asset");
  else if (part.machine) setSelectionType("machine");
    } else {
      setForm({
        name: "",
        part_number: "",
        description: "",
        quantity_in_stock: 0,
        min_stock: 0,
  location: "",
  asset_id: null,
  machine_id: null,
      });
  setSelectionType(null);
    }
    setSubmitted(false);
  }, [part, visible]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    // Require basic fields and at least one relation (asset OR machine)
    return (
      form.name &&
      form.part_number &&
      form.location &&
      selectionType &&
      ((selectionType === "asset" && form.asset_id) ||
        (selectionType === "machine" && form.machine_id))
    );
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

  const handleSelectAsset = (value) => {
    // If asset selected, clear machine
  setForm((prev) => ({ ...prev, asset_id: value, machine_id: null }));
  setSelectionType("asset");
  };

  const handleSelectMachine = (value) => {
    // If machine selected, clear asset
  setForm((prev) => ({ ...prev, machine_id: value, asset_id: null }));
  setSelectionType("machine");
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

        {/* Asset / Machine selection (XOR) */}
        {/* First choose whether this part belongs to an Asset or a Machine */}
        <div className="field col-12 md:col-6 mb-4">
          <label className="block mb-2 font-medium">Owner Type <span className="text-red-500">*</span></label>
          <Dropdown
            value={selectionType}
            options={[
              { label: "Asset", value: "asset" },
              { label: "Machine", value: "machine" },
            ]}
            onChange={(e) => {
              const val = e.value;
              setSelectionType(val);
              // clear previous selections when type changes
              setForm((prev) => ({ ...prev, asset_id: null, machine_id: null }));
            }}
            placeholder="Select Owner Type"
            showClear
          />
          {submitted && !selectionType && (
            <small className="p-error">Please select Asset or Machine</small>
          )}
        </div>

        {/* Conditionally render the chosen dropdown */}
        {selectionType === "asset" && (
          <div className="field col-12 md:col-6 mb-4">
            <label className="block mb-2 font-medium">Asset <span className="text-red-500">*</span></label>
            <Dropdown
              value={form.asset_id}
              options={assets.map((a) => ({ label: a.name, value: a.id }))}
              onChange={(e) => handleSelectAsset(e.value)}
              placeholder="Select Asset"
              showClear
            />
            {submitted && selectionType === "asset" && !form.asset_id && (
              <small className="p-error">Please select an Asset</small>
            )}
          </div>
        )}

        {selectionType === "machine" && (
          <div className="field col-12 md:col-6 mb-4">
            <label className="block mb-2 font-medium">Machine <span className="text-red-500">*</span></label>
            <Dropdown
              value={form.machine_id}
              options={machines.map((m) => ({ label: m.name, value: m.id }))}
              onChange={(e) => handleSelectMachine(e.value)}
              placeholder="Select Machine"
              showClear
            />
            {submitted && selectionType === "machine" && !form.machine_id && (
              <small className="p-error">Please select a Machine</small>
            )}
          </div>
        )}
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
