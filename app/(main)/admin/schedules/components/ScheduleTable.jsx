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

const statusOptions = [
    { label: "All", value: null },
    { label: "Aktif", value: true },
    { label: "Nonaktif", value: false }
];

const ScheduleTable = ({
    schedules,
    loading,
    onEdit,
    onDelete,
    onDetail,
    selectedSchedules = [],
    onSelectionChange = () => {},
    onSearch = () => {},
    searchText = ""
}) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);
    const [statusFilter, setStatusFilter] = useState(null);

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

    const frequencyBodyTemplate = (rowData) => {
        const frequencyMap = {
            'daily': { label: 'Daily', severity: 'info', icon: 'pi pi-calendar' },
            'weekly': { label: 'Weekly', severity: 'success', icon: 'pi pi-calendar' },
            'monthly': { label: 'Monthly', severity: 'warning', icon: 'pi pi-calendar' },
            'yearly': { label: 'Yearly', severity: 'danger', icon: 'pi pi-calendar' }
        };

        const config = frequencyMap[rowData.frequency] || { label: rowData.frequency, severity: 'info', icon: 'pi pi-calendar' };

        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <Tag
                    value={<span className="flex align-items-center gap-1"><i className={config.icon}></i> {config.label}</span>}
                    severity={config.severity}
                    className="font-medium"
                />
            </motion.div>
        );
    };

    const priorityBodyTemplate = (rowData) => {
        const priorityMap = {
            'low': { label: 'Low', severity: 'success', icon: 'pi pi-arrow-down' },
            'medium': { label: 'Medium', severity: 'warning', icon: 'pi pi-minus' },
            'high': { label: 'High', severity: 'danger', icon: 'pi pi-arrow-up' }
        };

        const config = priorityMap[rowData.priority] || { label: rowData.priority, severity: 'info', icon: 'pi pi-minus' };

        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <Tag
                    value={<span className="flex align-items-center gap-1"><i className={config.icon}></i> {config.label}</span>}
                    severity={config.severity}
                    className="font-medium"
                />
            </motion.div>
        );
    };

    const machineBodyTemplate = (rowData) => {
        return (
            <div className="flex flex-column">
                <span className="font-medium">{rowData.machine?.name || '-'}</span>
                {rowData.machine?.machine_code && (
                    <small className="text-gray-500">{rowData.machine.machine_code}</small>
                )}
            </div>
        );
    };

    const dueDateBodyTemplate = (rowData) => {
        if (!rowData.next_due_date) return "N/A";

        const dueDate = new Date(rowData.next_due_date);
        const now = new Date();
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let severity = "info";
        let icon = "pi pi-calendar";

        if (diffDays < 0) {
            severity = "danger";
            icon = "pi pi-exclamation-triangle";
        } else if (diffDays <= 7) {
            severity = "warning";
            icon = "pi pi-clock";
        } else if (diffDays <= 30) {
            severity = "info";
            icon = "pi pi-calendar-clock";
        }

        const formattedDate = dueDate.toLocaleString("en-US", {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return (
            <div className="flex flex-column">
                <span className={`flex align-items-center gap-1 ${severity === 'danger' ? 'text-red-600' : severity === 'warning' ? 'text-yellow-600' : 'text-gray-700'}`}>
                    <i className={icon}></i>
                    {formattedDate}
                </span>
                <small className={`${severity === 'danger' ? 'text-red-500' : severity === 'warning' ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {diffDays < 0 ? `Overdue by ${Math.abs(diffDays)} days` :
                     diffDays === 0 ? 'Due today' :
                     diffDays === 1 ? 'Due tomorrow' :
                     `Due in ${diffDays} days`}
                </small>
            </div>
        );
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

    const createdByBodyTemplate = (rowData) => {
        return (
            <div className="flex align-items-center gap-2">
                <i className="pi pi-user text-gray-500"></i>
                <span>{rowData.createdBy?.full_name || 'Unknown'}</span>
            </div>
        );
    };

    const statusBodyTemplate = (rowData) => (
        <Tag
            value={rowData.is_active ? "Aktif" : "Nonaktif"}
            severity={rowData.is_active ? "success" : "danger"}
            className="font-medium"
        />
    );

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
            />
        </div>
    );

    // Filter schedules by status
    const filteredSchedules = statusFilter === null
        ? schedules
        : schedules.filter(s => {
            // Pastikan is_active boolean
            const isActive = typeof s.is_active === "boolean"
                ? s.is_active
                : Boolean(Number(s.is_active));
            return isActive === statusFilter;
        });

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Maintenance Schedules</span>
            <div className="flex gap-2">
                <Dropdown
                    value={statusFilter}
                    options={statusOptions}
                    onChange={e => setStatusFilter(e.value)}
                    placeholder="Status"
                    className="w-10rem"
                />
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
                value={filteredSchedules}
                selection={selectedSchedules}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                rows={10}
                loading={loading}
                emptyMessage="No schedules found."
                filters={filters}
                globalFilterFields={["title", "machine.name", "frequency", "priority"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} schedules"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="title" header="Title" style={{ width: "200px" }} sortable />
                <Column field="machine" header="Machine" body={machineBodyTemplate} sortable />
                <Column field="frequency" header="Frequency" body={frequencyBodyTemplate} sortable />
                <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
                <Column
                    field="is_active"
                    header="Status"
                    body={statusBodyTemplate}
                    style={{ width: "100px" }}
                    sortable
                />
                <Column
                    field="next_due_date"
                    header="Next Due Date"
                    body={dueDateBodyTemplate}
                    sortable
                    style={{ width: "180px" }}
                />
                <Column
                    field="createdBy"
                    header="Created By"
                    body={createdByBodyTemplate}
                    style={{ width: "150px" }}
                />
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

export default ScheduleTable;
