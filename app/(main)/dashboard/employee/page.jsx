/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react"; 
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

    const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
    const [currentImagePreviewUrl, setCurrentImagePreviewUrl] = useState('');

    const API_BASE_URL = "http://localhost:3100/api";

    const showToast = useCallback((severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    }, []); 

    const fetchDashboardData = useCallback(async () => { 
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
    }, [showToast]); 

    const fetchMachines = useCallback(async () => { 
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
    }, [showToast]); 

    const fetchMyWorkRequests = useCallback(async () => {
        setLoadingWorkRequests(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues`, {
                method: "GET",
                credentials: "include",
            });
            const result = await response.json();

            console.log("Response from /employee/issues (for my work requests):", result);

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
    }, [showToast]);


    const validateIssueForm = useCallback(() => { 
        const errors = {};
        if (!issueFormData.machine_id) errors.machine_id = "Mesin harus dipilih.";
        if (!issueFormData.title.trim()) errors.title = "Judul tidak boleh kosong.";
        else if (issueFormData.title.trim().length < 3) errors.title = "Judul minimal 3 karakter.";
        if (!issueFormData.description.trim()) errors.description = "Deskripsi tidak boleh kosong.";
        else if (issueFormData.description.trim().length < 10) errors.description = "Deskripsi minimal 10 karakter.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [issueFormData]);

    const handleIssueFormChange = useCallback((e, name) => { 
        const value = e.target ? e.target.value : e.value;
        setIssueFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }, [formErrors]); 

    const handleFileChange = useCallback((e) => { 
        setIssueFormData((prev) => ({ ...prev, photo: e.target.files[0] }));
    }, []); 

    const resetIssueForm = useCallback(() => { 
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
    }, []); 

    const submitIssue = useCallback(async () => {
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
    }, [issueFormData, validateIssueForm, showToast, resetIssueForm, fetchDashboardData, fetchMyWorkRequests]); 

    const renderIssueDialogFooter = useCallback(() => ( 
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" outlined onClick={() => { setIsIssueDialogVisible(false); resetIssueForm(); }} />
            <Button label="Laporkan" icon="pi pi-check" onClick={submitIssue} loading={loadingSubmitIssue} />
        </div>
    ), [resetIssueForm, submitIssue, loadingSubmitIssue]); 


    const getStatusSeverity = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'idle': return 'info';
            case 'maintenance': return 'warn';
            case 'broken': return 'danger';
            case 'open': return 'danger';
            case 'in_progress': return 'info';
            case 'completed': return 'success';
            case 'pending': return 'warning';
            default: return null;
        }
    };

    const statusBodyTemplate = useCallback((rowData) => {
        const formattedStatus = rowData.status ? rowData.status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : '';
        return <Tag value={formattedStatus} severity={getStatusSeverity(rowData.status)} />;
    }, []); 

    const handleImageClick = useCallback((imageUrl) => { 
        if (imageUrl) {
            setCurrentImagePreviewUrl(imageUrl);
            setIsImagePreviewVisible(true);
        }
    }, []); 

    const photoBodyTemplate = useCallback((rowData) => { 
        if (rowData.photo_url) {
            return (
                <img
                    src={rowData.photo_url}
                    alt="Pratinjau Foto Isu"
                    style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                    className="shadow-2 border-round"
                    onClick={() => handleImageClick(rowData.photo_url)}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                        console.error("Gagal memuat gambar:", rowData.photo_url);
                    }}
                />
            );
        }
        return (
            <img
                src="https://placehold.co/50x50/cccccc/000000?text=No+Image"
                alt="Tidak ada foto"
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                className="shadow-2 border-round"
            />
        );
    }, [handleImageClick]); 

    const dateBodyTemplate = useCallback((rowData) => { 
        if (rowData.created_at) {
            const date = new Date(rowData.created_at);
            return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        return null;
    }, []); 


    useEffect(() => {
        fetchDashboardData();
        fetchMachines();
        fetchMyWorkRequests();
    }, [fetchDashboardData, fetchMachines, fetchMyWorkRequests]); 


    return (
        <div className="grid p-fluid dashboard-employee">
            <Toast ref={toast} />

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

            <Dialog
                header="Pratinjau Foto"
                visible={isImagePreviewVisible}
                style={{ width: "50vw" }}
                modal
                onHide={() => setIsImagePreviewVisible(false)}
            >
                {currentImagePreviewUrl && (
                    <img
                        src={currentImagePreviewUrl}
                        alt="Pratinjau Foto Isu"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                )}
            </Dialog>


            <div className="col-12">
                <Panel header="PERMINTAAN KERJA SAYA">
                    <DataTable
                        value={myWorkRequests}
                        paginator
                        rows={10}
                        dataKey="id"
                        loading={loadingWorkRequests}
                        emptyMessage="Anda belum mengajukan permintaan kerja."
                    >
                        <Column field="id" header="ID Isu" style={{ width: '100px' }}></Column>
                        <Column field="description" header="Deskripsi" body={(rowData) => <span style={{ whiteSpace: 'normal', display: 'block' }}>{rowData.description}</span>}></Column>
                        <Column field="machine.name" header="Mesin"></Column>
                        <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                        <Column header="Foto" body={photoBodyTemplate}></Column>
                        <Column field="created_at" header="Diajukan" body={dateBodyTemplate}></Column>
                    </DataTable>
                </Panel>
            </div>
        </div>
    );
};

export default EmployeeDashboardPage;