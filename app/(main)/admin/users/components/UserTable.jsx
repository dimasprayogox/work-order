"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog } from "primereact/confirmdialog";

const UserTable = ({
    users,
    loading,
    onEdit,
    onDelete,
    selectedUsers = [],
    onSelectionChange = () => {},
    onSearch = () => {},
    searchText = ""
}) => {
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);

    // useEffect yang diperbaiki mengikuti pola MachineCategoryTable
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

    const roleBodyTemplate = (rowData) => {
        const roleColors = {
            admin: "danger",
            manager: "warning",
            technician: "info",
            logistics: "success",
            employee: "secondary"
        };

        return (
            <Tag
                value={rowData.role}
                severity={roleColors[rowData.role] || "secondary"}
                className="text-sm"
            />
        );
    };

    const statusBodyTemplate = (rowData) => (
        <Tag
            value={rowData.is_active ? "Active" : "Inactive"}
            severity={rowData.is_active ? "success" : "danger"}
            className="text-sm"
        />
    );

    const createdAtBodyTemplate = (rowData) => {
        return new Date(rowData.created_at).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
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
            <span className="text-xl font-bold">Users Management</span>

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
                        placeholder="Search users..."
                    />
                </span>
            </div>
        </div>
    );

    return (
        <div>
            <ConfirmDialog />

            <DataTable
                value={users}
                selection={selectedUsers}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                rows={10}
                loading={loading}
                emptyMessage="No users found."
                filters={filters}
                globalFilterFields={["username", "full_name", "email", "role"]}
                className="border-round-lg"
                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
                rowsPerPageOptions={[5, 10, 25]}
                header={header}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="username" header="Username" style={{ width: "150px" }} sortable />
                <Column field="full_name" header="Full Name" style={{ width: "200px" }} sortable />
                <Column field="email" header="Email" style={{ width: "200px" }} sortable />
                <Column field="role" header="Role" body={roleBodyTemplate} style={{ width: "120px" }} sortable />
                <Column field="is_active" header="Status" body={statusBodyTemplate} style={{ width: "100px" }} sortable />
                <Column field="created_at" header="Created" body={createdAtBodyTemplate} style={{ width: "120px" }} sortable />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default UserTable;
