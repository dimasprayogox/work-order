// app/(main)/admin/assets/components/AssetTable.jsx
"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog } from "primereact/confirmdialog";

const AssetTable = ({
    assets,
    loading,
    onEdit,
    onDelete,
    selectedAssets = [],
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

    const statusBodyTemplate = (rowData) => {
        const getSeverity = (status) => {
            switch (status) {
                case 'operational':
                    return 'success';
                case 'maintenance':
                    return 'warning';
                case 'down':
                    return 'danger';
                case 'inactive':
                    return 'info';
                default:
                    return null;
            }
        };

        const getStatusLabel = (status) => {
            switch (status) {
                case 'operational':
                    return 'Operational';
                case 'maintenance':
                    return 'Maintenance';
                case 'down':
                    return 'Down';
                case 'inactive':
                    return 'Inactive';
                default:
                    return status;
            }
        };

        return <Tag value={getStatusLabel(rowData.status)} severity={getSeverity(rowData.status)} />;
    };

    const categoryBodyTemplate = (rowData) => {
        return rowData.category?.name || '-';
    };

    const divisionBodyTemplate = (rowData) => {
        return rowData.division?.name || '-';
    };

    const typeBodyTemplate = (rowData) => {
        return rowData.type || '-';
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
            <span className="text-xl font-bold">Asset Inventory</span>

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
                value={assets}
                selection={selectedAssets}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                rows={10}
                loading={loading}
                emptyMessage="No assets found."
                filters={filters}
                globalFilterFields={["asset_code", "name", "location", "type", "category.name", "division.name"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} assets"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="asset_code" header="Asset Code" style={{ width: "150px" }} sortable />
                <Column field="name" header="Asset Name" style={{ width: "200px" }} sortable />
                <Column field="location" header="Location" sortable />
                <Column field="type" header="Type" body={typeBodyTemplate} sortable />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column field="category" header="Category" body={categoryBodyTemplate} sortable />
                <Column field="division" header="Division" body={divisionBodyTemplate} sortable />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default AssetTable;