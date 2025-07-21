// app/(main)/profile/edit/page.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Calendar } from 'primereact/calendar';
import { Avatar } from 'primereact/avatar';
import { FileUpload } from 'primereact/fileupload';
import { useRouter } from 'next/navigation';

function Page() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null); 
    const [previewUrl, setPreviewUrl] = useState(null); 
    const toast = useRef(null);
    const fileInputRef = useRef(null); 
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("http://localhost:3100/api/user-detail", {
                    credentials: "include"
                });

                if (res.ok) {
                    const result = await res.json();
                    const fetchedProfile = {
                        ...result.data,
                        date_of_birth: result.data.date_of_birth ? new Date(result.data.date_of_birth) : null
                    };
                    setProfile(fetchedProfile);
                    setPreviewUrl(fetchedProfile.profile_photo_url || null);
                } else if (res.status === 401) {
                    router.push("/auth/login");
                } else {
                    toast.current.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Gagal memuat data profil.',
                        life: 3000
                    });
                    setProfile({});
                }
            } catch (err) {
                console.error("Gagal mengambil data profil:", err);
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Terjadi kesalahan jaringan saat memuat profil.',
                    life: 3000
                });
                setProfile({});
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();

        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [router, previewUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prevProfile) => ({
            ...prevProfile,
            [name]: value,
        }));
    };

    const handleDateChange = (e) => {
        setProfile((prevProfile) => ({
            ...prevProfile,
            date_of_birth: e.value,
        }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setPreviewUrl(profile?.profile_photo_url || null); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const formData = new FormData();

            for (const key in profile) {
                if (profile.hasOwnProperty(key)) {
                    if (key === 'date_of_birth' && profile[key] instanceof Date) {
                        formData.append(key, profile[key].toISOString().split('T')[0]); 
                    } else if (key !== 'profile_photo_url') { 
                        formData.append(key, profile[key]);
                    }
                }
            }

            if (selectedFile) {
                formData.append('photo', selectedFile);
            }

            const res = await fetch("http://localhost:3100/api/user-detail", {
                method: 'PATCH',
                
                body: formData,
                credentials: "include"
            });

            if (res.ok) {
                const updatedProfileData = await res.json(); 
                setProfile(prev => ({
                    ...prev,
                    ...updatedProfileData.data, 
                    date_of_birth: updatedProfileData.data.date_of_birth ? new Date(updatedProfileData.data.date_of_birth) : null
                }));
                setPreviewUrl(updatedProfileData.data.profile_photo_url || null);
                setSelectedFile(null);
                toast.current.show({
                    severity: 'success',
                    summary: 'Berhasil',
                    detail: 'Profil berhasil diperbarui!',
                    life: 3000
                });
                router.push("/dashboard/profile");
            } else {
                const errorData = await res.json();
                toast.current.show({
                    severity: 'error',
                    summary: 'Gagal',
                    detail: errorData.message || 'Gagal memperbarui profil.',
                    life: 3000
                });
            }
        } catch (err) {
            console.error("Gagal memperbarui profil:", err);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Terjadi kesalahan jaringan saat memperbarui profil.',
                life: 3000
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
                <p className="ml-3">Memuat data profil...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center p-5">
                <Toast ref={toast} />
                <p>Gagal memuat profil. Silakan coba lagi.</p>
                <Button label="Kembali ke Profil" icon="pi pi-arrow-left" className="mt-4" onClick={() => router.push("/dashboard/profile")} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6 font-sans">
            <Toast ref={toast} />
            <Card className="w-full md:w-30rem lg:w-40rem mx-auto">
                <div className="flex justify-content-between align-items-center mb-6">
                    <Button
                        icon="pi pi-arrow-left"
                        label="Kembali"
                        className="p-button-text p-button-secondary"
                        onClick={() => router.push("/dashboard/profile")}
                    />
                    <h1 className="text-2xl font-bold text-center flex-grow">Edit Profil</h1>
                    <div style={{ width: '80px' }}></div>
                </div>

                <form onSubmit={handleSubmit} className="p-fluid">
                    <div className="flex flex-column align-items-center mb-6">
                        <Avatar
                            image={previewUrl || "https://placehold.co/120x120/E0E0E0/808080?text=No+Image"}
                            label={profile.full_name ? profile.full_name.charAt(0) : "U"}
                            size="xlarge"
                            shape="circle"
                            className="mb-3"
                            onImageError={(e) => {
                                e.target.src = "https://placehold.co/120x120/E0E0E0/808080?text=No+Image";
                            }}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <Button
                            label="Ubah Foto Profil"
                            icon="pi pi-upload"
                            className="p-button-outlined"
                            onClick={() => fileInputRef.current.click()}
                            type="button"
                        />
                        {selectedFile && (
                            <small className="mt-2 text-gray-600">File dipilih: {selectedFile.name}</small>
                        )}
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <InputText
                            id="full_name"
                            name="full_name"
                            value={profile.full_name || ''}
                            onChange={handleChange}
                            className="w-full"
                            required
                        />
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <InputText
                            id="username"
                            name="username"
                            value={profile.username || ''}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <InputText
                            id="email"
                            name="email"
                            type="email"
                            value={profile.email || ''}
                            onChange={handleChange}
                            className="w-full"
                            required
                        />
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                        <InputText
                            id="phone_number"
                            name="phone_number"
                            value={profile.phone_number || ''}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                        <InputTextarea
                            id="address"
                            name="address"
                            rows={3}
                            value={profile.address || ''}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
                        <InputText
                            id="city"
                            name="city"
                            value={profile.city || ''}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>
                    <div className="field mb-4">
                        <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                        <Calendar
                            id="date_of_birth"
                            name="date_of_birth"
                            value={profile.date_of_birth}
                            onChange={handleDateChange}
                            dateFormat="dd/mm/yy"
                            showIcon
                            className="w-full"
                        />
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <InputTextarea
                            id="bio"
                            name="bio"
                            rows={4}
                            value={profile.bio || ''}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>

                    <Button
                        type="submit"
                        label={isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                        icon={isSaving ? "pi pi-spin pi-spinner" : "pi pi-check"}
                        className="w-full mt-4"
                        disabled={isSaving}
                    />
                </form>
            </Card>
        </div>
    );
}

export default Page;
