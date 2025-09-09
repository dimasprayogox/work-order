"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dropdown } from "primereact/dropdown";

const roleFilterOptions = [
    { label: "All Roles", value: null },
    { label: "Admin", value: "admin" },
    { label: "Manager", value: "manager" },
    { label: "Technician", value: "technician" },
    { label: "Logistic", value: "logistic" },
    { label: "Employee", value: "employee" }
];

const UserTable = ({ users, loading, onEdit, onDelete, selectedUsers = [], onSelectionChange = () => {}, onSearch = () => {}, searchText = "" }) => {
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        role: { value: null, matchMode: FilterMatchMode.EQUALS }
    });

    const [globalFilterValue, setGlobalFilterValue] = useState(searchText);
    const [roleFilterValue, setRoleFilterValue] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [currentFirst, setCurrentFirst] = useState(0);
    const [currentRows, setCurrentRows] = useState(10);

    // useEffect yang diperbaiki mengikuti pola MachineCategoryTable
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

    const onRoleFilterChange = (e) => {
        const { value } = e;
        setRoleFilterValue(value);

        const _filters = { ...filters };
        _filters["role"].value = value;
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
             let filteredData = users;
             const globalFilter = filters.global.value;
             const roleFilter = filters.role.value;

             // Apply global search filter
             if (globalFilter) {
                 const lowerCaseFilter = globalFilter.toLowerCase();
                 const globalFilterFields = ["username", "full_name", "email", "role", "division.name"];
                 filteredData = filteredData.filter((user) => {
                     return globalFilterFields.some((field) => {
                         const value = field.includes(".") ? user[field.split(".")[0]]?.[field.split(".")[1]] : user[field];
                         return value && value.toString().toLowerCase().includes(lowerCaseFilter);
                     });
                 });
             }

             // Apply role filter on top of the search results
             if (roleFilter) {
                 filteredData = filteredData.filter((user) => user.role === roleFilter);
             }

             const visibleData = filteredData.slice(currentFirst, currentFirst + currentRows);
             onSelectionChange(visibleData);
         } else {
             onSelectionChange([]);
         }
     };

    const roleBodyTemplate = (rowData) => {
        const roleColors = {
            admin: "danger",
            manager: "warning",
            technician: "info",
            logistics: "success",
            employee: "secondary"
        };

        return <Tag value={rowData.role} severity={roleColors[rowData.role] || "secondary"} className="text-sm" />;
    };

    const statusBodyTemplate = (rowData) => <Tag value={rowData.is_active ? "Active" : "Inactive"} severity={rowData.is_active ? "success" : "danger"} className="text-sm" />;

    const createdAtBodyTemplate = (rowData) => {
        return new Date(rowData.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const divisionBodyTemplate = (rowData) => {
        return rowData.division?.name || "-";
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onEdit(rowData)} tooltip="Edit" />
            <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Users Management</span>

            <div className="flex flex-wrap gap-2">
                <Dropdown value={roleFilterValue} options={roleFilterOptions} onChange={onRoleFilterChange} placeholder="All Role" className="w-full sm:w-auto" />
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
                value={users}
                selection={selectedUsers}
                selectAll={selectAll}
                onSelectAllChange={handleSelectAllChange}
                onSelectionChange={(e) => onSelectionChange(e.value)}
                onPage={onPageChange}
                first={currentFirst}
                rows={currentRows}
                dataKey="id"
                paginator
                loading={loading}
                emptyMessage="No users found."
                filters={filters}
                globalFilterFields={["username", "full_name", "email", "role", "division.name"]}
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
                <Column field="full_name" header="Full Name" style={{ minWidth: "13rem" }} sortable />
                <Column field="email" header="Email" style={{ width: "200px" }} sortable />
                <Column field="division" header="Division" className="text-sm" body={divisionBodyTemplate} style={{ minWidth: "10rem" }} sortable />
                <Column field="role" header="Role" body={roleBodyTemplate} style={{ width: "120px" }} sortable />
                <Column field="is_active" header="Status" body={statusBodyTemplate} style={{ width: "100px" }} sortable />
                <Column field="created_at" header="Created" body={createdAtBodyTemplate} style={{ minWidth: "10rem" }} sortable />
                <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: "8rem" }} />
            </DataTable>
        </div>
    );
};

export default UserTable;
