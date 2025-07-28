"use client";

import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import UserTable from "./components/UserTable";
import UserFormDialog from "./components/UserFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import { API_ENDPOINTS } from "../../../api/api";

const UserPage = () => {
    const toast = useRef(null);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const [isPrintOptionsOpen, setPrintOptionsOpen] = useState(false);
    const [isPreviewOpen, setPreviewOpen] = useState(false);

    const [printConfig, setPrintConfig] = useState({
        paperSize: "a4",
        orientation: "portrait",
        columns: ["username", "full_name", "email", "role", "is_active"],
        onlySelected: false,
    });

    const columnOptions = [
        { header: "Username", value: "username" },
        { header: "Full Name", value: "full_name" },
        { header: "Email", value: "email" },
        { header: "Role", value: "role" },
        { header: "Status", value: "is_active" },
        { header: "Created At", value: "created_at" },
    ];

    const paperSizes = [
        { label: "A4", value: "a4" },
        { label: "Letter", value: "letter" },
        { label: "Legal", value: "legal" },
    ];

    const orientations = [
        { label: "Portrait", value: "portrait" },
        { label: "Landscape", value: "landscape" },
    ];

    const showToast = (sev, sum, det) =>
        toast.current.show({ severity: sev, summary: sum, detail: det });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.USERS, { credentials: "include" });
            const body = await res.json();
            setUsers(body.data || []);
        } catch {
            showToast("error", "Error", "Gagal mengambil data user");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                const wb = XLSX.read(evt.target.result, { type: "binary" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                for (const item of data) {
                    const cleaned = {
                        username: String(item.username).trim(),
                        email: String(item.email).trim(),
                        password: String(item.password).trim(),
                        full_name: String(item.full_name).trim(),
                        role: ["admin", "employee", "technician", "manager", "logistics"].includes(item.role)
                            ? item.role
                            : "employee", // fallback jika role tidak valid
                        is_active:
                            item.is_active === true ||
                            item.is_active === "true" ||
                            item.is_active === 1 ||
                            item.is_active === "1"
                    };

                    const res = await fetch(API_ENDPOINTS.USERS, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(cleaned),
                    });

                    const body = await res.json();
                    if (!res.ok) throw new Error(body.message || "Import gagal");
                }
                showToast("success", "Import Sukses", "Data berhasil diimpor");
                fetchUsers();
            };
            reader.readAsBinaryString(file);
        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        }
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedUsers.length === 0) {
            showToast("warn", "Warning", "Tidak ada user yang dipilih");
            return;
        }
        setDeleteConfirmOpen(true);
    };

    const openPrintOptions = () => {
        if (!users.length)
            return showToast("warn", "Peringatan", "Tidak ada data untuk cetak");
        setPrintOptionsOpen(true);
    };

    const generatePDF = () => {
        const { paperSize, orientation, columns, onlySelected } = printConfig;
        const sourceData =
            onlySelected && selectedUsers.length > 0 ? selectedUsers : users;
        const headers = columns.map(
            (c) => columnOptions.find((o) => o.value === c)?.header || c
        );
        const rows = sourceData.map((u) => columns.map((c) => {
            if (c === "is_active") return u[c] ? "Active" : "Inactive";
            if (c === "created_at") return new Date(u[c]).toLocaleDateString();
            return u[c] ?? "";
        }));

        const doc = new jsPDF({ unit: "mm", format: paperSize, orientation });
        doc.text("Daftar Users", 14, 14);
        autoTable(doc, {
            startY: 20,
            head: [headers],
            body: rows,
            styles: { fontSize: 8 },
        });
        return doc;
    };

    const handlePreview = () => setPreviewOpen(true);
    const handlePrint = () => {
        generatePDF().save("users.pdf");
        setPrintOptionsOpen(false);
        setPreviewOpen(false);
    };

    const renderPrintOptions = () => (
        <Dialog
            header="Print PDF Options"
            visible={isPrintOptionsOpen}
            onHide={() => setPrintOptionsOpen(false)}
            modal
            className="p-fluid"
            style={{ width: "30rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        >
            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Paper Size</label>
                <div className="col-12">
                    <Dropdown
                        value={printConfig.paperSize}
                        options={paperSizes}
                        onChange={(e) =>
                            setPrintConfig((ic) => ({ ...ic, paperSize: e.value }))
                        }
                        placeholder="Pilih ukuran"
                    />
                </div>
            </div>

            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Orientation</label>
                <div className="col-12">
                    <Dropdown
                        value={printConfig.orientation}
                        options={orientations}
                        onChange={(e) =>
                            setPrintConfig((ic) => ({ ...ic, orientation: e.value }))
                        }
                        placeholder="Pilih orientasi"
                    />
                </div>
            </div>

            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Columns to Print</label>
                <div className="col-12">
                    <MultiSelect
                        value={printConfig.columns}
                        options={columnOptions}
                        onChange={(e) =>
                            setPrintConfig((ic) => ({ ...ic, columns: e.value }))
                        }
                        optionLabel="header"
                        placeholder="Pilih kolom"
                        display="chip"
                    />
                </div>
            </div>

            <div className="field grid mb-4">
                <div className="col-12">
                    <Checkbox
                        checked={printConfig.onlySelected}
                        onChange={(e) =>
                            setPrintConfig((ic) => ({
                                ...ic,
                                onlySelected: e.checked,
                            }))
                        }
                    />
                    <label className="ml-2">Print only selected data</label>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button label="Preview" icon="pi pi-eye" onClick={handlePreview} />
                <Button label="Print PDF" icon="pi pi-print" onClick={handlePrint} />
            </div>
        </Dialog>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />

            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                style={{ display: "none" }}
                ref={(ref) => (window.__fileInputImportUser = ref)}
            />

            <div className="card">
                <h3 className="mb-4">Manajemen Users</h3>
                <div className="flex flex-row gap-2 mb-4">
                    <Button
                        size="small"
                        label="Back"
                        icon="pi pi-arrow-left"
                        outlined
                        disabled
                    />
                    <Button
                        label="New"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => setFormOpen(true)}
                    />
                    <Divider layout="vertical" />
                    <Button
                        label="Import"
                        icon="pi pi-file-import"
                        outlined
                        severity="info"
                        onClick={() => window.__fileInputImportUser?.click()}
                    />
                    <Button
                        label="Export"
                        icon="pi pi-file-excel"
                        outlined
                        severity="success"
                        onClick={() => {
                            if (!users.length)
                                return showToast(
                                    "warn",
                                    "Peringatan",
                                    "Tidak ada data untuk diekspor"
                                );
                            const ws = XLSX.utils.json_to_sheet(users);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Users");
                            XLSX.writeFile(wb, "users-data.xlsx");
                        }}
                    />
                    <Button
                        label="Print"
                        icon="pi pi-print"
                        outlined
                        severity="help"
                        onClick={openPrintOptions}
                    />
                    <Button
                        size="small"
                        label={`Delete ${selectedUsers.length > 0
                                ? `(${selectedUsers.length})`
                                : ""
                            }`}
                        icon="pi pi-trash"
                        outlined
                        severity="danger"
                        onClick={handleDeleteSelected}
                        disabled={selectedUsers.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={fetchUsers}
                    />
                </div>

                <UserTable
                    users={users}
                    loading={loading}
                    selectedUsers={selectedUsers}
                    onSelectionChange={setSelectedUsers}
                    onEdit={(u) => {
                        setSelectedUser(u);
                        setFormOpen(true);
                    }}
                    onDelete={handleDelete}
                />

                <UserFormDialog
                    visible={isFormOpen}
                    onHide={() => setFormOpen(false)}
                    user={selectedUser}
                    fetchUsers={fetchUsers}
                    showToast={showToast}
                />

                <ConfirmDeleteDialog
                    visible={isDeleteOpen}
                    user={selectedUser}
                    selectedUsers={selectedUsers}
                    onHide={() => setDeleteOpen(false)}
                    fetchUsers={fetchUsers}
                    showToast={showToast}
                />

                {renderPrintOptions()}

                <Dialog
                    header="PDF Preview"
                    visible={isPreviewOpen}
                    modal
                    maximized
                    style={{ width: "80vw", height: "80vh" }}
                    onHide={() => setPreviewOpen(false)}
                    footer={
                        <Button
                            label="Download PDF"
                            icon="pi pi-download"
                            onClick={handlePrint}
                        />
                    }
                >
                    <iframe
                        title="preview"
                        src={URL.createObjectURL(generatePDF().output("blob"))}
                        style={{ width: "100%", height: "100%", border: "none" }}
                    />
                </Dialog>
            </div>
        </div>
    );
};

export default UserPage;
