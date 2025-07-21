"use client";
import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { Chip } from "primereact/chip";
import { useRouter } from "next/navigation";

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                
                const res = await fetch("http://localhost:3100/api/user-detail", {
                    
                    credentials: "include"
                });

                if (res.ok) {
                    const result = await res.json();
                    setUser(result.data);
                } else {
                    // Jika gagal (misal: 401 Unauthorized), redirect ke login
                    router.push("/auth/login");
                }
            } catch (err) {
                console.error("Gagal mengambil data profil:", err);
                setUser(null);
            } finally {
                // Hentikan loading terlepas dari berhasil atau gagal
                setIsLoading(false);
            }
        };
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tampilan saat data sedang diambil
    if (isLoading) {
        return <div className="text-center p-5">Loading...</div>;
    }

    // Tampilan jika data gagal diambil setelah loading selesai
    if (!user) {
        return <div className="text-center p-5">Gagal memuat profil. Silakan coba lagi.</div>;
    }

    // Fungsi untuk memformat tanggal
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const header = (
        <div className="flex flex-column align-items-center gap-3 pt-5">
            <Avatar image={user.profile_photo_url} label={user.full_name ? user.full_name.charAt(0) : "U"} size="xlarge" shape="circle" />
            <div>
                <h2 className="text-2xl font-bold mb-1">{user.full_name}</h2>
                <div className="text-center">
                    <Chip label={user.role} className="text-sm" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6">
            <Card header={header} className="w-full md:w-30rem lg:w-40rem mx-auto">
                <Divider />
                <div className="p-3">
                    <h3 className="font-semibold text-lg mb-4">Informasi Kontak</h3>
                    <ul className="list-none p-0 m-0">
                        <li className="flex justify-content-between mb-3">
                            <span className="font-medium text-600">Username</span>
                            <span className="text-900">{user.username || "-"}</span>
                        </li>
                        <li className="flex justify-content-between mb-3">
                            <span className="font-medium text-600">Email</span>
                            <span className="text-900">{user.email || "-"}</span>
                        </li>
                        <li className="flex justify-content-between mb-3">
                            <span className="font-medium text-600">Telepon</span>
                            <span className="text-900">{user.phone_number || "-"}</span>
                        </li>
                    </ul>
                </div>
                <Divider />
                <div className="p-3">
                    <h3 className="font-semibold text-lg mb-4">Detail Pribadi</h3>
                    <ul className="list-none p-0 m-0">
                        <li className="flex justify-content-between mb-3">
                            <span className="font-medium text-600">Alamat</span>
                            <span className="text-900 text-right">{user.address || "-"}</span>
                        </li>
                        <li className="flex justify-content-between mb-3">
                            <span className="font-medium text-600">Kota</span>
                            <span className="text-900">{user.city || "-"}</span>
                        </li>
                        <li className="flex justify-content-between mb-3">
                            <span className="font-medium text-600">Tanggal Lahir</span>
                            <span className="text-900">{formatDate(user.date_of_birth)}</span>
                        </li>
                        <li className="flex flex-column mb-3">
                            <span className="font-medium text-600 mb-2">Bio</span>
                            <p className="text-900 m-0 text-sm">{user.bio || "Bio belum diisi."}</p>
                        </li>
                    </ul>
                </div>
                <Divider />
                <div className="p-3 text-center">
                    <Button label="Edit Profil" icon="pi pi-user-edit" className="p-button-raised" onClick={() => router.push("/profile/edit")} />
                </div>
            </Card>
        </div>
    );
};

export default ProfilePage;
