"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
    const [profile, setProfile] = useState(null);
    const router = useRouter();
    const toast = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);

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
                role: profileData.role,
                username: profileData.username || "",
                email: profileData.email || "",
                phone_number: profileData.phone_number || "",
                city: profileData.city || "",
                date_of_birth: profileData.date_of_birth ? new Date(profileData.date_of_birth) : null,
                address: profileData.address || "",
                bio: profileData.bio || "",
                profile_photo_url: profileData.profile_photo_url ? `${profileData.profile_photo_url}?t=${Date.now()}` : null
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

    // Fetch profile saat pertama kali
    useEffect(() => {
        fetchProfile();
    }, []);

    return <ProfileContext.Provider value={{ profile, setProfile, fetchProfile, isLoading }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
    return useContext(ProfileContext);
}
