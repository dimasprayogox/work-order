"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

// Mock Data for demonstration purposes
let mockUsers = [
    { id: '1', username: 'admin', email: 'admin@example.com', full_name: 'Admin User', role: 'admin', is_active: true, created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:00:00Z' },
    { id: '2', username: 'john.doe', email: 'john.doe@example.com', full_name: 'John Doe', role: 'user', is_active: true, created_at: '2023-02-15T11:30:00Z', updated_at: '2023-02-15T11:30:00Z' },
    { id: '3', username: 'jane.smith', email: 'jane.smith@example.com', full_name: 'Jane Smith', role: 'user', is_active: false, created_at: '2023-03-20T14:00:00Z', updated_at: '2023-03-20T14:00:00Z' },
    { id: '4', username: 'peter.jones', email: 'peter.jones@example.com', full_name: 'Peter Jones', role: 'editor', is_active: true, created_at: '2023-04-10T09:00:00Z', updated_at: '2023-04-10T09:00:00Z' },
    { id: '5', username: 'susan.white', email: 'susan.white@example.com', full_name: 'Susan White', role: 'user', is_active: true, created_at: '2023-05-01T16:00:00Z', updated_at: '2023-05-01T16:00:00Z' },
];

// Helper to generate UUIDs for mock data
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Header for DataTable (Search and Role Filter)
const HeaderDataTable = ({ search, roleFilter, setSearch, setRoleFilter, roleOptions }) => (
    <div className="flex align-items-center justify-content-between gap-2 flex-wrap">
        <div>
            <span className="text-xl font-bold mr-3">Users</span>
            <Dropdown
                placeholder="Filter Role"
                value={roleFilter}
                options={roleOptions}
                onChange={(e) => setRoleFilter(e.value)}
                className="w-full sm:w-auto"
            />
        </div>
        <InputText
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-inputtext-sm w-full sm:w-auto"
        />
    </div>
);

// Custom body template for Role column
const RoleBodyTemplate = (rowData) => {
    let bgClass = "";
    let textColorClass = "";
    switch (rowData.role) {
        case "admin":
            bgClass = "bg-purple-100";
            textColorClass = "text-purple-800";
            break;
        case "editor":
            bgClass = "bg-yellow-100";
            textColorClass = "text-yellow-800";
            break;
        case "user":
        default:
            bgClass = "bg-blue-100";
            textColorClass = "text-blue-800";
            break;
    }
    return (
        <span className={`px-2 py-1 text-sm rounded-md font-medium ${bgClass} ${textColorClass}`}>
            {rowData.role}
        </span>
    );
};

// Custom body template for Is Active column
const ActiveBodyTemplate = (rowData) => {
    return rowData.is_active ? (
        <i className="pi pi-check-circle text-green-500 text-xl" />
    ) : (
        <i className="pi pi-times-circle text-red-500 text-xl" />
    );
};

// Main UserAdminPage Component
const UserAdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormDialogVisible, setIsFormDialogVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // For edit operation
    const [selectedUsers, setSelectedUsers] = useState([]); // For bulk delete
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    const toast = useRef(null); // Ref for PrimeReact Toast

    const roleOptions = ["", "admin", "editor", "user"]; // Options for role filter dropdown

    // Form data state for Add/Edit User Dialog
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        is_active: true,
    });
    const [formErrors, setFormErrors] = useState({});

    // Simulate API calls
    const fetchUsers = () => {
        setLoading(true);
        setTimeout(() => {
            setUsers([...mockUsers]); // Create a copy to ensure state update
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showToast = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    // Handlers for Add/Edit User Dialog
    const openNewUserDialog = () => {
        setCurrentUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            full_name: '',
            role: 'user',
            is_active: true,
        });
        setFormErrors({});
        setIsFormDialogVisible(true);
    };

    const openEditUserDialog = (user) => {
        setCurrentUser(user);
        setFormData({
            username: user.username || '',
            email: user.email || '',
            password: '', // Password is not pre-filled for security
            full_name: user.full_name || '',
            role: user.role || 'user',
            is_active: user.is_active ?? true,
        });
        setFormErrors({});
        setIsFormDialogVisible(true);
    };

    const hideFormDialog = () => {
        setIsFormDialogVisible(false);
    };

    const onFormInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Username is required.';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid.';
        }
        if (!currentUser && !formData.password.trim()) newErrors.password = 'Password is required for new users.';
        if (formData.password.trim() && formData.password.trim().length < 6) newErrors.password = 'Password must be at least 6 characters.';
        if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required.';

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveUser = () => {
        if (!validateForm()) {
            showToast('error', 'Validation Error', 'Please correct the form errors.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            if (currentUser) {
                // Update user
                mockUsers = mockUsers.map((user) =>
                    user.id === currentUser.id
                        ? {
                            ...user,
                            ...formData,
                            password: formData.password || user.password, // Keep old password if new one is empty
                            updated_at: new Date().toISOString(),
                        }
                        : user
                );
                showToast('success', 'Success', 'User updated successfully!');
            } else {
                // Create new user
                const newUser = {
                    id: uuidv4(),
                    ...formData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                mockUsers.push(newUser);
                showToast('success', 'Success', 'User created successfully!');
            }
            fetchUsers(); // Re-fetch to update UI
            setLoading(false);
            hideFormDialog();
        }, 500);
    };

    // Handlers for Delete operations
    const confirmDeleteSelected = () => {
        confirmDialog({
            message: 'Are you sure you want to delete the selected users?',
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: deleteSelectedUsers,
            reject: () => showToast('info', 'Cancelled', 'Deletion cancelled.'),
        });
    };

    const deleteSelectedUsers = () => {
        setLoading(true);
        setTimeout(() => {
            const selectedIds = selectedUsers.map(u => u.id);
            mockUsers = mockUsers.filter((user) => !selectedIds.includes(user.id));
            showToast('success', 'Success', 'Selected users deleted successfully!');
            setSelectedUsers([]); // Clear selection
            fetchUsers();
            setLoading(false);
        }, 500);
    };

    const confirmDeleteUser = (user) => {
        confirmDialog({
            message: `Are you sure you want to delete user ${user.username}?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => deleteUser(user.id),
            reject: () => showToast('info', 'Cancelled', 'Deletion cancelled.'),
        });
    };

    const deleteUser = (id) => {
        setLoading(true);
        setTimeout(() => {
            mockUsers = mockUsers.filter((user) => user.id !== id);
            showToast('success', 'Success', 'User deleted successfully!');
            fetchUsers();
            setLoading(false);
        }, 500);
    };

    // Filtered data based on search and role filter
    const filteredUsers = users.filter((user) => {
        const matchesRole = roleFilter === "" || user.role === roleFilter;
        const matchesSearch =
            search === "" ||
            user.username.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.full_name.toLowerCase().includes(search.toLowerCase());
        return matchesRole && matchesSearch;
    });

    // Action buttons for each row
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    className="p-button-sm"
                    onClick={() => openEditUserDialog(rowData)}
                    tooltip="Edit User"
                    tooltipOptions={{ position: 'bottom' }}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    outlined
                    severity="danger"
                    className="p-button-sm"
                    onClick={() => confirmDeleteUser(rowData)}
                    tooltip="Delete User"
                    tooltipOptions={{ position: 'bottom' }}
                />
            </div>
        );
    };

    // Footer for the form dialog
    const formDialogFooter = (
        <div className="flex justify-end gap-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                outlined
                onClick={hideFormDialog}
            />
            <Button
                label={currentUser ? "Update" : "Create"}
                icon="pi pi-check"
                onClick={saveUser}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="card p-6 rounded-lg shadow-xl bg-white m-4">
                <h3 className="text-3xl font-bold text-gray-800 mb-6">User Administration</h3>

                <div className="flex flex-wrap gap-3 mb-6">
                    <Button
                        size="small"
                        label="New User"
                        icon="pi pi-plus"
                        severity="success"
                        onClick={openNewUserDialog}
                        className="p-button-sm p-button-raised"
                    />
                    <Divider layout="vertical" className="hidden sm:block" />
                    <Button
                        size="small"
                        label="Delete Selected"
                        icon="pi pi-trash"
                        severity="danger"
                        onClick={confirmDeleteSelected}
                        disabled={selectedUsers.length === 0}
                        className="p-button-sm p-button-raised"
                    />
                    {/* Placeholder buttons - can be made functional if needed */}
                    <Divider layout="vertical" className="hidden sm:block" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined className="p-button-sm" disabled />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined className="p-button-sm" disabled />
                    <Button size="small" label="Print" icon="pi pi-print" outlined className="p-button-sm" disabled />
                </div>

                <DataTable
                    className="my-3 p-datatable-gridlines"
                    value={filteredUsers}
                    selection={selectedUsers}
                    onSelectionChange={(e) => setSelectedUsers(e.value)}
                    dataKey="id"
                    loading={loading}
                    header={<HeaderDataTable
                        search={search}
                        roleFilter={roleFilter}
                        setSearch={setSearch}
                        setRoleFilter={setRoleFilter}
                        roleOptions={roleOptions}
                    />}
                    rows={10}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    paginator
                    sortMode="single" // Enable single column sorting
                    sortField="username" // Default sort field
                    sortOrder={1} // Default sort order (1 for ascending, -1 for descending)
                    emptyMessage="No users found."
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column header="ID" field="id" sortable />
                    <Column header="Username" field="username" sortable />
                    <Column header="Email" field="email" sortable />
                    <Column header="Full Name" field="full_name" sortable />
                    <Column header="Role" field="role" body={RoleBodyTemplate} sortable />
                    <Column header="Active" field="is_active" body={ActiveBodyTemplate} sortable />
                    <Column header="Actions" body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} />
                </DataTable>

                {/* Add/Edit User Dialog */}
                <Dialog
                    header={currentUser ? "Edit User" : "Add New User"}
                    visible={isFormDialogVisible}
                    style={{ width: "50vw" }}
                    breakpoints={{ '960px': '75vw', '641px': '100vw' }}
                    modal
                    className="p-fluid"
                    onHide={hideFormDialog}
                    footer={formDialogFooter}
                >
                    <div className="p-field mb-4">
                        <label htmlFor="username" className="font-bold mb-2 block">Username</label>
                        <InputText
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={onFormInputChange}
                            required
                            autoFocus
                            className={formErrors.username ? 'p-invalid' : ''}
                        />
                        {formErrors.username && <small className="p-error">{formErrors.username}</small>}
                    </div>

                    <div className="p-field mb-4">
                        <label htmlFor="email" className="font-bold mb-2 block">Email</label>
                        <InputText
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={onFormInputChange}
                            required
                            type="email"
                            className={formErrors.email ? 'p-invalid' : ''}
                        />
                        {formErrors.email && <small className="p-error">{formErrors.email}</small>}
                    </div>

                    <div className="p-field mb-4">
                        <label htmlFor="password" className="font-bold mb-2 block">Password {currentUser ? '(Leave blank to keep current)' : ''}</label>
                        <InputText
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={onFormInputChange}
                            type="password"
                            className={formErrors.password ? 'p-invalid' : ''}
                        />
                        {formErrors.password && <small className="p-error">{formErrors.password}</small>}
                    </div>

                    <div className="p-field mb-4">
                        <label htmlFor="full_name" className="font-bold mb-2 block">Full Name</label>
                        <InputText
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={onFormInputChange}
                            required
                            className={formErrors.full_name ? 'p-invalid' : ''}
                        />
                        {formErrors.full_name && <small className="p-error">{formErrors.full_name}</small>}
                    </div>

                    <div className="p-field mb-4">
                        <label htmlFor="role" className="font-bold mb-2 block">Role</label>
                        <Dropdown
                            id="role"
                            name="role"
                            value={formData.role}
                            options={roleOptions.filter(opt => opt !== "")} // Exclude empty option for form
                            onChange={onFormInputChange}
                            placeholder="Select a Role"
                        />
                    </div>

                    <div className="p-field-checkbox flex items-center mb-4">
                        <Checkbox
                            inputId="is_active"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={onFormInputChange}
                        />
                        <label htmlFor="is_active" className="ml-2">Is Active</label>
                    </div>
                </Dialog>
            </div>
        </>
    );
};

export default UserAdminPage;
