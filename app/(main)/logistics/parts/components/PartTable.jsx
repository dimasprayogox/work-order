"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, useEffect, useCallback } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { Tooltip } from "primereact/tooltip";

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

    const locationBodyTemplate = (rowData) => (
        <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }} className="font-medium text-blue-600 cursor-pointer">
            {rowData.location}
        </motion.span>
    );

    const stockBodyTemplate = (rowData) => {
        const isLowStock = rowData.quantity_in_stock <= rowData.min_stock;
        return <span className={isLowStock ? "text-red-500 font-bold" : ""}>{rowData.quantity_in_stock}</span>;
    };

    const machineOrAssetBodyTemplate = (rowData) => {
        // First check work order direct relations
        if (rowData.machine) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-cog text-blue-500"></i>
                        {rowData.machine.name}
                    </div>
                    {rowData.machine.machine_code && <div className="text-sm text-gray-500">{rowData.machine.machine_code}</div>}
                    <div className="text-xs text-blue-600">Machine</div>
                </div>
            );
        }

        if (rowData.asset) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-box text-green-500"></i>
                        {rowData.asset.name}
                    </div>
                    {rowData.asset.asset_code && <div className="text-sm text-gray-500">{rowData.asset.asset_code}</div>}
                    <div className="text-xs text-green-600">Asset</div>
                </div>
            );
        }

        // Then check issue relations
        if (rowData.issue) {
            if (rowData.issue.machine) {
                return (
                    <div>
                        <div className="font-medium flex align-items-center gap-2">
                            <i className="pi pi-cog text-blue-500"></i>
                            {rowData.issue.machine.name}
                        </div>
                        {rowData.issue.machine.machine_code && <div className="text-sm text-gray-500">{rowData.issue.machine.machine_code}</div>}
                        <div className="text-xs text-blue-600">Machine (from Issue)</div>
                    </div>
                );
            }

            if (rowData.issue.asset) {
                return (
                    <div>
                        <div className="font-medium flex align-items-center gap-2">
                            <i className="pi pi-box text-green-500"></i>
                            {rowData.issue.asset.name}
                        </div>
                        {rowData.issue.asset.asset_code && <div className="text-sm text-gray-500">{rowData.issue.asset.asset_code}</div>}
                        <div className="text-xs text-green-600">Asset (from Issue)</div>
                    </div>
                );
            }
        }

        return <span className="text-gray-500">N/A</span>;
    };

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
                globalFilterFields={["name", "part_number", "location", "asset.name", "machine.name", "description"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} parts"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="name" header="Part Name" style={{ minWidth: "180px" }} sortable />
                <Column field="part_number" header="Part Number" style={{ width: "150px" }} sortable body={(rowData) => <Tag value={rowData.part_number} className="bg-gray-100 text-gray-800 font-medium" />} />
                <Column field="target" header="Machine/Asset" body={machineOrAssetBodyTemplate} style={{ minWidth: "180px" }} sortable sortField="machine.name" />
                <Column field="quantity_in_stock" header="Stock" body={stockBodyTemplate} style={{ width: "80px" }} sortable />
                <Column field="min_stock" header="Min Stock" style={{ width: "80px" }} sortable />
                <Column field="location" header="Location" body={locationBodyTemplate} style={{ width: "120px" }} sortable />
                <Column
                    field="description"
                    header="Description"
                    sortable
                    body={(rowData) => (
                        <>
                            <Tooltip target={`.description-tooltip-${rowData.id}`} position="bottom" />
                            <span
                                className={`description-tooltip-${rowData.id}`}
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
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default PartTable;
