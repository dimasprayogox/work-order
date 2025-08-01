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
    const [profile, setProfile] = useState({
        full_name: "",
        username: "",
        email: "",
        phone_number: "",
        city: "",
        date_of_birth: null,
        address: "",
        bio: "",
        profile_photo_url: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [errors, setErrors] = useState({});

    // Refs and Hooks
    const toast = useRef(null);
    const fileInputRef = useRef(null);
    const router = useRouter();

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/profile", {
                credentials: "include"
            });

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error("Unauthorized");
                }
                throw new Error("Failed to fetch profile");
            }

            const result = await res.json();
            const profileData = result.data || result;

            setProfile({
                full_name: profileData.full_name || "",
                username: profileData.username || "",
                email: profileData.email || "",
                phone_number: profileData.phone_number || "",
                city: profileData.city || "",
                date_of_birth: profileData.date_of_birth ? new Date(profileData.date_of_birth) : null,
                address: profileData.address || "",
                bio: profileData.bio || "",
                profile_photo_url: profileData.profile_photo_url || null
            });
            setPreviewUrl(profileData.profile_photo_url || null);
        } catch (err) {
            console.error("Failed to fetch profile:", err);

            if (err.message === "Unauthorized") {
                toast.current?.show({
                    severity: "warn",
                    summary: "Session Expired",
                    detail: "Please login again.",
                    life: 3000
                });
                router.push("/auth/login");
                return;
            }

            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to load profile data",
                life: 3000
            });
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleDateChange = (e) => {
        const value = Array.isArray(e.value) ? e.value[0] : e.value;
        setProfile((prev) => ({ ...prev, date_of_birth: value }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        if (!profile.full_name.trim()) {
            newErrors.full_name = "Nama lengkap harus diisi";
            isValid = false;
        }

        if (!profile.email.trim()) {
            newErrors.email = "Email harus diisi";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
            newErrors.email = "Format email tidak valid";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const formData = new FormData();

            // Append all profile data
            for (const [key, value] of Object.entries(profile)) {
                if (key === "date_of_birth" && value instanceof Date) {
                    formData.append(key, value.toISOString().split("T")[0]);
                } else if (value !== null && value !== undefined && key !== "profile_photo_url") {
                    formData.append(key, value);
                }
            }

            // Append the file if selected
            if (selectedFile) {
                formData.append("photo", selectedFile);
            }

            const res = await fetch("/api/profile", {
                method: "PATCH",
                body: formData,
                credentials: "include"
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Backend error response:", errorData);

                // Handle validation errors from server
                if (errorData.errors) {
                    setErrors((prev) => ({
                        ...prev,
                        ...errorData.errors
                    }));
                    throw new Error("Terdapat kesalahan dalam form");
                }
                throw new Error(errorData.message || "Gagal memperbarui profil");
            }

            const responseData = await res.json();
            console.log("Profile update success:", responseData);

            // Tampilkan toast sukses
            toast.current?.show({
                severity: "success",
                summary: "Berhasil",
                detail: "Profil berhasil diperbarui!",
                life: 2000
            });
            setTimeout(() => {
                router.refresh(); // Refresh halaman tanpa reload penuh
            }, 1000);

        } catch (err) {
            console.error("Gagal memperbarui profil:", err);
            toast.current?.show({
                severity: "error",
                summary: "Gagal",
                detail: err.message || "Terjadi kesalahan saat memperbarui profil",
                life: 3000
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
                <ProgressSpinner />
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
                        <Avatar image={previewUrl || "https://placehold.co/120x120/EFEFEF/787878?text=No+Image"} size="xlarge" shape="circle" className="mb-3" style={{ width: "120px", height: "120px" }} />
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
                        <Button label="Ubah Foto" icon="pi pi-upload" className="p-button-outlined" onClick={() => fileInputRef.current?.click()} type="button" />
                        {selectedFile && <small className="mt-2 text-600">File baru: {selectedFile.name}</small>}
                    </div>

                    {/* Form Fields */}
                    <div className="grid formgrid p-fluid p-3">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="full_name">Nama Lengkap*</label>
                            <InputText id="full_name" name="full_name" value={profile.full_name} onChange={handleChange} className={errors.full_name ? "p-invalid" : ""} required />
                            {errors.full_name && <small className="p-error">{errors.full_name}</small>}
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="username">Username</label>
                            <InputText id="username" name="username" value={profile.username} onChange={handleChange} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="email">Email*</label>
                            <InputText id="email" name="email" type="email" value={profile.email} onChange={handleChange} className={errors.email ? "p-invalid" : ""} required />
                            {errors.email && <small className="p-error">{errors.email}</small>}
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="phone_number">Telepon</label>
                            <InputText id="phone_number" name="phone_number" value={profile.phone_number} onChange={handleChange} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="city">Kota</label>
                            <InputText id="city" name="city" value={profile.city} onChange={handleChange} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="date_of_birth">Tanggal Lahir</label>
                            <Calendar id="date_of_birth" name="date_of_birth" value={profile.date_of_birth} onChange={handleDateChange} dateFormat="dd/mm/yy" showIcon yearRange="1900:2030" />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="address">Alamat</label>
                            <InputTextarea id="address" name="address" rows={3} value={profile.address} onChange={handleChange} />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="bio">Bio</label>
                            <InputTextarea id="bio" name="bio" rows={4} value={profile.bio} onChange={handleChange} />
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
