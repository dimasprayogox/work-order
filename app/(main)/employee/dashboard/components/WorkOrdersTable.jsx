import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";

// Status options for filter dropdown
const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "resolved" }
];

// StatusTag component (embedded)
const StatusTag = ({ status }) => {
    const statusMap = {
        open: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
        resolved: { label: "Completed", color: "bg-green-100 text-green-800" }
    };

    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };

    return <Tag value={statusInfo.label} className={statusInfo.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
};

// DateCell component (embedded)
const DateCell = ({ dateValue }) => {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (isNaN(date)) {
        return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

// MachineAssetCell component (embedded)
const MachineAssetCell = ({ rowData }) => {
    // First check work order direct relations
    if (rowData.machine) {
        return (
            <div>
                <div className="font-medium flex align-items-center gap-2">
                    <i className="pi pi-cog text-blue-500"></i>
                    {rowData.machine.name}
                </div>
                {rowData.machine.machine_code && <div className="text-sm text-gray-500">{rowData.machine.machine_code}</div>}
                <div className="text-xs text-blue-600">Machine</div>
            </div>
        );
    }

    if (rowData.asset) {
        return (
            <div>
                <div className="font-medium flex align-items-center gap-2">
                    <i className="pi pi-box text-green-500"></i>
                    {rowData.asset.name}
                </div>
                {rowData.asset.asset_code && <div className="text-sm text-gray-500">{rowData.asset.asset_code}</div>}
                <div className="text-xs text-green-600">Asset</div>
            </div>
        );
    }

    // Then check issue relations
    if (rowData.issue) {
        if (rowData.issue.machine) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-cog text-blue-500"></i>
                        {rowData.issue.machine.name}
                    </div>
                    {rowData.issue.machine.machine_code && <div className="text-sm text-gray-500">{rowData.issue.machine.machine_code}</div>}
                    <div className="text-xs text-blue-600">Machine (from Issue)</div>
                </div>
            );
        }

        if (rowData.issue.asset) {
            return (
                <div>
                    <div className="font-medium flex align-items-center gap-2">
                        <i className="pi pi-box text-green-500"></i>
                        {rowData.issue.asset.name}
                    </div>
                    {rowData.issue.asset.asset_code && <div className="text-sm text-gray-500">{rowData.issue.asset.asset_code}</div>}
                    <div className="text-xs text-green-600">Asset (from Issue)</div>
                </div>
            );
        }
    }

    return <span className="text-gray-500">N/A</span>;
};

// Main WorkOrdersTable component
const WorkOrdersTable = ({ issues, loading, statusFilter, setStatusFilter, searchText, setSearchText }) => {
    const filteredData = issues.filter((request) => {
        const matchesStatus = !statusFilter || request.status === statusFilter;
        const matchesSearch = !searchText || request.title.toLowerCase().includes(searchText.toLowerCase()) || (request.description && request.description.toLowerCase().includes(searchText.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const titleBodyTemplate = (rowData) => (
        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
            {rowData.title}
        </motion.div>
    );

    return (
        <div className="card overflow-hidden">
            <h5 className="font-bold mb-4">Recent Work Orders</h5>
            {loading ? (
                <div className="flex justify-center p-4">
                    <ProgressSpinner />
                </div>
            ) : (
                <DataTable
                    value={filteredData.slice(0, 5)}
                    className="border-round-lg"
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Displays {first} to {last} of {totalRecords} schedules"
                    emptyMessage="No work orders found"
                    header={
                        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
                            <div className="flex align-items-center gap-3">
                                <span className="text-xl font-bold">Work Requests</span>
                            </div>
                            <div className="flex align-items-center gap-3">
                                <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} className="w-10rem" />
                                <span className="p-input-icon-left">
                                    <i className="pi pi-search" />
                                    <InputText placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-15rem" />
                                </span>
                            </div>
                        </div>
                    }
                >
                    <Column field="title" header="Title" sortable body={titleBodyTemplate} />
                    <Column field="target" header="Machine/Asset" body={(rowData) => <MachineAssetCell rowData={rowData} />} style={{ minWidth: "180px" }} sortable sortField="machine.name" />
                    <Column field="created_at" header="Reported Date" body={(rowData) => <DateCell dateValue={rowData.created_at} />} sortable />
                    <Column field="status" header="Status" body={(rowData) => <StatusTag status={rowData.status} />} sortable />
                </DataTable>
            )}
        </div>
    );
};

export default WorkOrdersTable;
