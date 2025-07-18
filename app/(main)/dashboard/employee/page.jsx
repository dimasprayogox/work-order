/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react"; // Added useRef
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast'; // Uncommented Toast

const EmployeeDashboardPage = () => {
    const [myWorkRequests, setMyWorkRequests] = useState([]);
    const [displayRequestDialog, setDisplayRequestDialog] = useState(false);
    const [newRequestDescription, setNewRequestDescription] = useState('');
    const [newRequestType, setNewRequestType] = useState(null);

    const toast = useRef(null); // Initialized toast ref

    const requestTypes = [
        { label: 'Perbaikan Umum', value: 'General Repair' },
        { label: 'TI / Jaringan', value: 'IT/Network' },
        { label: 'Kebersihan', value: 'Cleaning' },
        { label: 'Lain-lain', value: 'Other' }
    ];

    useEffect(() => {
        // Simulasi pengambilan data
        const fetchData = setTimeout(() => {
            setMyWorkRequests([
                { id: "REQ-001", description: "Lampu di ruang rapat mati", status: "In Progress", submittedDate: "2025-07-15", type: "General Repair" },
                { id: "REQ-002", description: "Kursi di meja saya goyang", status: "Open", submittedDate: "2025-07-16", type: "General Repair" },
            ]);
        }, 2000);

        return () => clearTimeout(fetchData);
    }, []);

    const statusBodyTemplate = (rowData) => { // Removed ': any' type annotation
        const getSeverity = (status) => { // Removed ': string' type annotation
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
                id: `REQ-${Math.floor(Math.random() * 1000)}`, // ID sementara
                description: newRequestDescription,
                type: newRequestType,
                status: "Open",
                submittedDate: new Date().toISOString().slice(0, 10)
            };
            setMyWorkRequests((prevRequests) => [...prevRequests, newRequest]); // Removed ': any' type annotation
            setNewRequestDescription('');
            setNewRequestType(null);
            setDisplayRequestDialog(false);
            // Menggunakan PrimeReact Toast sebagai pengganti alert
            toast.current.show({ severity: 'success', summary: 'Sukses', detail: 'Permintaan berhasil diajukan!', life: 3000 });
        } else {
            // Menggunakan PrimeReact Toast sebagai pengganti alert
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Harap isi deskripsi dan jenis permintaan.', life: 3000 });
        }
    };

    return (
        <>
            <Toast ref={toast} /> {/* Toast component added here */}
            <div className="card">
                <h2 className="font-semibold">Dashboard Karyawan</h2>
                <div className="grid">
                    <div className="col-12">
                        <Panel header="PERMINTAAN KERJA SAYA">
                            <div className="flex justify-content-end mb-3">
                                <Button label="Buat Permintaan Baru" icon="pi pi-plus" onClick={() => setDisplayRequestDialog(true)} />
                            </div>
                            <DataTable value={myWorkRequests} paginator rows={5} dataKey="id" emptyMessage="Anda belum mengajukan permintaan kerja.">
                                <Column field="id" header="ID Permintaan"></Column>
                                <Column field="description" header="Deskripsi"></Column>
                                <Column field="type" header="Jenis"></Column>
                                <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                                <Column field="submittedDate" header="Tanggal Diajukan"></Column>
                                {/* Mungkin ada kolom untuk melihat detail lebih lanjut */}
                            </DataTable>
                        </Panel>
                    </div>
                </div>

                <Dialog header="Buat Permintaan Kerja Baru" visible={displayRequestDialog} style={{ width: '50vw' }} onHide={() => setDisplayRequestDialog(false)} footer={
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
        </>
    );
};

export default EmployeeDashboardPage;
