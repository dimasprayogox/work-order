/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect, useCallback } from "react";
import { LayoutContext } from "./context/layoutcontext";
import { useProfile } from "./context/ProfileContext";

const AppTopbar = forwardRef((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { profile, fetchProfile } = useProfile();
    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

   useEffect(() => {
       fetchProfile();
   }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Logout failed");
            }

            localStorage.removeItem("token");
            sessionStorage.removeItem("token");

            window.location.href = "/auth/login";
        } catch (error) {
            console.error("Logout error:", error);
            alert(error.message || "Gagal logout. Silakan coba lagi.");
        }
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (topbarmenuRef.current && !topbarmenuRef.current.contains(event.target) && topbarmenubuttonRef.current && !topbarmenubuttonRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme !== "light" ? "white" : "dark"}.svg`} width="47.22px" height={"35px"} alt="logo" />
                <span>Work-Order</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <div className="layout-topbar-actions">
                <span>
                    {profile?.full_name || "-"} | {profile?.role || "-"}
                </span>
                {/* <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-calendar"></i>
                    <span>Calendar</span>
                </button> */}

                <div className="profile-dropdown-container">
                    <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-button profile-button" onClick={toggleProfileDropdown} aria-expanded={isProfileDropdownOpen}>
                        {profile?.profile_photo_url ? (
                            <img
                                src={profile.profile_photo_url}
                                key={profile.profile_photo_url}
                                alt="Profile"
                                className="profile-photo"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    objectFit: "cover"
                                }}
                            />
                        ) : (
                            <i className="pi pi-user"></i>
                        )}
                        <span>Profile</span>
                    </button>

                    {isProfileDropdownOpen && (
                        <div ref={topbarmenuRef} className="profile-dropdown">
                            <Link href="/profile" className="dropdown-item" onClick={toggleProfileDropdown}>
                                <i className="pi pi-user"></i>
                                <span>My Profile</span>
                            </Link>
                            {/* <Link href="/documentation" className="dropdown-item" onClick={toggleProfileDropdown}>
                                <i className="pi pi-cog"></i>
                                <span>Settings</span>
                            </Link> */}
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item logout-item" onClick={handleLogout}>
                                <i className="pi pi-sign-out"></i>
                                <span>Logout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

AppTopbar.displayName = "AppTopbar";

export default AppTopbar;
