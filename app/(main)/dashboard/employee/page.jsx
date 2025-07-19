/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import { Toast } from 'primereact/toast';
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

const EmployeeDashboardPage = () => {
    const toast = useRef(null);

    const [dashboardData, setDashboardData] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [loadingSubmitIssue, setLoadingSubmitIssue] = useState(false);
    const [isIssueDialogVisible, setIsIssueDialogVisible] = useState(false);
    const [machines, setMachines] = useState([]);
    const [issueFormData, setIssueFormData] = useState({
        machine_id: null,
        title: "",
        description: "",
        photo: null,
    });
    const [formErrors, setFormErrors] = useState({});
    const fileInputRef = useRef(null);

    const [myWorkRequests, setMyWorkRequests] = useState([]);
    const [loadingWorkRequests, setLoadingWorkRequests] = useState(true); 
    const [displayRequestDialog, setDisplayRequestDialog] = useState(false);
    const [newRequestDescription, setNewRequestDescription] = useState('');
    const [newRequestType, setNewRequestType] = useState(null);

    const requestTypes = [
        { label: 'Perbaikan Umum', value: 'General Repair' },
        { label: 'TI / Jaringan', value: 'IT/Network' },
        { label: 'Kebersihan', value: 'Cleaning' },
        { label: 'Lain-lain', value: 'Other' }
    ];

    const API_BASE_URL = "http://localhost:3100/api";

    const showToast = (severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    };

    const fetchDashboardData = async () => {
        setLoadingDashboard(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employee/dashboard/my-overview`, {
                method: "GET",
                credentials: "include",
            });
            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Terjadi kesalahan saat memuat data.";
                throw new Error(`Gagal memuat data dashboard: ${errorDetail}`);
            }
            setDashboardData(result.data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            showToast('error', 'Error', `${error.message}`);
        } finally {
            setLoadingDashboard(false);
        }
    };

    const fetchMachines = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee/machines/available`, {
                method: "GET",
                credentials: "include",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memuat daftar mesin dari endpoint employee.");
            }
            const result = await response.json();
            setMachines(result.data.map(machine => ({ label: machine.name, value: machine.id })));
        } catch (error) {
            console.error("Error fetching machines:", error);
            if (error instanceof SyntaxError && error.message.includes("Unexpected token '<'")) {
                showToast('error', 'Error', 'Gagal memuat daftar mesin. Server mengembalikan halaman error (404 Not Found) alih-alih data.');
            } else {
                showToast('error', 'Error', `Gagal memuat daftar mesin: ${error.message}`);
            }
        }
    };

    const fetchMyWorkRequests = async () => {
        setLoadingWorkRequests(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employee/work-orders/my-requests`, {
                method: "GET",
                credentials: "include",
            });
            const result = await response.json();

            console.log("Response from /employee/work-orders/my-requests:", result);
            

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Terjadi kesalahan saat memuat permintaan kerja.";
                throw new Error(`Gagal memuat permintaan kerja: ${errorDetail}`);
            }
            setMyWorkRequests(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error("Error fetching my work requests:", error);
            showToast('error', 'Error', `${error.message}`);
            setMyWorkRequests([]); 
        } finally {
            setLoadingWorkRequests(false);
        }
    };


    const validateIssueForm = () => {
        const errors = {};
        if (!issueFormData.machine_id) errors.machine_id = "Mesin harus dipilih.";
        if (!issueFormData.title.trim()) errors.title = "Judul tidak boleh kosong.";
        else if (issueFormData.title.trim().length < 3) errors.title = "Judul minimal 3 karakter.";
        if (!issueFormData.description.trim()) errors.description = "Deskripsi tidak boleh kosong.";
        else if (issueFormData.description.trim().length < 10) errors.description = "Deskripsi minimal 10 karakter.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleIssueFormChange = (e, name) => {
        const value = e.target ? e.target.value : e.value;
        setIssueFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFileChange = (e) => {
        setIssueFormData((prev) => ({ ...prev, photo: e.target.files[0] }));
    };

    const submitIssue = async () => {
        if (!validateIssueForm()) {
            showToast('error', 'Validasi Gagal', 'Harap perbaiki kesalahan pada formulir.');
            return;
        }

        setLoadingSubmitIssue(true);
        const formData = new FormData();
        formData.append("machine_id", issueFormData.machine_id);
        formData.append("title", issueFormData.title);
        formData.append("description", issueFormData.description);
        if (issueFormData.photo) {
            formData.append("photo", issueFormData.photo);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            const result = await response.json();

            if (!response.ok) {
                const errorDetail = result.message || JSON.stringify(result.errors) || "Terjadi kesalahan saat melaporkan isu.";
                throw new Error(`Gagal melaporkan isu: ${errorDetail}`);
            }

            showToast('success', 'Sukses', 'Isu berhasil dilaporkan!');
            setIsIssueDialogVisible(false);
            resetIssueForm();
            fetchDashboardData(); 
            fetchMyWorkRequests(); 
        } catch (error) {
            console.error("Error submitting issue:", error);
            showToast('error', 'Error', `${error.message}`);
        } finally {
            setLoadingSubmitIssue(false);
        }
    };

    const resetIssueForm = () => {
        setIssueFormData({
            machine_id: null,
            title: "",
            description: "",
            photo: null,
        });
        setFormErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const renderIssueDialogFooter = () => (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" outlined onClick={() => { setIsIssueDialogVisible(false); resetIssueForm(); }} />
            <Button label="Laporkan" icon="pi pi-check" onClick={submitIssue} loading={loadingSubmitIssue} />
        </div>
    );

    const getStatusSeverity = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'idle': return 'info';
            case 'maintenance': return 'warn';
            case 'broken': return 'danger';
            case 'open': return 'danger';
            case 'in_progress': return 'info';
            case 'completed': return 'success';
            default: return null;
        }
    };

    const statusBodyTemplate = (rowData) => {
        const getSeverity = (status) => {
            switch (status) {
                case 'Open':
                    return 'warning';
                case 'In Progress':
                    return 'info';
                case 'Completed':
                    return 'success';
                default:
                    return null;
            }
        };
        return <Tag value={rowData.status} severity={getSeverity(rowData.status)} />;
    };

    const submitNewRequest = () => {
        if (newRequestDescription && newRequestType) {
            const newRequest = {
                id: `REQ-${Math.floor(Math.random() * 1000)}`,
                description: newRequestDescription,
                type: newRequestType,
                status: "Open",
                submittedDate: new Date().toISOString().slice(0, 10)
            };
            setMyWorkRequests((prevRequests) => [...prevRequests, newRequest]);
            setNewRequestDescription('');
            setNewRequestType(null);
            setDisplayRequestDialog(false);
            toast.current.show({ severity: 'success', summary: 'Sukses', detail: 'Permintaan berhasil diajukan!', life: 3000 });
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Harap isi deskripsi dan jenis permintaan.', life: 3000 });
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchMachines();
        fetchMyWorkRequests(); 
    }, []);


    return (
        <div className="grid p-fluid dashboard-employee">
            <Toast ref={toast} />

            <div className="col-12 md:col-6 lg:col-3">
                <Card className="surface-0 shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Total Mesin</span>
                            <div className="text-900 font-bold text-xl">{dashboardData?.machineStatus?.reduce((acc, curr) => acc + curr.count, 0) || 0}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-inbox text-blue-500 text-xl" />
                        </div>
                    </div>
                    {dashboardData?.machineStatus?.map((status, index) => (
                        <div key={index} className="text-500 flex align-items-center mt-2">
                            <span className={`text-${getStatusSeverity(status.status)}-500 font-bold`}>{status.count}</span>
                            <span className="ml-1 text-sm">{status.status.replace(/_/g, ' ')}</span>
                        </div>
                    ))}
                </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
                <Card className="surface-0 shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Total Work Orders</span>
                            <div className="text-900 font-bold text-xl">{dashboardData?.totalWorkOrders || 0}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-file-edit text-orange-500 text-xl" />
                        </div>
                    </div>
                    {dashboardData?.workOrderStatus?.map((status, index) => (
                        <div key={index} className="text-500 flex align-items-center mt-2">
                            <span className={`text-${getStatusSeverity(status.status)}-500 font-bold`}>{status.count}</span>
                            <span className="ml-1 text-sm">{status.status.replace(/_/g, ' ')}</span>
                        </div>
                    ))}
                </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
                <Card className="surface-0 shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Work Orders Overdue</span>
                            <div className="text-900 font-bold text-xl">{dashboardData?.overdueCount || 0}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-pink-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-hourglass text-pink-500 text-xl" />
                        </div>
                    </div>
                    <div className="text-500">
                        <span className="text-pink-500 font-medium">{dashboardData?.overdueWorkOrders?.length || 0}</span>
                        <span className="ml-1">work orders are past due.</span>
                    </div>
                </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
                <Card className="surface-0 shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Isu Saya</span>
                            <div className="text-900 font-bold text-xl">{dashboardData?.myReportedIssuesCount || 0}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-exclamation-triangle text-purple-500 text-xl" />
                        </div>
                    </div>
                    <div className="text-500">
                        <span className="font-medium">Jumlah isu yang Anda laporkan.</span>
                    </div>
                </Card>
            </div>

            <div className="col-12">
                <div className="card shadow-2 p-4 border-round">
                    <h5 className="mt-0 mb-3">Laporkan Isu Baru</h5>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            label="Laporkan Isu"
                            icon="pi pi-plus-circle"
                            severity="danger"
                            onClick={() => setIsIssueDialogVisible(true)}
                            className="p-button-sm p-button-raised"
                        />
                    </div>
                </div>
            </div>

            <Dialog
                header="Laporkan Isu Mesin"
                visible={isIssueDialogVisible}
                style={{ width: "40vw" }}
                modal
                className="p-fluid"
                onHide={() => { setIsIssueDialogVisible(false); resetIssueForm(); }}
                footer={renderIssueDialogFooter()}
            >
                <div className="field mb-4">
                    <label htmlFor="machine_id" className="font-bold mb-2 block">Mesin</label>
                    <Dropdown
                        id="machine_id"
                        name="machine_id"
                        value={issueFormData.machine_id}
                        options={machines}
                        onChange={(e) => handleIssueFormChange(e, "machine_id")}
                        placeholder="Pilih Mesin"
                        className={formErrors.machine_id ? 'p-invalid' : ''}
                    />
                    {formErrors.machine_id && <Message severity="error" text={formErrors.machine_id} />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="title" className="font-bold mb-2 block">Judul Isu</label>
                    <InputText
                        id="title"
                        name="title"
                        value={issueFormData.title}
                        onChange={(e) => handleIssueFormChange(e, "title")}
                        className={formErrors.title ? 'p-invalid' : ''}
                    />
                    {formErrors.title && <Message severity="error" text={formErrors.title} />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="description" className="font-bold mb-2 block">Deskripsi</label>
                    <InputTextarea
                        id="description"
                        name="description"
                        rows={5}
                        cols={30}
                        value={issueFormData.description}
                        onChange={(e) => handleIssueFormChange(e, "description")}
                        className={formErrors.description ? 'p-invalid' : ''}
                    />
                    {formErrors.description && <Message severity="error" text={formErrors.description} />}
                </div>

                <div className="field mb-4">
                    <label htmlFor="photo" className="font-bold mb-2 block">Foto (Opsional)</label>
                    <input
                        type="file"
                        id="photo"
                        name="photo"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="p-inputtext"
                    />
                </div>
            </Dialog>

            <div className="col-12">
                <Panel header="PERMINTAAN KERJA SAYA">
                    <div className="flex justify-content-end mb-3">
                        <Button label="Buat Permintaan Baru" icon="pi pi-plus" onClick={() => setDisplayRequestDialog(true)} />
                    </div>
                    
                    <DataTable
                        value={myWorkRequests}
                        paginator
                        rows={5}
                        dataKey="id"
                        loading={loadingWorkRequests}
                        emptyMessage="Anda belum mengajukan permintaan kerja."
                    >
                        <Column field="id" header="ID Permintaan"></Column>
                        <Column field="description" header="Deskripsi"></Column>
                        <Column field="type" header="Jenis"></Column>
                        <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                        <Column field="submittedDate" header="Tanggal Diajukan"></Column>
                    </DataTable>
                </Panel>
            </div>

            <Dialog header="Buat Permintaan Kerja Baru" visible={displayRequestDialog} style={{ width: '50vw' }} modal onHide={() => setDisplayRequestDialog(false)} footer={
                <div>
                    <Button label="Batal" icon="pi pi-times" onClick={() => setDisplayRequestDialog(false)} className="p-button-text" />
                    <Button label="Kirim" icon="pi pi-check" onClick={submitNewRequest} autoFocus />
                </div>
            }>
                <div className="p-fluid">
                    <div className="field mb-3">
                        <label htmlFor="description" className="font-bold mb-2">Deskripsi Masalah</label>
                        <InputTextarea id="description" rows={5} cols={30} value={newRequestDescription} onChange={(e) => setNewRequestDescription(e.target.value)} autoFocus />
                    </div>
                    <div className="field">
                        <label htmlFor="requestType" className="font-bold mb-2">Jenis Permintaan</label>
                        <Dropdown id="requestType" value={newRequestType} options={requestTypes} onChange={(e) => setNewRequestType(e.value)} placeholder="Pilih Jenis" />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default EmployeeDashboardPage;