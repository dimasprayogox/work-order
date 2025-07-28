"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { useState, useEffect } from "react";
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
    const [globalFilterValue, setGlobalFilterValue] = useState("");

    useEffect(() => {
        setGlobalFilterValue(searchText);
        onGlobalFilterChange(searchText);
    }, [searchText]);

    const onGlobalFilterChange = (value) => {
        let _filters = { ...filters };
        _filters["global"].value = value;
        setFilters(_filters);
        onSearch(value);
    };

    const handleSelectionChange = (e) => {
        onSelectionChange(e.value);
    };

    const getStatusSeverity = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'info';
            case 'rejected':
                return 'danger';
            case 'fulfilled':
                return 'success';
            default:
                return 'secondary';
        }
    };

    const statusBodyTemplate = (rowData) => (
        <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
    );

    const priorityBodyTemplate = (rowData) => {
        const priority = rowData.priority || 'normal';
        const severity = priority === 'urgent' ? 'danger' : priority === 'high' ? 'warning' : 'info';
        return <Tag value={priority} severity={severity} />;
    };

    const dateBodyTemplate = (rowData) => {
        return new Date(rowData.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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
                            setGlobalFilterValue(e.target.value);
                            onGlobalFilterChange(e.target.value);
                        }}
                        placeholder="Search"
                    />
                </span>
            </div>
        </div>
    );

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
                    style={{ width: "100px" }}
                    sortable
                />
                <Column
                    field="priority"
                    header="Priority"
                    body={priorityBodyTemplate}
                    style={{ width: "100px" }}
                    sortable
                />
                <Column
                    field="work_order_id"
                    header="Work Order"
                    style={{ width: "120px" }}
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
                    style={{ width: "120px" }}
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
