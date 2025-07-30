"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Calendar } from "primereact/calendar";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { useRouter } from "next/navigation";

function EditProfilePage() {
    // State management
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Refs and Hooks
    const toast = useRef(null);
    const fileInputRef = useRef(null);
    const router = useRouter();

    // PERBAIKAN 1: Bungkus fungsi fetch dengan useCallback
    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            // Gunakan path relatif, bukan URL hardcoded
            const res = await fetch("/api/user-detail", {
                credentials: "include"
            });

            if (res.ok) {
                const result = await res.json();
                const fetchedProfile = {
                    ...result.data,
                    date_of_birth: result.data.date_of_birth ? new Date(result.data.date_of_birth) : null
                };
                setProfile(fetchedProfile);
                setPreviewUrl(fetchedProfile.profile_photo_url);
            } else if (res.status === 401) {
                toast.current.show({ severity: "warn", summary: "Sesi Habis", detail: "Silakan login kembali.", life: 3000 });
                router.push("/auth/login");
            } else {
                throw new Error("Gagal memuat data profil.");
            }
        } catch (err) {
            console.error("Gagal mengambil data profil:", err);
            toast.current.show({ severity: "error", summary: "Error", detail: err.message || "Terjadi kesalahan jaringan.", life: 3000 });
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [router]); // Tambahkan router sebagai dependensi

    // PERBAIKAN 2: Gunakan useCallback di dependency array
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // PERBAIKAN 3: Pisahkan useEffect untuk cleanup URL untuk menghindari loop
    useEffect(() => {
        // Fungsi cleanup ini akan berjalan setiap kali previewUrl berubah,
        // dan juga saat komponen di-unmount, untuk mencegah memory leak.
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Handlers for form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e) => {
        setProfile((prev) => ({ ...prev, date_of_birth: e.value }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Buat URL preview baru. useEffect di atas akan membersihkan URL lama secara otomatis.
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const formData = new FormData();
        Object.keys(profile).forEach(key => {
            if (key === 'date_of_birth' && profile[key]) {
                formData.append(key, profile[key].toISOString().split("T")[0]);
            } else if (profile[key] !== null && key !== 'profile_photo_url') {
                formData.append(key, profile[key]);
            }
        });

        if (selectedFile) {
            formData.append("photo", selectedFile);
        }

        try {
            const res = await fetch("/api/user-detail", {
                method: "PUT",
                body: formData,
                credentials: "include"
            });

            const responseData = await res.json();

            if (res.ok) {
                toast.current.show({
                    severity: "success",
                    summary: "Berhasil",
                    detail: "Profil berhasil diperbarui!",
                    life: 2000
                });
                setTimeout(() => {
                    router.push("/profile");
                }, 1500);
            } else {
                throw new Error(responseData.message || "Gagal memperbarui profil.");
            }
        } catch (err) {
            console.error("Gagal memperbarui profil:", err);
            toast.current.show({
                severity: "error",
                summary: "Gagal",
                detail: err.message,
                life: 3000
            });
        } finally {
            setIsSaving(false);
        }
    };

    // === RENDER LOGIC ===

    if (isLoading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
                <ProgressSpinner />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-column justify-content-center align-items-center gap-3" style={{ minHeight: "80vh" }}>
                <Toast ref={toast} />
                <i className="pi pi-exclamation-triangle text-6xl text-orange-500"></i>
                <h3 className="text-2xl font-medium">Gagal Memuat Profil</h3>
                <p className="text-600">Tidak dapat mengambil data. Silakan coba lagi nanti.</p>
                <Button label="Kembali" icon="pi pi-arrow-left" onClick={() => router.back()} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <Toast ref={toast} />
            <Card className="w-full max-w-4xl mx-auto shadow-2">
                <div className="flex justify-content-between align-items-center mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold m-0">Edit Profil</h1>
                    <Button label="Batal" icon="pi pi-times" className="p-button-text p-button-danger" onClick={() => router.push("/profile")} />
                </div>
                <Divider />

                <form onSubmit={handleSubmit}>
                    {/* Profile Photo Section */}
                    <div className="flex flex-column align-items-center my-5">
                        <Avatar
                            image={previewUrl}
                            size="xlarge"
                            shape="circle"
                            className="mb-3"
                            style={{ width: "120px", height: "120px" }}
                            onImageError={(e) => {
                                e.target.src = "https://placehold.co/120x120/EFEFEF/787878?text=No+Image";
                            }}
                        />
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
                        <Button label="Ubah Foto" icon="pi pi-upload" className="p-button-outlined" onClick={() => fileInputRef.current.click()} type="button" />
                        {selectedFile && <small className="mt-2 text-600">File baru: {selectedFile.name}</small>}
                    </div>

                    {/* Form Fields using a Grid Layout */}
                    <div className="grid formgrid p-fluid p-3">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="full_name">Nama Lengkap</label>
                            <InputText id="full_name" name="full_name" value={profile.full_name || ""} onChange={handleChange} required />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="username">Username</label>
                            <InputText id="username" name="username" value={profile.username || ""} onChange={handleChange} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="email">Email</label>
                            <InputText id="email" name="email" type="email" value={profile.email || ""} onChange={handleChange} required />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="phone_number">Telepon</label>
                            <InputText id="phone_number" name="phone_number" value={profile.phone_number || ""} onChange={handleChange} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="city">Kota</label>
                            <InputText id="city" name="city" value={profile.city || ""} onChange={handleChange} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="date_of_birth">Tanggal Lahir</label>
                            <Calendar id="date_of_birth" name="date_of_birth" value={profile.date_of_birth} onChange={handleDateChange} dateFormat="dd/mm/yy" showIcon />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="address">Alamat</label>
                            <InputTextarea id="address" name="address" rows={3} value={profile.address || ""} onChange={handleChange} />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="bio">Bio</label>
                            <InputTextarea id="bio" name="bio" rows={4} value={profile.bio || ""} onChange={handleChange} />
                        </div>
                    </div>

                    <Divider />

                    <div className="flex justify-content-end mt-4">
                        <Button type="submit" label={isSaving ? "Menyimpan..." : "Simpan Perubahan"} icon={isSaving ? "pi pi-spin pi-spinner" : "pi pi-check"} disabled={isSaving} />
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default EditProfilePage;
