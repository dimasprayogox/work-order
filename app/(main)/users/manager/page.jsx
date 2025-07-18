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

// API endpoints remain the same as they manage all users
const API_ENDPOINTS = {
    USERS: '/api/admin/users',
};

// Replace with a valid JWT token for an 'admin' user
const AUTH_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VySWQiOiIxODBkNTVjNy00ODEwLTRiM2ItYjAyNC00YjkxMTIzOGQxOWEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTI4MjExNDEsImV4cCI6MTc1MjkwNzU0MX0.LTvNa5P_TQKfmDC3oe8PSYP571ZrbMTBrfFtpJEiX5PtGLOMo8z2prcwwHTSMis6aTzgDejsVwkbH_9A8zCjKw';

const HeaderDataTable = ({ search, roleFilter, setSearch, setRoleFilter, roleOptions }) => (
    <div className="flex align-items-center justify-content-between gap-2 flex-wrap">
        <div>
            <span className="text-xl font-bold mr-3">Managers</span> {/* Changed title */}
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
        case "technician":
            bgClass = "bg-green-100";
            textColorClass = "text-green-800";
            break;
        case "manager":
            bgClass = "bg-red-100";
            textColorClass = "text-red-800";
            break;
        case "logistics":
            bgClass = "bg-indigo-100";
            textColorClass = "text-indigo-800";
            break;
        case "employee":
            bgClass = "bg-gray-100";
            textColorClass = "text-gray-800";
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

const ActiveBodyTemplate = (rowData) => {
    return rowData.is_active ? (
        <i className="pi pi-check-circle text-green-500 text-xl" />
    ) : (
        <i className="pi pi-times-circle text-red-500 text-xl" />
    );
};

const ManagerAdminPage = () => {
    {/* Renamed the component */ }
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormDialogVisible, setIsFormDialogVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("manager"); // Default to filter by 'manager'

    const toast = useRef(null);

    // Only allow "manager" role for creation/editing in this dashboard
    const roleOptions = ["manager"];

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'manager', // Default role for new managers
        is_active: true,
    });
    const [formErrors, setFormErrors] = useState({});

    const showToast = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.USERS, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            // Filter users to only show 'manager' roles by default
            setUsers(result.data.filter(user => user.role === 'manager'));
            showToast('success', 'Success', result.message || 'Managers retrieved successfully!');
        } catch (err) {
            console.error("Failed to fetch managers:", err);
            showToast('error', 'Error', `Failed to retrieve managers: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openNewUserDialog = () => {
        setCurrentUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            full_name: '',
            role: 'manager', // Force 'manager' role for new users in this dashboard
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
            password: '',
            full_name: user.full_name || '',
            role: user.role || 'manager', // Maintain existing role, or default to 'manager'
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

        if (!currentUser && !formData.password.trim()) {
            newErrors.password = 'Password is required for new managers.';
        } else if (formData.password.trim() && formData.password.trim().length < 8) {
            newErrors.password = 'Password must be at least 8 characters.';
        }
        if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required.';

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveUser = async () => {
        if (!validateForm()) {
            showToast('error', 'Validation Error', 'Please correct the form errors.');
            return;
        }

        setLoading(true);
        try {
            let response;
            let url;
            let method;
            const payload = {
                username: formData.username,
                email: formData.email,
                full_name: formData.full_name,
                role: 'manager', // Always set role to 'manager' from this dashboard
                is_active: formData.is_active,
            };

            if (currentUser) {
                // Update user
                url = `${API_ENDPOINTS.USERS}/${currentUser.id}`;
                method = 'PUT';
                if (formData.password) {
                    payload.password = formData.password;
                }
            } else {
                // Create new user
                url = API_ENDPOINTS.USERS;
                method = 'POST';
                payload.password = formData.password;
            }

            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 400 && result.errors) {
                    const backendErrors = {};
                    for (const key in result.errors) {
                        backendErrors[key] = result.errors[key].join(', ');
                    }
                    setFormErrors(backendErrors);
                    showToast('error', 'Validation Failed', result.message || 'Please check the form for errors.');
                } else {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }
            } else {
                showToast('success', 'Success', result.message || `Manager ${currentUser ? 'updated' : 'created'} successfully!`);
                fetchUsers();
                hideFormDialog();
            }
        } catch (err) {
            console.error(`Failed to ${currentUser ? 'update' : 'create'} manager:`, err);
            showToast('error', 'Error', `Failed to ${currentUser ? 'update' : 'create'} manager: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteSelected = () => {
        if (selectedUsers.length === 0) {
            showToast('warn', 'No Selection', 'Please select managers to delete.');
            return;
        }
        confirmDialog({
            message: `Are you sure you want to delete ${selectedUsers.length} selected manager(s)?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: deleteSelectedUsers,
            reject: () => showToast('info', 'Cancelled', 'Deletion cancelled.'),
        });
    };

    const deleteSelectedUsers = async () => {
        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        const deletePromises = selectedUsers.map(async (user) => {
            try {
                const response = await fetch(`${API_ENDPOINTS.USERS}/${user.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AUTH_TOKEN}`,
                    },
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || `Failed to delete ${user.username}`);
                }
                successCount++;
                return { status: 'fulfilled', value: user.id };
            } catch (err) {
                console.error(`Error deleting manager ${user.username}:`, err);
                errorCount++;
                return { status: 'rejected', reason: err };
            }
        });

        await Promise.allSettled(deletePromises);

        if (successCount > 0) {
            showToast('success', 'Success', `${successCount} manager(s) deleted successfully.`);
        }
        if (errorCount > 0) {
            showToast('error', 'Error', `${errorCount} manager(s) failed to delete.`);
        }

        setSelectedUsers([]);
        fetchUsers();
        setLoading(false);
    };

    const confirmDeleteUser = (user) => {
        confirmDialog({
            message: `Are you sure you want to delete manager ${user.username}?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => deleteUser(user.id),
            reject: () => showToast('info', 'Cancelled', 'Deletion cancelled.'),
        });
    };

    const deleteUser = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.USERS}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                },
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            showToast('success', 'Success', result.message || 'Manager deleted successfully!');
            fetchUsers();
        } catch (err) {
            console.error("Failed to delete manager:", err);
            showToast('error', 'Error', `Failed to delete manager: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter((user) => {
        // Always filter by 'manager' role as this dashboard is specific to managers
        const matchesRole = user.role === 'manager';
        const matchesSearch =
            search === "" ||
            user.username.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.full_name.toLowerCase().includes(search.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    className="p-button-sm"
                    onClick={() => openEditUserDialog(rowData)}
                    tooltip="Edit Manager"
                    tooltipOptions={{ position: 'bottom' }}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    outlined
                    severity="danger"
                    className="p-button-sm"
                    onClick={() => confirmDeleteUser(rowData)}
                    tooltip="Delete Manager"
                    tooltipOptions={{ position: 'bottom' }}
                />
            </div>
        );
    };

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
                <h3 className="text-3xl font-bold text-gray-800 mb-6">Manager Administration</h3> {/* Changed title */}

                <div className="flex flex-wrap gap-3 mb-6">
                    <Button
                        size="small"
                        label="New Manager"
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
                    sortMode="single"
                    sortField="username"
                    sortOrder={1}
                    emptyMessage="No managers found."
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

                {/* Add/Edit Manager Dialog */}
                <Dialog
                    header={currentUser ? "Edit Manager" : "Add New Manager"}
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

                    {/* Role dropdown specifically for 'manager' dashboard */}
                    <div className="p-field mb-4">
                        <label htmlFor="role" className="font-bold mb-2 block">Role</label>
                        <Dropdown
                            id="role"
                            name="role"
                            value={formData.role}
                            options={roleOptions} // Only "manager" is selectable
                            onChange={onFormInputChange}
                            placeholder="Select a Role"
                            disabled // Disable selection as it's fixed to 'manager'
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

export default ManagerAdminPage;