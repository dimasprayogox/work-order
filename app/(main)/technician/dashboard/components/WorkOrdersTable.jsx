import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Image } from "primereact/image";

// Opsi filter disesuaikan dengan nilai data asli
const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" }
];



// StatusCell component
const StatusCell = ({ rowData }) => {
    const statusConfig = {
        pending: { label: "Pending", color: "#f97316", bgColor: "bg-orange-100", textColor: "text-orange-800", icon: "pi-clock" },
        in_progress: { label: "In Progress", color: "#06b6d4", bgColor: "bg-cyan-100", textColor: "text-cyan-800", icon: "pi-spin pi-spinner" },
        completed: { label: "Completed", color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" },
        resolved: { label: "Resolved", color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" }
    };
    const config = statusConfig[rowData.status] || { label: rowData.status, bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi-question" };
    return (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                <i className={`pi ${config.icon}`}></i>
                <span className="font-medium">{config.label}</span>
            </div>
        </motion.div>
    );
};

const priorityBodyTemplate = (rowData) => {
        const priority = rowData.priority || "";
        const severityMap = {
            high: "danger",
            medium: "warning",
            low: "success"
        };
        const displayValue = priority.charAt(0).toUpperCase() + priority.slice(1);
        const severity = severityMap[priority.toLowerCase()] || "info";
        return <Tag value={displayValue} severity={severity} />;
    };

// DateCell component
const DateCell = ({ rowData }) => {
    return new Date(rowData.created_at).toLocaleDateString();
};

const titleBodyTemplate = (rowData) => (
    <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }} className="font-medium text-blue-600 cursor-pointer">
        {rowData.title}
    </motion.span>
);

const photoBodyTemplate = (rowData) => {
        // WorkOrder may not have a direct photo_url but its related issue can
        const src = rowData.photo_url || rowData.issue?.photo_url || null;
        if (src) {
            return (
                <Image
                    src={src}
                    alt={rowData.title || "Work Order Photo"}
                    width="50"
                    height="50"
                    preview
                    className="border-round"
                    onError={(e) => {
                        // PrimeReact Image forwards the native event; guard for target
                        const target = e?.target || e;
                        if (target) {
                            target.onerror = null;
                            target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                        }
                    }}
                />
            );
        }

        return <span className="text-gray-400">No photo</span>;
    };

    const statusBodyTemplate = (rowData) => {
        const statusMap = {
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
            completed: { label: "Completed", color: "bg-green-100 text-green-800" },
            rejected: { label: "Rejected", color: "bg-red-100 text-red-800" }
        };
        const status = statusMap[rowData.status] || { label: rowData.status, color: "bg-gray-100 text-gray-800" };
        return <Tag value={status.label} className={status.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
    };

const dateBodyTemplate = (rowData) => {
    // 1. Ambil nilai dari kolom yang benar, yaitu 'scheduled_date'
    const dateValue = rowData.scheduled_date;

    // 2. INI BAGIAN PALING PENTING:
    //    Jika nilainya null, undefined, atau string kosong, langsung kembalikan "N/A".
    //    Ini mencegah "Invalid Date" untuk baris yang tidak punya jadwal.
    if (!dateValue) {
        return "N/A";
    }

    // 3. Gunakan date-fns untuk mem-format tanggal yang valid.
    try {
        const date = parseISO(dateValue);
        // Cek lagi untuk memastikan hasil parse valid
        if (isNaN(date.getTime())) {
            return "Format Salah";
        }
        return format(date, "dd MMM yyyy");
    } catch (error) {
        // Ini sebagai pengaman jika ada format tanggal aneh selain null
        return "Format Salah";
    }
};

// Main WorkOrdersTable component
const WorkOrdersTable = ({ workOrders, setPreviewImageUrl, setImagePreviewVisible }) => {
    const [statusFilter, setStatusFilter] = useState("");
    const [searchText, setSearchText] = useState("");

    // Data processing functions moved here from external file
    const processWorkOrderData = (data) => {
        const total = data.length;
        const pending = data.filter((wo) => wo.status === "pending").length;
        const completed = data.filter((wo) => wo.status === "completed").length;
        const inProgress = data.filter((wo) => wo.status === "in_progress").length;

        const stats = { total, pending, completed, inProgress };

        const chartData = [
            { name: "Pending", value: pending, color: "#ef4444" },
            { name: "In Progress", value: inProgress, color: "#06b6d4" },
            { name: "Completed", value: completed, color: "#10b981" }
        ];

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendData = months.map((month, index) => {
            const monthRequests = data.filter((wo) => new Date(wo.created_at).getMonth() === index);
            return {
                name: month,
                created: monthRequests.length,
                resolved: monthRequests.filter((wo) => wo.status === "completed").length
            };
        });

        return { stats, chartData, trendData };
    };

    const filteredData = workOrders.filter((wo) => {
        const woStatus = wo.status || "";
        const woId = wo.id || "";
        const woDesc = wo.description || "";

        const matchesStatus = !statusFilter || woStatus === statusFilter;
        const matchesSearch = !searchText || String(woId).toLowerCase().includes(searchText.toLowerCase()) || woDesc.toLowerCase().includes(searchText.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="card overflow-hidden">
            <DataTable
                value={filteredData}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25, 50]}
                dataKey="id"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Displays {first} to {last} of {totalRecords} Work Orders"
                emptyMessage="No Work Order."
                className="border-round-lg"
                header={
                    <div className="flex align-items-center justify-content-between gap-2">
                        <h5 className="font-bold m-0">Assigment Work Orders</h5>
                        <div className="flex gap-2">
                            <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} className="w-12rem"  />
                            <span className="p-input-icon-left">
                                <i className="pi pi-search" />
                                <InputText placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-15rem" />
                            </span>
                        </div>
                    </div>
                }
            >
                <Column field="title" header="Title" sortable body={titleBodyTemplate}  />
                <Column header="Photo" body={photoBodyTemplate} />
                <Column header="Priority" body={priorityBodyTemplate} />
                <Column header="Status" body={statusBodyTemplate} />
                <Column field="scheduled_date" header="Schedule" sortable body={dateBodyTemplate} style={{ minWidth: "120px" }} />
            </DataTable>
        </div>
    );
};

export default WorkOrdersTable;
