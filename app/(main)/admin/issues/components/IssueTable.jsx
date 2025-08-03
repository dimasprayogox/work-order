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

const IssueTable = ({
    issues,
    loading,
    onEdit,
    onDelete,
    onDetail,
    selectedIssues = [],
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
        const _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        onSearch(value);
    };

    const handleSelectionChange = (e) => {
        onSelectionChange(e.value);
    };

    const statusBodyTemplate = (rowData) => {
        const statusConfig = {
            open:    { bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: 'pi-clock', label: 'Pending' },
            in_progress: { bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: 'pi-spin pi-spinner', label: 'In Progress' },
            resolved: { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check-circle', label: 'Resolved' },
            closed:  { bgColor: 'bg-gray-200', textColor: 'text-gray-800', icon: 'pi-lock', label: 'Closed' },
        };
        const config = statusConfig[rowData.status] || { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: 'pi-question', label: rowData.status };

        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{config.label}</span>
                </div>
            </motion.div>
        );
    };

    const machineBodyTemplate = (rowData) => {
        return rowData.machine?.name || '-';
    };

    const descriptionBodyTemplate = (rowData) => {
        const description = rowData.description || '';
        if (description.length > 50) {
            return (
                <span title={description}>
                    {description.substring(0, 50)}...
                </span>
            );
        }
        return description;
    };

    const photoBodyTemplate = (rowData) => {
        if (rowData.photo_url) {
            return (
                <Image
                    src={rowData.photo_url}
                    alt="Issue Photo"
                    width="50"
                    height="50"
                    preview
                    className="border-round"
                />
            );
        }
        return <span className="text-gray-400">No photo</span>;
    };

    const dateBodyTemplate = (field) => {
        return (rowData) => {
            if (!rowData[field]) return "N/A";
            return new Date(rowData[field]).toLocaleString("en-US", {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-eye"
                rounded
                outlined
                className="p-button-sm"
                onClick={() => onDetail(rowData)}
                tooltip="View Detail"
            />
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
                disabled={rowData.status !== 'open'}
            />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Issue Management</span>

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
                value={issues}
                selection={selectedIssues}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                rows={10}
                loading={loading}
                emptyMessage="No issues found."
                filters={filters}
                globalFilterFields={["title", "description", "machine.name", "status"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} issues"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="title" header="Title" style={{ width: "200px" }} sortable />
                <Column field="machine" header="Machine" body={machineBodyTemplate} sortable />
                <Column
                    field="description"
                    header="Description"
                    body={descriptionBodyTemplate}
                    style={{ width: "250px" }}
                />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column field="photo_url" header="Photo" body={photoBodyTemplate} style={{ width: "80px" }} />
                <Column
                    field="created_at"
                    header="Created"
                    body={dateBodyTemplate('created_at')}
                    sortable
                    style={{ width: "140px" }}
                />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "10rem" }} />
            </DataTable>
        </div>
    );
};

export default IssueTable;
