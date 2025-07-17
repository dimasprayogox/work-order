/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useContext, useState, useRef } from "react";
import AppMenuitem from "./AppMenuitem";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import { Button } from "primereact/button";
import { usePathname } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const timeoutRef = useRef(null);

    const model = [
        {
            label: "Dashboard",
            items: [{ label: "Dashboard", icon: "pi pi-fw pi-home", to: "/" }]
        },
        {
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
        {
            label: "Assets",
            icon: "pi pi-fw pi-box",
            items: [{ label: "Asset Insights", icon: "pi pi-fw pi-box", to: "/assets/asset-insights" }]
        },
        {
            label: "Supplies",
            icon: "pi pi-fw pi-truck",
            items: [{ label: "Parts Forecaster", icon: "pi pi-fw pi-truck", to: "/supplies/parts-forecaster" }]
        },
        {
            label: "Analytics",
            icon: "pi pi-fw pi-chart-pie",
            items: [{ label: "Analytics", icon: "pi pi-fw pi-chart-pie", to: "/analytics" }]
        },
        {
            label: "Users",
            icon: "pi pi-fw pi-users",
            items: [
                { label: "Technician", icon: "pi pi-fw pi-user", to: "/Users-Technician" },
                { label: "Manager", icon: "pi pi-fw pi-user", to: "/Users-Manager" },
                { label: "Admin", icon: "pi pi-fw pi-user", to: "/Users-Admin" },
                { label: "Logistics", icon: "pi pi-fw pi-user", to: "/Users-Logistics" }
            ]
        }
    ];

    const handleMenuToggle = (index) => {
        setActiveMenu(activeMenu === index ? null : index);
    };

    const handleMouseEnter = (index) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setActiveMenu(index);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveMenu(null);
        }, 200);
    };

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    if (item.separator) {
                        return <li className="menu-separator" key={`separator-${i}`}></li>;
                    }

                    const hasSubmenu = item.items && item.items.length > 0;
                    const isActive = activeMenu === i;

                    return (
                        <li 
                            key={item.label}
                            className={`relative ${hasSubmenu ? 'has-submenu' : ''}`}
                            onMouseEnter={() => handleMouseEnter(i)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div
                                className={`layout-menuitem-root ${isActive ? 'active-menuitem' : ''}`}
                            >
                                <div 
                                    className="flex align-items-center py-3 px-2 cursor-pointer"
                                    onClick={() => hasSubmenu && handleMenuToggle(i)}
                                >
                                    {item.icon && <i className={`${item.icon} layout-menuitem-icon mr-2`}></i>}
                                    <span className="layout-menuitem-root-text">{item.label}</span>
                                    {hasSubmenu && (
                                        <i 
                                            className={`pi pi-chevron-down layout-submenu-toggler px-2 ml-auto ${isActive ? 'rotated' : ''}`}
                                        />
                                    )}
                                </div>
                            </div>

                            
                            <div className={`layout-submenu ${isActive ? 'submenu-visible' : ''}`}>
                                
                                {hasSubmenu && (
                                    <ul>
                                        {item.items.map((subItem, subIndex) => (
                                            <li key={subItem.label}>
                                                <a href={subItem.to} className="flex align-items-center py-2 px-4">
                                                    {subItem.icon && <i className={`${subItem.icon} layout-menuitem-icon mr-2`}></i>}
                                                    <span className="layout-menuitem-text">{subItem.label}</span>
                                                </a>
                                            </li>
                                        ))}
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
                <TabView>
                    <TabPanel className="text-xs" header="Settings">
                        <div className="grid">
                            <div className="col-12">
                                <label htmlFor="">Schedule Name</label>
                                <InputText className="w-full mt-3" placeholder="Active work orders dashboard" />
                            </div>
                            <div className="col-8">
                                <label htmlFor="">Recurrence</label>
                                <Dropdown className="w-full mt-3" />
                            </div>
                            <div className="col-4">
                                <label htmlFor="">Time</label>
                                <Dropdown className="w-full mt-3" />
                            </div>
                            <div className="col-12">
                                <label htmlFor="">Destination</label>
                                <Dropdown className="w-full mt-3" />
                            </div>
                            <div className="col-12">
                                <label htmlFor="">Email Addresses</label>
                                <InputText className="w-full mt-3" placeholder="Active work orders dashboard" />
                            </div>
                            <div className="col-12">
                                <label htmlFor="">Format</label>
                                <Dropdown className="w-full mt-3" />
                            </div>
                        </div>

                        <div className="flex justify-content-between mt-5">
                            <div>
                                <Button label="Test Now" outlined />
                            </div>
                            <div className="flex gap-2">
                                <Button label="Cancel" text />
                                <Button label="Save" severity="success" />
                            </div>
                        </div>
                    </TabPanel>
                    <TabPanel className="text-xs" header="Filters"></TabPanel>
                    <TabPanel className="text-xs" header="Advanced Options"></TabPanel>
                </TabView>
            </Dialog>

            <Button className={`${pathname !== "/analytics" ? "hidden" : ""} w-full mt-5`} label="Create Schedule" onClick={() => setVisible(true)} />
        </MenuProvider>
    );
};

export default AppMenu;