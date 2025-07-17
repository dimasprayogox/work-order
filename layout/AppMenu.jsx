/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useContext, useState } from "react";
import AppMenuitem from "./AppMenuitem";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import Link from "next/link";
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

    const model = [
        {
            label: "Dashboard",
            items: [{ label: "Dashboard", icon: "pi pi-fw pi-home", to: "/" }]
        },
        {
            label: "Maintenance",
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
            items: [{ label: "Asset Insights", icon: "pi pi-fw pi-box", to: "/assets/asset-insights" }]
        },
        {
            label: "Supplies",
            items: [{ label: "Parts Forecaster", icon: "pi pi-fw pi-truck", to: "/supplies/parts-forecaster" }]
        },
        {
            label: "Analytics",
            items: [{ label: "Analytics", icon: "pi pi-fw pi-chart-pie", to: "/analytics" }]
        },
        {
            label: "Users",
            items: [
                { label: "Technician", icon: "pi pi-fw pi-user", to: "/Users-Technician" },
                { label: "Manager", icon: "pi pi-fw pi-user", to: "/Users-Manager" },
                { label: "Admin", icon: "pi pi-fw pi-user", to: "/Users-Admin" },
                { label: "Logistics", icon: "pi pi-fw pi-user", to: "/Users-Logistics" }
            ]
        }
        // {
        //     label: 'Pages',
        //     icon: 'pi pi-fw pi-briefcase',
        //     to: '/pages',
        //     items: [
        //         {
        //             label: 'Auth',
        //             icon: 'pi pi-fw pi-user',
        //             items: [
        //                 {
        //                     label: 'Login',
        //                     icon: 'pi pi-fw pi-sign-in',
        //                     to: '/auth/login'
        //                 },
        //                 {
        //                     label: 'Error',
        //                     icon: 'pi pi-fw pi-times-circle',
        //                     to: '/auth/error'
        //                 },
        //                 {
        //                     label: 'Access Denied',
        //                     icon: 'pi pi-fw pi-lock',
        //                     to: '/auth/access'
        //                 }
        //             ]
        //         }
        //     ]
        // }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
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
