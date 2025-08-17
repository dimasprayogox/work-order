// app/(main)/admin/divisions/components/DivisionTable.jsx
"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog } from "primereact/confirmdialog";

const DivisionTable = ({
    divisions,
    loading,
    onEdit,
    onDelete,
    selectedDivisions = [],
    onSelectionChange = () => {},
    onSearch = () => {},
    searchText = ""
}) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);

    useEffect(() => {
        setGlobalFilterValue(searchText);
        setFilters((prevFilters) => ({
            ...prevFilters,
            global: { ...prevFilters.global, value: searchText },
        }));
    }, [searchText]);

    const onGlobalFilterChange = (value) => {
        // Update filter DataTable secara lokal
        const _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);

        // Informasikan ke parent component tentang perubahan search text
        onSearch(value);
    };

    const handleSelectionChange = (e) => {
        onSelectionChange(e.value);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const dateBodyTemplate = (rowData, field) => {
        return formatDate(rowData[field]);
    };

    const descriptionBodyTemplate = (rowData) => {
        const description = rowData.description || '-';
        return description.length > 50 ? `${description.substring(0, 50)}...` : description;
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                rounded
                outlined
                className="p-button-sm"
                onClick={() => onEdit(rowData)}
                tooltip="Edit"
            />
            <Button
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                className="p-button-sm"
                onClick={() => onDelete(rowData)}
                tooltip="Delete"
            />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Division Inventory</span>

            <div className="flex gap-2">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            setGlobalFilterValue(value);
                            onGlobalFilterChange(value);
                        }}
                        placeholder="Search"
                    />
                </span>
            </div>
        </div>
    );

    return (
        <div>
            <ConfirmDialog />

            <DataTable
                value={divisions}
                selection={selectedDivisions}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                rows={10}
                loading={loading}
                emptyMessage="No divisions found."
                filters={filters}
                globalFilterFields={["name", "description"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} divisions"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="name" header="Division Name" style={{ width: "200px" }} sortable />
                <Column field="description" header="Description" body={descriptionBodyTemplate} sortable />
                <Column 
                    field="created_at" 
                    header="Created Date" 
                    body={(rowData) => dateBodyTemplate(rowData, 'created_at')} 
                    sortable 
                />
                <Column 
                    field="updated_at" 
                    header="Updated Date" 
                    body={(rowData) => dateBodyTemplate(rowData, 'updated_at')} 
                    sortable 
                />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default DivisionTable;