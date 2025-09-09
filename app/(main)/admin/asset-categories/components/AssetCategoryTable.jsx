// app/(main)/admin/asset-categories/components/AssetCategoryTable.jsx
"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Badge } from "primereact/badge";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Tooltip } from "primereact/tooltip";

const AssetCategoryTable = ({ categories, loading, onEdit, onDelete, selectedCategories = [], onSelectionChange = () => {}, onSearch = () => {}, searchText = "" }) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);
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

    const onPageChange = (e) => {
        setCurrentFirst(e.first);
        setCurrentRows(e.rows);
    };

    const handleSelectAllChange = (e) => {
        const checked = e.checked;
        setSelectAll(checked); // Memperbarui state selectAll secara manual

        if (checked) {
            // Filter data sesuai dengan global filter saat ini
            let filteredData = categories;
            const filterValue = filters.global.value;

            if (filterValue) {
                const lowerCaseFilter = filterValue.toLowerCase();
                filteredData = categories.filter((category) => category.name?.toLowerCase().includes(lowerCaseFilter) || category.description?.toLowerCase().includes(lowerCaseFilter));
            }

            // Ambil hanya data yang terlihat di halaman saat ini
            const visibleData = filteredData.slice(currentFirst, currentFirst + currentRows);
            onSelectionChange(visibleData);
        } else {
            // Jika tidak dicentang, kosongkan seleksi
            onSelectionChange([]);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const descriptionBodyTemplate = (rowData) => {
        if (!rowData.description) return <span className="text-gray-400 italic">No description</span>;

        const maxLength = 100;
        if (rowData.description.length <= maxLength) {
            return rowData.description;
        }

        return <span title={rowData.description}>{rowData.description.substring(0, maxLength)}...</span>;
    };

    const assetsCountBodyTemplate = (rowData) => {
        const count = rowData.assets?.length || 0;

        return (
            <div className="flex align-items-center gap-1">
                <span className={count > 0 ? "text-blue-700 font-bold" : "text-red-500"}>{count}</span>
                {count > 0 && <span className={`w-2 h-2 rounded-full ${count > 10 ? "bg-green-500" : count > 5 ? "bg-blue-500" : "bg-yellow-500"}`}></span>}
            </div>
        );
    };

    const dateBodyTemplate = (rowData, field) => {
        const date = rowData[field];
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onEdit(rowData)} tooltip="Edit" />
            <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Asset Category Inventory</span>

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
                value={categories}
                selection={selectedCategories}
                selectAll={selectAll}
                onSelectAllChange={handleSelectAllChange}
                onSelectionChange={(e) => onSelectionChange(e.value)}
                onPage={onPageChange}
                first={currentFirst}
                rows={currentRows}
                dataKey="id"
                paginator
                loading={loading}
                emptyMessage="No asset categories found."
                filters={filters}
                globalFilterFields={["name", "description"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} categories"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="name" header="Category Name" style={{ width: "200px" }} sortable />
                <Column
                    field="description"
                    header="Description"
                    sortable
                    body={(rowData) => (
                        <>
                            <Tooltip target={`.description-tooltip-${rowData.id}`} position="bottom" />
                            <span
                                className={`text-sm description-tooltip-${rowData.id}`}
                                data-pr-tooltip={rowData.description}
                                style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block",
                                    maxWidth: "200px"
                                }}
                            >
                                {rowData.description}
                            </span>
                        </>
                    )}
                />
                <Column field="assets" header="Assets Count" body={assetsCountBodyTemplate} style={{ width: "120px" }} sortable />
                <Column field="created_at" header="Created" body={(rowData) => dateBodyTemplate(rowData, "created_at")} sortable style={{ minWidth: "10rem" }} />
                <Column field="updated_at" header="Updated" body={(rowData) => dateBodyTemplate(rowData, "updated_at")} sortable style={{ minWidth: "10rem" }} />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default AssetCategoryTable;
