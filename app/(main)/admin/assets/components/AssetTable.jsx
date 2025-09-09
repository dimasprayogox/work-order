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
import { motion } from "framer-motion";
import { Dropdown } from "primereact/dropdown";

const statusFilterOptions = [
    { label: "All Statuses", value: null },
    { label: "Operational", value: "operational" },
    { label: "Maintenance", value: "maintenance" },
    { label: "Down", value: "down" }
];

const AssetTable = ({ assets, loading, onEdit, onDelete, selectedAssets = [], onSelectionChange = () => {}, onSearch = () => {}, searchText = "" }) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);
    const [statusFilterValue, setStatusFilterValue] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [currentFirst, setCurrentFirst] = useState(0);
    const [currentRows, setCurrentRows] = useState(10);

    useEffect(() => {
        setGlobalFilterValue(searchText);
        setFilters((prevFilters) => ({
            ...prevFilters,
            global: { ...prevFilters.global, value: searchText }
        }));
    }, [searchText]);

    const onGlobalFilterChange = (value) => {
        // Update filter DataTable secara lokal
        const _filters = { ...filters };
        _filters["global"].value = value;
        setFilters(_filters);

        // Informasikan ke parent component tentang perubahan search text
        onSearch(value);
    };

    const onStatusFilterChange = (e) => {
        const { value } = e;
        setStatusFilterValue(value);

        const _filters = { ...filters };
        _filters["status"].value = value;
        setFilters(_filters);
    };

    const onPageChange = (e) => {
        setCurrentFirst(e.first);
        setCurrentRows(e.rows);
    };

    const handleSelectAllChange = (e) => {
        const checked = e.checked;
        setSelectAll(checked);

        if (checked) {
            let filteredData = assets;
            const globalFilter = filters.global.value;
            const statusFilter = filters.status.value;

            // Terapkan filter pencarian global
            if (globalFilter) {
                const lowerCaseFilter = globalFilter.toLowerCase();
                const globalFilterFields = ["asset_code", "name", "location", "type", "category.name", "division.name"];
                filteredData = filteredData.filter((asset) => {
                    return globalFilterFields.some((field) => {
                        const value = field.includes(".") ? asset[field.split(".")[0]]?.[field.split(".")[1]] : asset[field];
                        return value && value.toString().toLowerCase().includes(lowerCaseFilter);
                    });
                });
            }

            // Terapkan filter status setelah filter pencarian
            if (statusFilter) {
                filteredData = filteredData.filter((asset) => asset.status === statusFilter);
            }

            const visibleData = filteredData.slice(currentFirst, currentFirst + currentRows);
            onSelectionChange(visibleData);
        } else {
            onSelectionChange([]);
        }
    };

    const statusBodyTemplate = (rowData) => {
        const getSeverity = (status) => {
            switch (status) {
                case "operational":
                    return "success";
                case "maintenance":
                    return "warning";
                case "down":
                    return "danger";
                default:
                    return null;
            }
        };

        const getStatusLabel = (status) => {
            switch (status) {
                case "operational":
                    return "Operational";
                case "maintenance":
                    return "Maintenance";
                case "down":
                    return "Down";
                default:
                    return status;
            }
        };

        return <Tag value={getStatusLabel(rowData.status)} severity={getSeverity(rowData.status)} />;
    };

    const categoryBodyTemplate = (rowData) => {
        return rowData.category?.name || "-";
    };

    const divisionBodyTemplate = (rowData) => {
        return rowData.division?.name || "-";
    };

    const typeBodyTemplate = (rowData) => {
        return rowData.type || "-";
    };

    const locationBodyTemplate = (rowData) => (
        <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }} className="font-medium text-blue-600 cursor-pointer">
            {rowData.location}
        </motion.span>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onEdit(rowData)} tooltip="Edit" />
            <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Asset Inventory</span>

            <div className="flex flex-wrap items-center gap-2">
                <Dropdown value={statusFilterValue} options={statusFilterOptions} onChange={onStatusFilterChange} placeholder="All Status" className="w-full sm:w-auto" />
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
                selectAll={selectAll}
                onSelectAllChange={handleSelectAllChange}
                onSelectionChange={(e) => onSelectionChange(e.value)}
                onPage={onPageChange}
                first={currentFirst}
                rows={currentRows}
                dataKey="id"
                paginator
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
                <Column field="asset_code" header="Asset Code" body={(rowData) => <Tag value={rowData.asset_code} className="bg-gray-100 text-gray-800 font-medium" />} style={{ minWidth: "8rem" }} />
                <Column field="name" header="Asset Name" sortable style={{ minWidth: "13rem" }} />
                <Column field="location" header="Location" body={locationBodyTemplate} style={{ minWidth: "10rem" }} sortable />

                <Column field="type" header="Type" body={typeBodyTemplate} sortable className="text-sm" style={{ minWidth: "8rem" }} />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column field="category" header="Category" body={categoryBodyTemplate} sortable className="text-sm" style={{ minWidth: "8rem" }} />
                <Column field="division" header="Division" body={divisionBodyTemplate} sortable className="text-sm" style={{ minWidth: "8rem" }} />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default AssetTable;
