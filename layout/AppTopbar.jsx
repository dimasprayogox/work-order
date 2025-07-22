/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { classNames } from "primereact/utils";
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from "react"; 
import { LayoutContext } from "./context/layoutcontext";
import { API_ENDPOINTS } from "../app/api/api";

const AppTopbar = forwardRef((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const handleLogout = async () => {
        await fetch(API_ENDPOINTS.LOGOUT, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        });
        window.location.href = "/auth/login";
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (topbarmenuRef.current && !topbarmenuRef.current.contains(event.target) &&
                topbarmenubuttonRef.current && !topbarmenubuttonRef.current.contains(event.target)) {
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
                <span>ArthaTrack</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <div className="layout-topbar-actions">
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-calendar"></i>
                    <span>Calendar</span>
                </button>

                <div className="profile-dropdown-container">
                    <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-button profile-button" onClick={toggleProfileDropdown} aria-expanded={isProfileDropdownOpen}>
                        <i className="pi pi-user"></i>
                        <span>Profile</span>
                    </button>

                    {isProfileDropdownOpen && (
                        <div ref={topbarmenuRef} className="profile-dropdown">
                            <Link href="/profile" className="dropdown-item" onClick={toggleProfileDropdown}>
                                <i className="pi pi-user"></i>
                                <span>My Profile</span>
                            </Link>
                            <Link href="/documentation" className="dropdown-item" onClick={toggleProfileDropdown}>
                                <i className="pi pi-cog"></i>
                                <span>Settings</span>
                            </Link>
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