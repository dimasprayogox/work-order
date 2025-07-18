/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import React, { useContext, useRef, useState } from "react";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { LayoutContext } from "../../../../layout/context/layoutcontext";
import { InputText } from "primereact/inputtext";
import { classNames } from "primereact/utils";
import { Toast } from 'primereact/toast'; 

const LoginPage = () => {
    // --- STATE ---
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- HOOKS ---
    const router = useRouter();
    const toastRef = useRef(null);
    const { layoutConfig } = useContext(LayoutContext); // 2. Dapatkan layoutConfig dari context

    // --- HANDLER ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await res.json();

            if (res.ok && result.status === "00") {
                 toastRef.current?.show({severity:'success', summary: 'Success', detail: result.message});
                console.log("Login sukses:", result.message);

                // --- MODIFIKASI DIMULAI DI SINI ---
                const userRole = result.role; // Ambil role langsung dari respons API

                // Definisikan path dasar untuk dashboard Anda
                const dashboardBasePath = "/dashboard"; // Ini akan mengarah ke (main)/dashboard/

                let redirectPath;

                switch (userRole) {
                    case "admin":
                        redirectPath = `${dashboardBasePath}/admin`; // Akan menjadi /dashboard/admin
                        break;
                    case "employee":
                        redirectPath = `${dashboardBasePath}/employee`; // Akan menjadi /dashboard/employee
                        break;
                    case "technician":
                        redirectPath = `${dashboardBasePath}/technician`; // Akan menjadi /dashboard/technician
                        break;
                    case "manager":
                        redirectPath = `${dashboardBasePath}/manager`; // Akan menjadi /dashboard/manager
                        break;
                    case "logistics":
                        redirectPath = `${dashboardBasePath}/logistics`; // Akan menjadi /dashboard/logistics
                        break;
                    default:
                        redirectPath = dashboardBasePath; // Fallback ke /dashboard jika role tidak dikenali
                        break;
                }
                router.push(redirectPath);

           
            } else {
               toastRef.current?.show({ severity: "error", summary: "Gagal", detail: result.message || "Email atau Password salah.", life: 3000 });
            }
        } catch (error) {
            console.error("Terjadi kesalahan:", error);
            // toastRef.current?.show({severity:'error', summary: 'Error', detail: 'Tidak dapat terhubung ke server.'});
        } finally {
            setLoading(false);
        }
    };

    const containerClassName = classNames("surface-ground flex align-items-center justify-content-center min-h-screen min-w-full overflow-hidden", { "p-input-filled": layoutConfig.inputStyle === "filled" });

    return (
        <div className={containerClassName}>
            <Toast ref={toastRef} />
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme === "light" ? "dark" : "white"}.svg`} alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
                <div
                    style={{
                        borderRadius: "56px",
                        padding: "0.3rem",
                        background: "linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)"
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: "53px" }}>
                        <div className="text-center mb-5">
                            <img src="/demo/images/login/avatar.png" alt="Image" height="50" className="mb-3" />
                            <div className="text-900 text-3xl font-medium mb-3">Selamat Datang</div>
                            <span className="text-600 font-medium">Masuk untuk melanjutkan</span>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-fluid">
                                <div className="mb-5">
                                    <label htmlFor="email1" className="block text-900 text-xl font-medium mb-2">
                                        Email
                                    </label>
                                    {/* 5. Hubungkan value dan onChange ke state email */}
                                    <InputText id="email1" type="text" placeholder="Alamat Email" className="w-full md:w-30rem" style={{ padding: "1rem" }} value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>

                                <div className="mb-5">
                                    <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                        Password
                                    </label>
                                    <Password
                                        inputId="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setErrorMsg("");
                                        }}
                                        placeholder="Password"
                                        toggleMask
                                        className="w-full"
                                        inputClassName="w-full p-3 md:w-30rem"
                                    ></Password>
                                </div>

                                <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                    <div className="flex align-items-center">
                                        <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2"></Checkbox>
                                        <label htmlFor="rememberme1">Ingat saya</label>
                                    </div>
                                    <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: "var(--primary-color)" }}>
                                        Lupa password?
                                    </a>
                                </div>

                                <Button type="submit" label="Sign In" className="w-full p-3 text-xl" loading={loading}></Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;