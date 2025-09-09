// app/(main)/issues/components/IssueTable.jsx
"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog } from "primereact/confirmdialog";
import { motion } from "framer-motion";
import { Tooltip } from "primereact/tooltip";
import { Dropdown } from "primereact/dropdown";

const statusFilterOptions = [
    { label: "All Statuses", value: null },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "resolved" }
];

const IssueTable = ({ issues, loading, onEdit, onDelete, onDetail, selectedIssues = [], onSelectionChange = () => {}, onSearch = () => {}, searchText = "" }) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS },
        repairable: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);
    const [statusFilterValue, setStatusFilterValue] = useState(null);
    const [repairableFilterValue, setRepairableFilterValue] = useState(null);
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
        const _filters = { ...filters };
        _filters["global"].value = value;
        setFilters(_filters);
        onSearch(value);
    };

    const onStatusFilterChange = (e) => {
        const { value } = e;
        setStatusFilterValue(value);
        const _filters = { ...filters };
        _filters["status"].value = value;
        setFilters(_filters);
    };

    const onRepairableFilterChange = (e) => {
        const { value } = e;
        setRepairableFilterValue(value);
        const _filters = { ...filters };

        // Special handling for the 'waiting' (null) case
        if (value === "waiting") {
            _filters["repairable"].value = null;
        } else {
            _filters["repairable"].value = value;
        }
        setFilters(_filters);
    };

    const normalizeRepairable = (val) => {
        if (val === null || val === undefined) return null;
        if (typeof val === "boolean") return val;
        const s = String(val).toLowerCase();
        if (s === "1" || s === "true" || s === "t") return true;
        if (s === "0" || s === "false" || s === "f") return false;
        return null;
    };

    const onPageChange = (e) => {
        setCurrentFirst(e.first);
        setCurrentRows(e.rows);
    };

    const handleSelectAllChange = (e) => {
        const checked = e.checked;
        setSelectAll(checked);

        if (checked) {
            let filteredData = issues;
            const globalFilter = filters.global.value;
            const statusFilter = filters.status.value;
            const repairableFilter = filters.repairable.value;

            // Apply global filter
            if (globalFilter) {
                const lowerCaseFilter = globalFilter.toLowerCase();
                const fields = ["title", "description", "machine.name", "asset.name", "status"];
                filteredData = filteredData.filter((issue) =>
                    fields.some((field) => {
                        const value = field.includes(".") ? issue[field.split(".")[0]]?.[field.split(".")[1]] : issue[field];
                        return value && value.toString().toLowerCase().includes(lowerCaseFilter);
                    })
                );
            }

            // Apply status filter
            if (statusFilter !== null) {
                filteredData = filteredData.filter((issue) => issue.status === statusFilter);
            }

            // Apply repairable filter
            if (repairableFilter !== null) {
                filteredData = filteredData.filter((issue) => {
                    const raw = issue.workOrder?.repairable ?? issue.repairable ?? issue.work_order?.repairable;
                    return normalizeRepairable(raw) === repairableFilter;
                });
            }

            const visibleData = filteredData.slice(currentFirst, currentFirst + currentRows);
            onSelectionChange(visibleData);
        } else {
            onSelectionChange([]);
        }
    };

    const statusBodyTemplate = (rowData) => {
        const statusMap = {
            open: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
            resolved: { label: "Completed", color: "bg-green-100 text-green-800" }
        };
        const status = statusMap[rowData.status] || { label: rowData.status, color: "bg-gray-100 text-gray-800" };
        return <Tag value={status.label} className={status.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
    };

    const repairableBodyTemplate = (rowData) => {
        const raw = rowData.workOrder?.repairable ?? rowData.repairable ?? rowData.work_order?.repairable;
        const val = normalizeRepairable(raw);

        const repairableMap = {
            true: { label: "Repairable", color: "bg-green-100 text-green-800" },
            false: { label: "Not Repairable", color: "bg-red-100 text-red-800" },
            null: { label: "waiting", color: "bg-gray-100 text-gray-700" }
        };

        const config = repairableMap[val] || repairableMap.null;

        return <Tag value={config.label} className={config.color} style={{ minWidth: "100px", display: "inline-flex", justifyContent: "center" }} />;
    };

    const machineOrAssetBodyTemplate = (rowData) => {
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
        } else if (rowData.asset) {
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
        return <span className="text-gray-500">N/A</span>;
    };

    const priorityBodyTemplate = (rowData) => {
        const priority = rowData.workOrder?.priority || "medium";
        const priorityConfig = {
            high: { label: "High", color: "bg-red-100 text-red-800" },
            medium: { label: "Medium", color: "bg-orange-100 text-orange-800" },
            low: { label: "Low", color: "bg-yellow-100 text-yellow-800" }
        };

        const config = priorityConfig[priority] || { label: priority, color: "bg-gray-100 text-gray-800" };
        return <Tag value={config.label} className={config.color} />;
    };

    const photoBodyTemplate = (rowData) => {
        if (rowData.photo_url) {
            return <Image src={rowData.photo_url} alt="Issue Photo" width="50" height="50" preview className="border-round" />;
        }
        return <span className="text-gray-400">No photo</span>;
    };

    const dateBodyTemplate = (field) => {
        return (rowData) => {
            if (!rowData[field]) return "N/A";
            return new Date(rowData[field]).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        };
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-eye" rounded outlined className="p-button-sm" onClick={() => onDetail(rowData)} tooltip="View Detail" />
            <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onEdit(rowData)} tooltip="Edit" />
            <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" disabled={rowData.status !== "open"} />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Issue Management</span>

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
                value={issues}
                selection={selectedIssues}
                onSelectionChange={(e) => onSelectionChange(e.value)}
                selectAll={selectAll}
                onSelectAllChange={handleSelectAllChange}
                onPage={onPageChange}
                first={currentFirst}
                rows={currentRows}
                dataKey="id"
                paginator
                loading={loading}
                emptyMessage="No issues found."
                filters={filters}
                globalFilterFields={["title", "description", "machine.name", "asset.name", "status"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} issues"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column
                    field="title"
                    header="Title"
                    sortable
                    style={{ minWidth: "15rem" }}
                    body={(rowData) => (
                        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                            {rowData.title}
                        </motion.div>
                    )}
                />
                <Column field="target" header="Machine/Asset" body={machineOrAssetBodyTemplate} style={{ minWidth: "180px" }} sortable />
                <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
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
                <Column field="status" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: "8rem" }} />
                <Column header="Repairable" body={repairableBodyTemplate} style={{ width: "160px", textAlign: "center" }} />
                <Column field="photo_url" header="Photo" body={photoBodyTemplate} style={{ width: "80px" }} />
                <Column
                    field="notes"
                    header="Tech Notes"
                    sortable
                    body={(rowData) => (
                        <>
                            <Tooltip target={`.notes-tooltip-${rowData.id}`} position="bottom" />
                            <span
                                className={`text-sm notes-tooltip-${rowData.id}`}
                                data-pr-tooltip={rowData.workOrder?.notes}
                                style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block",
                                    maxWidth: "200px"
                                }}
                            >
                                {rowData.workOrder?.notes}
                            </span>
                        </>
                    )}
                />
                <Column field="created_at" header="Created" body={dateBodyTemplate("created_at")} sortable style={{ minWidth: "12rem" }} />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "10rem" }} />
            </DataTable>
        </div>
    );
};

export default IssueTable;
