"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { FilterMatchMode } from "primereact/api";

const PartRequestTable = ({
    partRequests,
    loading,
    onViewDetail,
    onDelete,
    selectedRequests = [],
    onSelectionChange = () => {},
    onSearch = () => {},
    searchText = ""
}) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);

    // useEffect yang diperbaiki - sama seperti MachineCategoryTable
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

    // Consistent status template with motion animation like technician page
    const statusBodyTemplate = (rowData) => {
        const statusConfig = {
            'pending': { color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: 'pi-clock', severity: 'warning' },
            'approved': { color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: 'pi-spin pi-spinner', severity: 'info' },
            'fulfilled': { color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check-circle', severity: 'success' },
            'rejected': { color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: 'pi-times-circle', severity: 'danger' },
        };

        const config = statusConfig[rowData.status] || { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: 'pi-question', severity: 'secondary' };

        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{getStatusLabel(rowData.status)}</span>
                </div>
            </motion.div>
        );
    };

    // Consistent priority template with motion animation (low, medium, high only)
    const priorityBodyTemplate = (rowData) => {
        const priority = rowData.priority || 'medium';
        const priorityConfig = {
            'low': { color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', severity: 'success' },
            'medium': { color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', severity: 'info' },
            'high': { color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-800', severity: 'warning' },
        };

        const config = priorityConfig[priority] || priorityConfig['medium'];

        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <span className="font-medium">{getPriorityLabel(priority)}</span>
                </div>
            </motion.div>
        );
    };

    // WO Priority template (same as priorityBodyTemplate)
    const woPriorityBodyTemplate = (rowData) => {
        const priority = rowData.work_order_priority || 'medium';
        const priorityConfig = {
            'low': { color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', severity: 'success' },
            'medium': { color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', severity: 'info' },
            'high': { color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-800', severity: 'warning' },
        };
        const config = priorityConfig[priority] || priorityConfig['medium'];
        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <span className="font-medium">{getPriorityLabel(priority)}</span>
                </div>
            </motion.div>
        );
    };

    // Date template consistent with technician page
    const dateBodyTemplate = (rowData) => {
        if (!rowData.created_at) return "N/A";
        return new Date(rowData.created_at).toLocaleString("en-US", {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const itemsCountBodyTemplate = (rowData) => (
        <span className="font-semibold">{rowData.items_count || 0}</span>
    );

    const totalQuantityBodyTemplate = (rowData) => (
        <span className="font-semibold">{rowData.total_quantity || 0}</span>
    );

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-eye"
                rounded
                outlined
                className="p-button-sm"
                onClick={() => onViewDetail(rowData)}
                tooltip="View Detail"
                tooltipOptions={{ position: "top" }}
                severity="info"
            />
            <Button
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                className="p-button-sm"
                onClick={() => onDelete(rowData)}
                tooltip="Delete"
                tooltipOptions={{ position: "top" }}
                disabled={rowData.status !== 'pending'} // Consistent with technician page logic
            />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Part Requests</span>

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

    // Helper functions for consistent labeling
    const getStatusLabel = (status) => {
        const statusMap = {
            pending: "Pending",
            approved: "Approved",
            fulfilled: "Fulfilled",
            rejected: "Rejected",
        };
        return statusMap[status] || status;
    };

    const getPriorityLabel = (priority) => {
        const priorityMap = {
            low: "Low",
            medium: "Medium",
            high: "High",
        };
        return priorityMap[priority] || priority;
    };

    return (
        <div>
            <DataTable
                value={partRequests}
                selection={selectedRequests}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                rows={10}
                loading={loading}
                emptyMessage="No part requests found."
                filters={filters}
                globalFilterFields={["id", "requested_by", "status", "work_order_id", "note"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requests"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column
                    field="id"
                    header="Request ID"
                    style={{ width: "120px" }}
                    sortable
                />
                <Column
                    field="requested_by"
                    header="Requested By"
                    style={{ width: "150px" }}
                    sortable
                />
                <Column
                    field="status"
                    header="Status"
                    body={statusBodyTemplate}
                    style={{ width: "140px" }}
                    sortable
                />
                <Column
                    field="work_order_priority"
                    header="Priority"
                    body={woPriorityBodyTemplate}
                    style={{ width: "120px" }}
                    sortable
                />
                <Column
                    field="work_order_title"
                    header="Work Order"
                    style={{ width: "200px" }}
                    sortable
                />
                <Column
                    field="items_count"
                    header="Items"
                    body={itemsCountBodyTemplate}
                    style={{ width: "80px" }}
                    sortable
                />
                <Column
                    field="total_quantity"
                    header="Total Qty"
                    body={totalQuantityBodyTemplate}
                    style={{ width: "100px" }}
                    sortable
                />
                <Column
                    field="created_at"
                    header="Created Date"
                    body={dateBodyTemplate}
                    style={{ width: "150px" }}
                    sortable
                />
                <Column
                    header="Actions"
                    body={actionBodyTemplate}
                    style={{ minWidth: "8rem" }}
                />
            </DataTable>
        </div>
    );
};

export default PartRequestTable;
