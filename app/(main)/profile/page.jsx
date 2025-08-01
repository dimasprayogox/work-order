"use client";
import React, { useEffect, useState, useCallback } from "react"; 
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Divider } from "primereact/divider";
import { Chip } from "primereact/chip";
import { useRouter } from "next/navigation";
import { ProgressSpinner } from "primereact/progressspinner";

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const fetchProfile = useCallback(async () => {
        setIsLoading(true); 
        try {
            const res = await fetch("/api/profile", { 
                credentials: "include"
            });

            if (res.ok) {
                const result = await res.json();
                setUser(result.data);
            } else {
                router.push("/auth/login");
            }
        } catch (err) {
            console.error("Gagal mengambil data profil:", err);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]); 

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

   if (isLoading) {
       return (
           <div className="flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
               <ProgressSpinner animationDuration=".5s" />
           </div>
       );
   }

   if (error || !user) {
       return (
           <div className="flex flex-column justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
               <i className="pi pi-exclamation-circle text-6xl text-red-500 mb-3"></i>
               <h3 className="text-2xl font-medium">Gagal Memuat Profil</h3>
               <p className="text-600 mb-3">{error || "Tidak dapat mengambil data pengguna."}</p>
               <Button label="Coba Lagi" icon="pi pi-refresh" className="p-button-text" onClick={fetchProfile} />
           </div>
       );
   }

    return (
        <div className="flex justify-content-center p-3 md:p-5">
            <Card className="w-full max-w-4xl shadow-3 border-round-xl">
                {/* Header Section */}
                <div className="flex flex-column md:flex-row align-items-center gap-5 p-5 pb-0">
                    <div className="relative">
                        <Avatar image={user.profile_photo_url} label={user.full_name?.charAt(0) || "U"} size="xlarge" shape="circle" className="border-2 border-primary" style={{ width: "120px", height: "120px", fontSize: "3rem" }} />
                        <Chip label={user.role} className="absolute -bottom-2 left-50 transform -translate-x-50 shadow-2" style={{ minWidth: "80px" }} />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-bold mb-2 text-900">{user.full_name}</h1>
                        {user.bio && <p className="text-700 italic border-left-3 border-primary pl-3">&quot;{user.bio}&quot;</p>}
                    </div>

                    <Button label="Edit Profil" icon="pi pi-user-edit" className="p-button-rounded p-button-outlined align-self-start md:align-self-center" onClick={() => router.push("/profile/edit")} />
                </div>

                <Divider className="my-4" />

                {/* Main Content */}
                <div className="grid p-5 pt-0">
                    {/* Contact Information */}
                    <div className="col-12 md:col-6">
                        <div className="surface-100 p-4 border-round-lg h-full">
                            <h3 className="text-xl font-semibold mb-4 flex align-items-center gap-2">
                                <i className="pi pi-id-card text-primary"></i>
                                <span>Informasi Kontak</span>
                            </h3>
                            <ul className="list-none p-0 m-0">
                                <li className="flex align-items-start gap-3 mb-3">
                                    <i className="pi pi-user text-600 mt-1"></i>
                                    <div className="flex-1">
                                        <span className="block text-600 text-sm">Username</span>
                                        <span className="font-medium">{user.username || "-"}</span>
                                    </div>
                                </li>
                                <li className="flex align-items-start gap-3 mb-3">
                                    <i className="pi pi-envelope text-600 mt-1"></i>
                                    <div className="flex-1">
                                        <span className="block text-600 text-sm">Email</span>
                                        <span className="font-medium">{user.email || "-"}</span>
                                    </div>
                                </li>
                                <li className="flex align-items-start gap-3">
                                    <i className="pi pi-phone text-600 mt-1"></i>
                                    <div className="flex-1">
                                        <span className="block text-600 text-sm">Telepon</span>
                                        <span className="font-medium">{user.phone_number || "-"}</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="col-12 md:col-6 mt-4 md:mt-0">
                        <div className="surface-100 p-4 border-round-lg h-full">
                            <h3 className="text-xl font-semibold mb-4 flex align-items-center gap-2">
                                <i className="pi pi-info-circle text-primary"></i>
                                <span>Detail Pribadi</span>
                            </h3>
                            <ul className="list-none p-0 m-0">
                                <li className="flex align-items-start gap-3 mb-3">
                                    <i className="pi pi-map-marker text-600 mt-1"></i>
                                    <div className="flex-1">
                                        <span className="block text-600 text-sm">Alamat</span>
                                        <span className="font-medium">{user.address || "-"}</span>
                                    </div>
                                </li>
                                <li className="flex align-items-start gap-3 mb-3">
                                    <i className="pi pi-building text-600 mt-1"></i>
                                    <div className="flex-1">
                                        <span className="block text-600 text-sm">Kota</span>
                                        <span className="font-medium">{user.city || "-"}</span>
                                    </div>
                                </li>
                                <li className="flex align-items-start gap-3">
                                    <i className="pi pi-calendar text-600 mt-1"></i>
                                    <div className="flex-1">
                                        <span className="block text-600 text-sm">Tanggal Lahir</span>
                                        <span className="font-medium">{formatDate(user.date_of_birth)}</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ProfilePage;
