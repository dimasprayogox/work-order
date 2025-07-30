"use client";

import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { useState, useEffect } from "react";

const paperSizes = [
    { label: "A4", value: "a4" },
    { label: "Letter", value: "letter" },
    { label: "Legal", value: "legal" }
];

const orientations = [
    { label: "Portrait", value: "portrait" },
    { label: "Landscape", value: "landscape" }
];

const PartPDFPrintDialog = ({
    visible,
    onHide,
    onPrint,
    allColumns,
    selectedData = [],
    defaultSelectedColumns = []
}) => {
    const [form, setForm] = useState({
        paperSize: "a4",
        orientation: "portrait",
        columns: defaultSelectedColumns,
        onlySelected: false
    });

    // PERBAIKAN: Menambahkan 'defaultSelectedColumns' dan 'selectedData' ke dependency array
    useEffect(() => {
        if (visible) {
            setForm({
                paperSize: "a4",
                orientation: "portrait",
                columns: defaultSelectedColumns,
                onlySelected: selectedData.length > 0
            });
        }
    }, [visible, defaultSelectedColumns, selectedData]);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => {
        onPrint(form);
        onHide();
    };

    return (
        <Dialog
            header="Print PDF Options"
            visible={visible}
            style={{ width: "30rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
        >
            {/* Paper Size */}
            <div className="field grid mb-4">
                <label htmlFor="paperSize" className="col-12 mb-2 font-medium">Paper Size</label>
                <div className="col-12">
                    <Dropdown
                        id="paperSize"
                        value={form.paperSize}
                        options={paperSizes}
                        onChange={(e) => handleChange("paperSize", e.value)}
                        placeholder="Select paper size"
                    />
                </div>
            </div>

            {/* Orientation */}
            <div className="field grid mb-4">
                <label htmlFor="orientation" className="col-12 mb-2 font-medium">Orientation</label>
                <div className="col-12">
                    <Dropdown
                        id="orientation"
                        value={form.orientation}
                        options={orientations}
                        onChange={(e) => handleChange("orientation", e.value)}
                        placeholder="Select orientation"
                    />
                </div>
            </div>

            {/* Columns */}
            <div className="field grid mb-4">
                <label htmlFor="columns" className="col-12 mb-2 font-medium">Columns to Print</label>
                <div className="col-12">
                    <MultiSelect
                        id="columns"
                        value={form.columns}
                        options={allColumns}
                        onChange={(e) => handleChange("columns", e.value)}
                        optionLabel="header"
                        placeholder="Select columns"
                        display="chip"
                    />
                </div>
            </div>

            {/* Only Selected Checkbox */}
            <div className="field grid mb-4">
                <div className="col-12">
                    <Checkbox
                        inputId="onlySelected"
                        checked={form.onlySelected}
                        onChange={(e) => handleChange("onlySelected", e.checked)}
                        disabled={selectedData.length === 0} // Disable if no data is selected
                    />
                    <label htmlFor="onlySelected" className="ml-2">Print only selected data</label>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-content-end gap-2 mt-4">
                <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
                <Button label="Print" icon="pi pi-print" onClick={handleSubmit} />
            </div>
        </Dialog>
    );
};

export default PartPDFPrintDialog;
