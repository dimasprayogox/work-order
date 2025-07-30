"use client";

import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";
import ExcelJS from "exceljs"; // Menggunakan ExcelJS
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import UserTable from "./components/UserTable";
import UserFormDialog from "./components/UserFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import { API_ENDPOINTS } from "../../../api/api";

const UserPage = () => {
    const toast = useRef(null);
    const fileInputRef = useRef(null);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [isFormOpen, setFormOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);

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
        toast.current.show({ severity: sev, summary: sum, detail: det, life: 3000 });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.USERS, { credentials: "include" });
            const body = await res.json();
            setUsers(body.data || []);
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data user: " + err.message);
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
                try {
                    const buffer = evt.target.result;
                    const workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.load(buffer);

                    const worksheet = workbook.getWorksheet(1);
                    if (!worksheet) throw new Error("Worksheet tidak ditemukan.");

                    const jsonData = [];
                    const headers = worksheet.getRow(1).values;
                    if (!Array.isArray(headers) || headers.length <= 1) throw new Error("Header kolom tidak valid.");

                    worksheet.eachRow((row, rowNumber) => {
                        if (rowNumber > 1) {
                            let rowData = {};
                            row.values.forEach((value, index) => {
                                if (headers[index]) {
                                    rowData[headers[index]] = value;
                                }
                            });
                            jsonData.push(rowData);
                        }
                    });

                    for (const item of jsonData) {
                        const cleaned = {
                            username: String(item.username || "").trim(),
                            email: String(item.email || "").trim(),
                            password: String(item.password || "").trim(),
                            full_name: String(item.full_name || "").trim(),
                            role: ["admin", "employee", "technician", "manager", "logistics"].includes(item.role) ? item.role : "employee",
                            is_active: [true, "true", 1, "1"].includes(item.is_active),
                        };
                        const res = await fetch(API_ENDPOINTS.USERS, {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            credentials: "include", body: JSON.stringify(cleaned),
                        });
                        if (!res.ok) {
                            const body = await res.json();
                            throw new Error(`Baris "${item.username}": ${body.message}` || "Import gagal");
                        }
                    }
                    showToast("success", "Import Sukses", "Data berhasil diimpor");
                    fetchUsers();
                } catch (err) {
                     showToast("error", "Import Gagal", err.message);
                } finally {
                    e.target.value = ''; // Reset input file
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            showToast("error", "Import Gagal", err.message);
        }
    };

    const handleExport = async () => {
        if (!users.length) {
            return showToast("warn", "Peringatan", "Tidak ada data untuk diekspor");
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Users");
            worksheet.columns = [
                { header: 'id', key: 'id', width: 38 },
                { header: 'username', key: 'username', width: 20 },
                { header: 'full_name', key: 'full_name', width: 30 },
                { header: 'email', key: 'email', width: 30 },
                { header: 'role', key: 'role', width: 15 },
                { header: 'is_active', key: 'is_active', width: 10 },
                { header: 'created_at', key: 'created_at', width: 22 },
                { header: 'updated_at', key: 'updated_at', width: 22 },
            ];
            users.forEach(user => worksheet.addRow(user));
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "users-data.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("success", "Export Sukses", "Data berhasil diunduh");
        } catch(err) {
            showToast("error", "Export Gagal", err.message);
        }
    }

    const handleDelete = (user) => {
        setSelectedUser(user);
        setDeleteOpen(true);
    };

    const handleDeleteSelected = () => {
        if (selectedUsers.length === 0) return;
        confirmDialog({
            message: `Apakah Anda yakin ingin menghapus ${selectedUsers.length} user yang dipilih?`,
            header: "Konfirmasi Penghapusan", icon: "pi pi-exclamation-triangle",
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const idsToDelete = selectedUsers.map(u => u.id);
                    const res = await fetch(`${API_ENDPOINTS.USERS}/batch`, {
                        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: idsToDelete }), credentials: 'include',
                    });
                    if (!res.ok) {
                        const body = await res.json();
                        throw new Error(body.message || 'Gagal menghapus user');
                    }
                    showToast('success', 'Sukses', 'User yang dipilih berhasil dihapus.');
                    fetchUsers();
                    setSelectedUsers([]);
                } catch (err) {
                    showToast('error', 'Error', err.message);
                }
            },
        });
    };

    const generatePDF = () => {
        const { paperSize, orientation, columns, onlySelected } = printConfig;
        const sourceData = onlySelected && selectedUsers.length > 0 ? selectedUsers : users;
        const headers = columns.map(c => columnOptions.find(o => o.value === c)?.header || c);
        const body = sourceData.map(u => columns.map(c => {
            if (c === "is_active") return u[c] ? "Active" : "Inactive";
            if (c === "created_at") return u[c] ? new Date(u[c]).toLocaleDateString('id-ID') : '';
            return u[c] ?? "";
        }));
        const doc = new jsPDF({ unit: "mm", format: paperSize, orientation });
        doc.text("Daftar Users", 14, 14);
        autoTable(doc, { startY: 20, head: [headers], body, styles: { fontSize: 8 } });
        return doc;
    };

    const renderPrintOptions = () => (
        <Dialog header="Print PDF Options" visible={isPrintOptionsOpen} onHide={() => setPrintOptionsOpen(false)} modal className="p-fluid" style={{ width: "30rem" }}>
            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Paper Size</label>
                <div className="col-12">
                    <Dropdown value={printConfig.paperSize} options={paperSizes} onChange={(e) => setPrintConfig(p => ({ ...p, paperSize: e.value }))} placeholder="Pilih ukuran" />
                </div>
            </div>
            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Orientation</label>
                <div className="col-12">
                    <Dropdown value={printConfig.orientation} options={orientations} onChange={(e) => setPrintConfig(p => ({ ...p, orientation: e.value }))} placeholder="Pilih orientasi" />
                </div>
            </div>
            <div className="field grid mb-4">
                <label className="col-12 mb-2 font-medium">Columns to Print</label>
                <div className="col-12">
                    <MultiSelect value={printConfig.columns} options={columnOptions} onChange={(e) => setPrintConfig(p => ({ ...p, columns: e.value }))} optionLabel="header" placeholder="Pilih kolom" display="chip" />
                </div>
            </div>
            <div className="field-checkbox mb-4">
                <Checkbox inputId="onlySelected" checked={printConfig.onlySelected} onChange={(e) => setPrintConfig(p => ({ ...p, onlySelected: e.checked }))} />
                <label htmlFor="onlySelected" className="ml-2">Print only selected data</label>
            </div>
            <div className="flex justify-content-end gap-2">
                <Button label="Preview" icon="pi pi-eye" onClick={() => { setPreviewOpen(true); setPrintOptionsOpen(false); }} />
                <Button label="Print PDF" icon="pi pi-print" onClick={() => { generatePDF().save("users.pdf"); setPrintOptionsOpen(false); }} />
            </div>
        </Dialog>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} ref={fileInputRef} />

            <div className="card">
                <h3 className="mb-4">Manajemen Users</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    <Button label="New" icon="pi pi-plus" outlined severity="success" onClick={() => { setSelectedUser(null); setFormOpen(true); }} />
                    <Divider layout="vertical" />
                    <Button label="Import" icon="pi pi-file-import" outlined severity="info" onClick={() => fileInputRef.current?.click()} />
                    <Button label="Export" icon="pi pi-file-excel" outlined severity="success" onClick={handleExport} />
                    <Button label="Print" icon="pi pi-print" outlined severity="help" onClick={() => setPrintOptionsOpen(true)} />
                    <Button label={`Delete (${selectedUsers.length})`} icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteSelected} disabled={selectedUsers.length === 0} />
                    <Divider layout="vertical" />
                    <Button label="Refresh" icon="pi pi-refresh" outlined onClick={fetchUsers} loading={loading} />
                </div>

                <UserTable users={users} loading={loading} selectedUsers={selectedUsers} onSelectionChange={(e) => setSelectedUsers(e.value)} onEdit={(u) => { setSelectedUser(u); setFormOpen(true); }} onDelete={handleDelete} />
            </div>

            <UserFormDialog visible={isFormOpen} onHide={() => setFormOpen(false)} user={selectedUser} fetchUsers={fetchUsers} showToast={showToast} />
            <ConfirmDeleteDialog visible={isDeleteOpen} onHide={() => setDeleteOpen(false)} user={selectedUser} fetchUsers={fetchUsers} showToast={showToast} />
            {renderPrintOptions()}

            <Dialog header="PDF Preview" visible={isPreviewOpen} modal maximizable style={{ width: "90vw", height: "90vh" }} onHide={() => setPreviewOpen(false)}
                footer={<Button label="Download PDF" icon="pi pi-download" onClick={() => generatePDF().save("users.pdf")} />}>
                {isPreviewOpen && <iframe title="preview" src={URL.createObjectURL(generatePDF().output("blob"))} style={{ width: "100%", height: "100%", border: "none" }} />}
            </Dialog>
        </div>
    );
};

export default UserPage;
