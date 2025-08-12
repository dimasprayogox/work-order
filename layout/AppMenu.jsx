/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useContext, useState, useEffect } from "react";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import { Button } from "primereact/button";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { classNames } from "primereact/utils";

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const pathname = usePathname();
    const router = useRouter(); // Tambahkan useRouter
    const [visible, setVisible] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [menuGroups, setMenuGroups] = useState([]);

    useEffect(() => {
        const authToken = Cookies.get("authToken");
        if (authToken) {
            try {
                const decodedToken = jwtDecode(authToken);
                const role = decodedToken.role;
                setUserRole(role);

                let groups = [];

                if (role === "admin") {
                    groups = [
                        {
                            label: "OVERVIEW",
                            items: [
                                {
                                    label: "Dashboard",
                                    icon: "pi pi-fw pi-home",
                                    to: "/admin/dashboard"
                                }
                            ]
                        },
                        {
                            label: "WORK MANAGEMENT",
                            items: [
                                {
                                    label: "Work Order Assignments",
                                    icon: "pi pi-fw pi-calendar-plus",
                                    to: "/admin/work-order-assignments"
                                },
                                {
                                    label: "Work Schedules",
                                    icon: "pi pi-fw pi-calendar",
                                    to: "/admin/schedules"
                                }
                            ]
                        },
                        {
                            label: "REQUESTS",
                            items: [
                                {
                                    label: "Parts Request",
                                    icon: "pi pi-fw pi-inbox",
                                    to: "/admin/part-requests"
                                },
                                {
                                    label: "Work Request",
                                    icon: "pi pi-fw pi-briefcase",
                                    to: "/admin/issues"
                                }
                            ]
                        },
                        {
                            label: "MACHINE MANAGEMENT",
                            items: [
                                {
                                    label: "Machine Categories",
                                    icon: "pi pi-fw pi-th-large",
                                    to: "/admin/machine-categories"
                                },
                                {
                                    label: "Machines",
                                    icon: "pi pi-fw pi-cog",
                                    to: "/admin/machines"
                                }
                            ]
                        },
                        {
                            label: "INVENTORY",
                            items: [
                                {
                                    label: "Parts",
                                    icon: "pi pi-fw pi-file",
                                    to: "/admin/parts"
                                }
                            ]
                        },
                        {
                            label: "USER MANAGEMENT",
                            items: [
                                {
                                    label: "Users",
                                    icon: "pi pi-fw pi-users",
                                    to: "/admin/users"
                                }
                            ]
                        }
                    ];
                } else if (role === "employee") {
                    groups = [
                        {
                            label: "OVERVIEW",
                            items: [
                                {
                                    label: "Dashboard",
                                    icon: "pi pi-fw pi-home",
                                    to: "/employee/dashboard"
                                }
                            ]
                        },
                        {
                            label: "WORK",
                            items: [
                                {
                                    label: "Work Orders",
                                    icon: "pi pi-fw pi-file",
                                    to: "/employee/work-orders"
                                }
                            ]
                        }
                    ];
                } else if (role === "technician") {
                    groups = [
                        {
                            label: "OVERVIEW",
                            items: [
                                {
                                    label: "Dashboard",
                                    icon: "pi pi-fw pi-home",
                                    to: "/technician/dashboard"
                                }
                            ]
                        },
                        {
                            label: "WORK",
                            items: [
                                {
                                    label: "Work Orders",
                                    icon: "pi pi-fw pi-file",
                                    to: "/technician/work-orders"
                                }
                            ]
                        },
                        {
                            label: "REQUESTS",
                            items: [
                                {
                                    label: "Parts Requests",
                                    icon: "pi pi-fw pi-inbox",
                                    to: "/technician/part-request"
                                }
                            ]
                        }
                    ];
                } else if (role === "logistics") {
                    groups = [
                        {
                            label: "OVERVIEW",
                            items: [
                                {
                                    label: "Dashboard",
                                    icon: "pi pi-fw pi-home",
                                    to: "/logistics/dashboard"
                                }
                            ]
                        },
                        {
                            label: "INVENTORY",
                            items: [
                                {
                                    label: "Parts",
                                    icon: "pi pi-fw pi-wrench",
                                    to: "/logistics/parts"
                                }
                            ]
                        },
                        {
                            label: "REQUESTS & USAGE",
                            items: [
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
                            ]
                        }
                    ];
                } else if (role === "manager") {
                    groups = [
                        {
                            label: "OVERVIEW",
                            items: [
                                {
                                    label: "Dashboard",
                                    icon: "pi pi-fw pi-home",
                                    to: "/manager/dashboard"
                                }
                            ]
                        },
                        {
                            label: "MANAGEMENT",
                            items: [
                                {
                                    label: "Work Orders",
                                    icon: "pi pi-fw pi-file",
                                    to: "/manager/work-orders"
                                },
                                {
                                    label: "Schedules",
                                    icon: "pi pi-fw pi-calendar",
                                    to: "/manager/schedules"
                                }
                            ]
                        }
                    ];
                }

                setMenuGroups(groups);
            } catch (error) {
                console.error("Gagal mendekode token atau token tidak valid:", error);
                setMenuGroups([]);
            }
        } else {
            setMenuGroups([]);
        }
    }, []);

    const handleNavigation = (e, to) => {
        e.preventDefault();
        router.push(to);
    };

    return (
        <MenuProvider>
            <div className="layout-menu">
                {menuGroups.map((group, groupIndex) => (
                    <div key={`group-${groupIndex}`} className="menu-group mb-4">
                        {/* Group Header */}
                        <div className="menu-group-header px-2 mb-2">
                            <span className="text-xs font-semibold text-color-secondary uppercase tracking-wider opacity-60">{group.label}</span>
                        </div>

                        {/* Group Items */}
                        <ul className="menu-group-items" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                            {group.items.map((item, itemIndex) => (
                                <li key={`${groupIndex}-${itemIndex}`} className="mb-1">
                                    <a
                                        href={item.to}
                                        onClick={(e) => handleNavigation(e, item.to)}
                                        className={classNames("flex align-items-center py-3 px-3 cursor-pointer rounded-lg transition-all duration-200 text-color-secondary hover:bg-primary-50 hover:text-primary group", {
                                            "bg-primary-50 text-primary shadow-sm": pathname === item.to
                                        })}
                                        style={{ textDecoration: "none" }}
                                    >
                                        {item.icon && (
                                            <i
                                                className={classNames("mr-3 text-lg transition-colors duration-200", item.icon, {
                                                    "text-primary": pathname === item.to,
                                                    "group-hover:text-primary": pathname !== item.to
                                                })}
                                            ></i>
                                        )}
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

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
