// app/components/SidebarClient.tsx
"use client";

import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { useState, useEffect } from "react";
import { Tree } from "primereact/tree";

import { usePathname } from "next/navigation";
import { Divider } from "primereact/divider";

export default function SidebarClient() {
    const pathname = usePathname();
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const [timeAgo, setTimeAgo] = useState("just now");
    const [visible, setVisible] = useState(false);

    const [nodes] = useState([
        {
            key: "folders",
            label: "Folders",
            children: [
                { key: "asset-insights", label: "Asset Insights" },
                { key: "asset-risk-predictor", label: "Asset Risk Predictor" },
                { key: "classic-dashboards", label: "Classic dashboards" },
                { key: "parts-forecast", label: "Parts Forecast" },
                { key: "popular-reports", label: "Popular reports" },
                { key: "work-order-insights", label: "Work Order Insights" }
            ]
        },
        {
            key: "dashboards",
            label: "Dashboards",
            children: [
                { key: "active-work-orders", label: "Active work orders dashboard" },
                { key: "analytics-dashboard-list", label: "Analytics dashboard list" },
                { key: "analytics-permissions", label: "Analytics permissions" },
                { key: "asset-insights-selector", label: "Asset insights selector" },
                { key: "blank-dashboard", label: "Blank dashboard" },
                { key: "data-quality", label: "Data quality for active work orders" }
            ]
        }
    ]);

    const nodeTemplate = (node) => {
        let iconClass = "";

        if (node.parent?.key === "folders" || node.key === "folders") {
            iconClass = "pi pi-folder";
        } else if (node.parent?.key === "dashboards" || node.key === "dashboards") {
            iconClass = "pi pi-th-large"; // Better dashboard-looking icon
        }

        return (
            <div className="flex align-items-center justify-content-between w-full p-2 hover:bg-gray-100 border-round cursor-pointer">
                <div className="flex align-items-center">
                    {iconClass && <i className={`mr-2 text-gray-600 ${iconClass}`} />}
                    <span className="text-sm text-gray-800">{node.label}</span>
                </div>
                {node.key !== "folders" && node.key !== "dashboards" && <i className="pi pi-ellipsis-v text-gray-400" />}
            </div>
        );
    };

    const getPageTitle = () => {
        if (!pathname) return "";

        if (pathname === "/") return "Dashboard";

        const segments = pathname.split("/");
        const lastSegment = segments[segments.length - 1];

        return lastSegment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 10) return "just now";
        if (seconds < 60) return `${seconds} seconds ago`;
        if (minutes === 1) return "a minute ago";
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours === 1) return "an hour ago";
        if (hours < 24) return `${hours} hours ago`;
        if (days === 1) return "yesterday";
        if (days < 7) return `${days} days ago`;
        if (weeks === 1) return "a week ago";
        if (weeks < 5) return `${weeks} weeks ago`;
        if (months === 1) return "a month ago";
        if (months < 12) return `${months} months ago`;
        if (years === 1) return "a year ago";
        return `${years} years ago`;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeAgo(getTimeAgo(lastRefreshTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [lastRefreshTime]);

    return (
        <div className="mb-3 flex align-center justify-content-between">
            <h3 className="font-bold text-2xl">{getPageTitle()}</h3>

            <div className="flex align-items-center">
                <span>{timeAgo}</span>
                <Button className="ml-1" icon="pi pi-refresh" text onClick={() => setLastRefreshTime(new Date())} />
                <Button className="ml-1" icon="pi pi-filter" text />
                <Button className="ml-1" icon="pi pi-ellipsis-v" text />
                <Button className="ml-1" icon="pi pi-folder" onClick={() => setVisible(!visible)} text />

                <Sidebar visible={visible} position="right" onHide={() => setVisible(false)} className="w-20rem">
                    <div className="flex flex-column h-full">
                        <h5 className="font-semibold m-0">Shared</h5>

                        <Divider className="my-3" />

                        <Tree value={nodes} nodeTemplate={nodeTemplate} className="mt-3 border-none" selectionMode="single" />
                    </div>
                </Sidebar>
            </div>
        </div>
    );
}
