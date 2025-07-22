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
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tooltip } from 'primereact/tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';

const EmployeeDashboardPage = () => {
    const toast = useRef(null);
    const [parent] = useAutoAnimate({ duration: 300 });

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
    const [isHovering, setIsHovering] = useState(false);

    const API_BASE_URL = "http://localhost:3100/api";

    const showToast = useCallback((severity, summary, detail) => {
        toast.current.show({
            severity,
            summary,
            detail,
            life: 3000,
            style: {
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }
        });
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

    const getStatusSeverity = (status) => {
        switch (status) {
            case 'pending': return 'warn';
            case 'in_progress': return 'info';
            case 'completed': return 'success';
            case 'rejected': return 'danger';
            case 'open': return 'danger'; 
            case 'active': return 'success'; 
            case 'idle': return 'info'; 
            case 'maintenance': return 'warn'; 
            case 'broken': return 'danger'; 
            default: return 'secondary';
        }
    };

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

    const handleIssueFormChange = useCallback((e, field) => {
        const value = e.target ? e.target.value : e.value;
        setIssueFormData(prev => ({ ...prev, [field]: value }));
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }, []);

    const handleFileChange = useCallback((e) => {
        if (e.target.files[0]) {
            setIssueFormData(prev => ({ ...prev, photo: e.target.files[0] }));
        } else {
            setIssueFormData(prev => ({ ...prev, photo: null }));
        }
    }, []);

    const submitIssue = async () => {
        if (!validateIssueForm()) {
            showToast('error', 'Validasi Gagal', 'Mohon lengkapi semua bidang yang diperlukan.');
            return;
        }

        setLoadingSubmitIssue(true);
        const formData = new FormData();
        formData.append('machine_id', issueFormData.machine_id); 
        formData.append('title', issueFormData.title);
        formData.append('description', issueFormData.description);
        if (issueFormData.photo) {
            formData.append('photo', issueFormData.photo);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal melaporkan isu.');
            }

            const result = await response.json();
            showToast('success', 'Berhasil!', result.message || 'Isu berhasil dilaporkan.');
            setIsIssueDialogVisible(false);
            resetIssueForm(); 
            
            fetchDashboardData();
            fetchMyWorkRequests();
        } catch (error) {
            console.error("Error submitting issue:", error);
            showToast('error', 'Gagal!', error.message || 'Terjadi kesalahan saat melaporkan isu.');
        } finally {
            setLoadingSubmitIssue(false);
        }
    };

    const renderIssueDialogFooter = useCallback(() => (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Batal"
                icon="pi pi-times"
                outlined
                onClick={() => { setIsIssueDialogVisible(false); resetIssueForm(); }}
                className="hover:scale-105 transition-all"
            />
            <Button
                label="Laporkan"
                icon="pi pi-check"
                onClick={submitIssue}
                loading={loadingSubmitIssue}
                className="hover:scale-105 transition-all"
            />
        </div>
    ), [resetIssueForm, submitIssue, loadingSubmitIssue]);

    const statusBodyTemplate = useCallback((rowData) => {
        const formattedStatus = rowData.status ? rowData.status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : '';
        return (
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                <Tag
                    value={formattedStatus}
                    severity={getStatusSeverity(rowData.status)}
                    className="font-medium"
                />
            </motion.div>
        );
    }, []);

    const handleImageClick = useCallback((url) => {
        setCurrentImagePreviewUrl(url);
        setIsImagePreviewVisible(true);
    }, []);

    const photoBodyTemplate = useCallback((rowData) => {
        if (rowData.photo_url) {
            return (
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <img
                        src={rowData.photo_url}
                        alt="Pratinjau Foto Isu"
                        style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                        className="shadow-lg border-round transition-all hover:shadow-xl"
                        onClick={() => handleImageClick(rowData.photo_url)}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                            console.error("Gagal memuat gambar:", rowData.photo_url);
                        }}
                    />
                </motion.div>
            );
        }
        return (
            <img
                src="https://placehold.co/50x50/cccccc/000000?text=No+Image"
                alt="Tidak ada foto"
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                className="shadow-lg border-round"
            />
        );
    }, [handleImageClick]);

    const dateBodyTemplate = useCallback((rowData) => {
        return rowData.created_at ? new Date(rowData.created_at).toLocaleString('id-ID') : 'N/A';
    }, []);

    useEffect(() => {
        fetchDashboardData();
        fetchMachines();
        fetchMyWorkRequests();
    }, [fetchDashboardData, fetchMachines, fetchMyWorkRequests]);

    return (
        <div className="p-4 dashboard-employee" ref={parent}>
            <Toast
                ref={toast}
                position="top-right"
                className="opacity-90"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
            >
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Karyawan</h1>
                <p className="text-gray-600">Pantau dan kelola permintaan kerja Anda</p>
            </motion.div>

            <div className="grid">
                <div className="col-12 md:col-8">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="h-full"
                    >
                        <Card className="h-full border-round-xl shadow-md bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex flex-column md:flex-row align-items-center justify-content-between h-full">
                                <div>
                                    <span className="block text-600 font-medium mb-2 text-lg">Total Isu Dilaporkan</span>
                                    <motion.div
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <div className="text-900 font-bold text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                            {dashboardData?.myReportedIssuesCount || 0}
                                        </div>
                                    </motion.div>
                                </div>
                                <div className="flex align-items-center justify-content-center bg-gradient-to-r from-blue-100 to-purple-100 border-round mt-3 md:mt-0"
                                    style={{ width: '5rem', height: '5rem' }}>
                                    <i className="pi pi-exclamation-triangle text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                <div className="col-12 md:col-4">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="h-full"
                    >
                        <Button
                            label="Laporkan Isu Baru"
                            icon="pi pi-plus-circle"
                            severity="danger"
                            onClick={() => setIsIssueDialogVisible(true)}
                            className="p-button-raised p-button-lg w-full h-full border-round-xl shadow-md"
                            style={{
                                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
                                border: 'none'
                            }}
                        />
                    </motion.div>
                </div>
            </div>

            <Dialog
                header="Laporkan Isu Mesin"
                visible={isIssueDialogVisible}
                style={{ width: "min(90vw, 600px)", borderRadius: '16px' }}
                modal
                className="p-fluid shadow-2xl"
                onHide={() => { setIsIssueDialogVisible(false); resetIssueForm(); }}
                footer={renderIssueDialogFooter()}
                headerClassName="border-bottom-1 surface-border"
                contentClassName="py-3"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
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
                            className={`w-full ${formErrors.machine_id ? 'p-invalid' : ''}`}
                            panelClassName="shadow-lg border-round-lg"
                        />
                        {formErrors.machine_id && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2"
                            >
                                <Message severity="error" text={formErrors.machine_id} />
                            </motion.div>
                        )}
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="title" className="font-bold mb-2 block">Judul Isu</label>
                        <InputText
                            id="title"
                            name="title"
                            value={issueFormData.title}
                            onChange={(e) => handleIssueFormChange(e, "title")}
                            className={`w-full ${formErrors.title ? 'p-invalid' : ''}`}
                            placeholder="Masukkan judul isu"
                        />
                        {formErrors.title && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2"
                            >
                                <Message severity="error" text={formErrors.title} />
                            </motion.div>
                        )}
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="description" className="font-bold mb-2 block">Deskripsi</label>
                        <InputTextarea
                            id="description"
                            name="description"
                            rows={5}
                            value={issueFormData.description}
                            onChange={(e) => handleIssueFormChange(e, "description")}
                            className={`w-full ${formErrors.description ? 'p-invalid' : ''}`}
                            placeholder="Jelaskan isu secara detail..."
                            autoResize
                        />
                        {formErrors.description && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2"
                            >
                                <Message severity="error" text={formErrors.description} />
                            </motion.div>
                        )}
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="photo" className="font-bold mb-2 block">Foto (Opsional)</label>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="border-2 border-dashed border-gray-300 border-round-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-all"
                            onClick={() => fileInputRef.current.click()}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                        >
                            <input
                                type="file"
                                id="photo"
                                name="photo"
                                accept="image/*"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="hidden"
                            />
                            <i className={`pi pi-cloud-upload text-3xl mb-2 ${isHovering ? 'text-blue-500' : 'text-gray-500'}`} />
                            <p className={`mb-0 ${isHovering ? 'text-blue-500' : 'text-gray-600'}`}>
                                {issueFormData.photo ? issueFormData.photo.name : 'Klik untuk mengunggah foto'}
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </Dialog>

            <Dialog
                header="Pratinjau Foto"
                visible={isImagePreviewVisible}
                style={{ width: "min(90vw, 700px)", borderRadius: '16px' }}
                modal
                onHide={() => setIsImagePreviewVisible(false)}
                headerClassName="border-bottom-1 surface-border"
                contentClassName="p-0"
            >
                {currentImagePreviewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <img
                            src={currentImagePreviewUrl}
                            alt="Pratinjau Foto Isu"
                            className="w-full border-round-bottom"
                            style={{ maxHeight: '70vh', objectFit: 'contain' }}
                        />
                    </motion.div>
                )}
            </Dialog>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
            >
                <Panel
                    header="PERMINTAAN KERJA SAYA"
                    className="shadow-sm border-round-xl overflow-hidden"
                    headerClassName="font-bold text-xl border-bottom-1 surface-border"
                >
                    {loadingWorkRequests ? (
                        <div className="flex justify-content-center py-6">
                            <ProgressSpinner />
                        </div>
                    ) : (
                        <DataTable
                            value={myWorkRequests}
                            paginator
                            rows={10}
                            dataKey="id"
                            loading={loadingWorkRequests}
                            emptyMessage="Anda belum mengajukan permintaan kerja."
                            className="border-round-lg"
                            rowClassName={() => 'hover:bg-gray-50 transition-colors cursor-pointer'}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} permintaan"
                            rowsPerPageOptions={[5, 10, 25]}
                        >
                            <Column
                                field="title"
                                header="Judul Isu"
                                style={{ width: '200px' }}
                                body={(rowData) => (
                                    <motion.div
                                        whileHover={{ x: 5 }}
                                        className="font-medium text-blue-600"
                                    >
                                        {rowData.title}
                                    </motion.div>
                                )}
                            />
                            <Column
                                field="description"
                                header="Deskripsi"
                                body={(rowData) => (
                                    <>
                                        <Tooltip target=".description-tooltip" position="bottom" />
                                        <span className="description-tooltip" data-pr-tooltip={rowData.description} style={{ whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'block',
                                            maxWidth: '200px'
                                        }}
                                        >
                                            {rowData.description}
                                        </span>
                                    </>
                                )}
                            />
                            <Column
                                field="machine.name"
                                header="Mesin"
                                body={(rowData) => (
                                    <Tag
                                        value={rowData.machine?.name}
                                        className="bg-gray-100 text-gray-800 font-medium"
                                    />
                                )}
                            />
                            <Column
                                field="status"
                                header="Status"
                                body={statusBodyTemplate}
                            />
                            <Column
                                header="Foto"
                                body={photoBodyTemplate}
                            />
                            <Column
                                field="created_at"
                                header="Diajukan"
                                body={dateBodyTemplate}
                                sortable
                            />
                        </DataTable>
                    )}
                </Panel>
            </motion.div>
        </div>
    );
};

export default EmployeeDashboardPage;