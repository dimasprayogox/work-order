/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useContext, useState, useEffect } from "react";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import { Button } from "primereact/button";
import { usePathname } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { classNames } from "primereact/utils";
import { all } from "axios";

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [model, setModel] = useState([]);

    useEffect(() => {
        const authToken = Cookies.get("authToken");
        if (authToken) {
            try {
                const decodedToken = jwtDecode(authToken);
                const role = decodedToken.role;
                setUserRole(role);

                // Definisikan semua kemungkinan menu
                const allMenus = {
                    dashboard: {
                        label: "Dashboard",
                        items: [
                            {
                                label: "Dashboard",
                                icon: "pi pi-fw pi-home",
                                to: `/dashboard/${role}`
                            }
                        ]
                    },
                    maintenance: {
                        label: "Maintenance",
                        icon: "pi pi-fw pi-cog",
                        items: [
                            { label: "Work Orders", icon: "pi pi-fw pi-file", to: "/maintenance/work-orders" },
                            { label: "Work Requests", icon: "pi pi-fw pi-file-edit", to: "/maintenance/work-orders/request" },
                            { label: "Scheduled Maintenance", icon: "pi pi-fw pi-calendar", to: "/maintenance/scheduled-maintenance" },
                            { label: "Active Work Order", icon: "pi pi-fw pi-home", to: "/maintenance/active-work-order" },
                            { label: "Closed Work Order", icon: "pi pi-fw pi-home", to: "/maintenance/closed-work-order" }
                        ]
                    },
                    assets: {
                        label: "Assets",
                        icon: "pi pi-fw pi-box",
                        items: [{ label: "Asset Insights", icon: "pi pi-fw pi-box", to: "/assets/asset-insights" }]
                    },
                    supplies: {
                        label: "Supplies",
                        icon: "pi pi-fw pi-truck",
                        items: [{ label: "Parts Forecaster", icon: "pi pi-fw pi-truck", to: "/supplies/parts-forecaster" }]
                    },
                    users: {
                        label: "Users",
                        icon: "pi pi-fw pi-users",
                        items: [{ label: "Users", icon: "pi pi-fw pi-user", to: "/users/admin" }]
                    }
                };

                let filteredModel = [];
                if (role === "admin") {
                    filteredModel = [allMenus.dashboard, allMenus.maintenance, allMenus.assets, allMenus.supplies, allMenus.users];
                } else if (role === "employee") {
                    filteredModel = [allMenus.dashboard.items[0], allMenus.maintenance.items[1]];
                } else if (role === "manager") {
                    const managerAllowedLabels = ["Work Orders", "Scheduled Maintenance"];
                    const managerMaintenanceItems = allMenus.maintenance.items.filter((item) => managerAllowedLabels.includes(item.label));

                    filteredModel = [
                        allMenus.dashboard.items[0],
                        {
                            ...allMenus.maintenance,
                            items: managerMaintenanceItems
                        }
                    ];
                } else if (role === "technician") {
                    filteredModel = [

                        {
                            label: "Dashboard",
                            icon: "pi pi-fw pi-home",
                            to: "/technician/dashboard"
                        },
                        {
                            label: "Work Orders",
                            icon: "pi pi-fw pi-file",
                            to: "/technician/work-orders"
                        },
                        {
                            label: "Parts Requests",
                            icon: "pi pi-fw pi-inbox",
                            to: "/technician/part-request"
                        }
                    ];
                } else if (role === "logistics") {
                    filteredModel = [
                        allMenus.dashboard.items[0],
                        {
                            label: "Dashboard",
                            icon: "pi pi-fw pi-home",
                            to: "/dashboard/logistics"
                        },
                        {
                            label: "Parts",
                            icon: "pi pi-fw pi-wrench",
                            to: "/logistics/parts"
                        },
                        {
                            label: "Part Requests",
                            icon: "pi pi-fw pi-inbox",
                            to: "/logistics/part-requests"
                        },
                        {
                            label: "Part Usage",
                            icon: "pi pi-fw pi-chart-bar",
                            to: "/logistics/part-usage"
                        }
                    ];
                }

                setModel(filteredModel);
            } catch (error) {
                console.error("Gagal mendekode token atau token tidak valid:", error);
                setModel([]);
            }
        } else {
            setModel([]);
        }
    }, []);

    const handleMenuToggle = (index) => {
        setActiveMenu(activeMenu === index ? null : index);
    };

    return (
        <MenuProvider>
            <ul className="layout-menu" style={{ listStyle: "none" }}>
                {model.map((item, i) => {
                    if (!item) return null;

                    if (item.separator) {
                        return <li className="menu-separator" key={`separator-${i}`}></li>;
                    }

                    const hasSubmenu = item.items && item.items.length > 0;

                    // Render sebagai link langsung jika tidak ada submenu
                    if (!hasSubmenu) {
                        return (
                            <li key={item.label}>
                                <a
                                    href={item.to}
                                    className={classNames("p-ripple flex align-items-center py-3 px-2 cursor-pointer rounded-md transition-colors duration-150 text-color-secondary hover:bg-primary-50 hover:text-primary", {
                                        "bg-primary-50 text-primary": pathname === item.to
                                    })}
                                >
                                    {item.icon && <i className={classNames("layout-menuitem-icon mr-2", item.icon)}></i>}
                                    <span className="layout-menuitem-root-text font-medium">{item.label}</span>
                                </a>
                            </li>
                        );
                    }

                    // Render sebagai grup dropdown jika ada submenu
                    const isActive = activeMenu === i;
                    return (
                        // FIX: Mengembalikan struktur dan kelas asli untuk dropdown
                        <li key={item.label} className={`relative ${hasSubmenu ? "has-submenu" : ""}`}>
                            <div className={`layout-menuitem-root ${isActive ? "active-menuitem" : ""}`}>
                                <div className="flex align-items-center py-3 px-2 cursor-pointer" onClick={() => hasSubmenu && handleMenuToggle(i)}>
                                    {item.icon && <i className={`${item.icon} layout-menuitem-icon mr-2`}></i>}
                                    <span className="layout-menuitem-root-text">{item.label}</span>
                                    {hasSubmenu && <i className={`pi pi-chevron-down layout-submenu-toggler px-2 ml-auto ${isActive ? "rotated" : ""}`} />}
                                </div>
                            </div>
                            <div className={`layout-submenu ${isActive ? "submenu-visible" : ""}`} style={{ listStyle: "none" }}>
                                {hasSubmenu && (
                                    <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                        {item.items.map(
                                            (subItem) =>
                                                subItem && (
                                                    <li key={subItem.label}>
                                                        <a
                                                            href={subItem.to}
                                                            className={classNames("p-ripple flex align-items-center py-2 px-4 rounded-md transition-colors duration-150 text-color-secondary hover:bg-primary-50 hover:text-primary", {
                                                                "bg-primary-50 text-primary": pathname === subItem.to
                                                            })}
                                                        >
                                                            {subItem.icon && <i className={classNames("layout-menuitem-icon mr-2", subItem.icon)}></i>}
                                                            <span className="layout-menuitem-text">{subItem.label}</span>
                                                        </a>
                                                    </li>
                                                )
                                        )}
                                    </ul>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            <Dialog
                header="Schedule Delivery"
                visible={visible}
                onHide={() => {
                    if (!visible) return;
                    setVisible(false);
                }}
                style={{ width: "50vw" }}
            >
                {/* ... Konten Dialog ... */}
            </Dialog>

            <Button className={`${pathname !== "/analytics" ? "hidden" : ""} w-full mt-5`} label="Create Schedule" onClick={() => setVisible(true)} />
        </MenuProvider>
    );
};

export default AppMenu;
