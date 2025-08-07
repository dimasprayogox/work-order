"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, useEffect, useCallback } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

const PartTable = ({ parts, loading, onEdit, onDelete, selectedParts = [], onSelectionChange = () => {}, onSearch, searchText }) => {
    const [filters, setFilters] = useState({
        global: { value: searchText || null, matchMode: FilterMatchMode.CONTAINS }
    });

    const [selectAll, setSelectAll] = useState(false);
    const [currentFirst, setCurrentFirst] = useState(0);
    const [currentRows, setCurrentRows] = useState(10);

    const onGlobalFilterChange = useCallback(
        (value) => {
            setFilters((prevFilters) => ({
                ...prevFilters,
                global: { ...prevFilters.global, value }
            }));
            setGlobalFilterValue(value);
            onSearch(value);
        },
        [onSearch]
    );

    useEffect(() => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            global: { ...prevFilters.global, value: searchText || null }
        }));
    }, [searchText]);

    const handleSelectionChange = (e) => {
        onSelectionChange(e.value);
    };

    const handleSelectAllChange = (e) => {
        const checked = e.checked;
        // Ambil data yang sesuai dengan filter global
        const filteredData = filters.global.value
            ? parts.filter((part) => {
                  const filterValue = filters.global.value.toLowerCase();
                  return part.name?.toLowerCase().includes(filterValue) || part.part_number?.toLowerCase().includes(filterValue) || part.location?.toLowerCase().includes(filterValue);
              })
            : parts;

        // Ambil data yang sedang ditampilkan di halaman saat ini
        const visibleData = filteredData.slice(currentFirst, currentFirst + currentRows);
        const selected = checked ? visibleData : [];

        setSelectAll(checked);
        onSelectionChange(selected);
    };

    const onPageChange = (e) => {
        setCurrentFirst(e.first);
        setCurrentRows(e.rows);
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onEdit(rowData)} tooltip="Edit" />
            <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Parts Inventory</span>
            <div className="flex gap-2">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText value={searchText} onChange={(e) => onSearch(e.target.value)} placeholder="Search" />{" "}
                </span>
            </div>
        </div>
    );

    return (
        <div>
            <ConfirmDialog />
            <DataTable
                selectAll={selectAll}
                onSelectAllChange={handleSelectAllChange}
                onPage={onPageChange}
                first={currentFirst}
                rows={currentRows}
                value={parts}
                selection={selectedParts}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                loading={loading}
                emptyMessage="No parts found."
                filters={filters}
                globalFilterFields={["name", "part_number", "location"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} parts"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="name" header="Part Name" style={{ width: "200px" }} sortable />
                <Column field="part_number" header="Part Number" sortable />
                <Column field="quantity_in_stock" header="Stock Quantity" sortable />
                <Column field="min_stock" header="Min Stock" sortable />
                <Column field="location" header="Location" sortable />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default PartTable;
