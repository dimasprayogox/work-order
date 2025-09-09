"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Image } from "primereact/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FilterMatchMode } from "primereact/api";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import { Dropdown } from "primereact/dropdown";

const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "open" },
    { label: "in progress", value: "in_progress" },
    { label: "resolved", value: "resolved" },
];

const WorkOrderTable = ({ workOrders = [], loading = false, selectedWorkOrders = [], onSelectionChange = () => {}, onEdit = () => {}, onDelete = () => {}, onDetail = () => {}, searchText = "", onSearch = () => {} }) => {
   const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS }
    });
    const [selectAll, setSelectAll] = useState(false);
    const [currentFirst, setCurrentFirst] = useState(0);
    const [currentRows, setCurrentRows] = useState(10);

    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

    const [previewImageUrl, setPreviewImageUrl] = useState("");
    const [isImageHovered, setIsImageHovered] = useState(false);
    const [hoveredImageId, setHoveredImageId] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");

    const getStatusLabel = (status) => {
        const statusMap = {
            open: "Pending",
            in_progress: "In Progress",
            resolved: "Resolved",
            closed: "Closed"
        };
        return statusMap[status] || status;
    };

    const statusBodyTemplate = (rowData) => {
            const statusMap = {
                open: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
                in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
                resolved: { label: "Completed", color: "bg-green-100 text-green-800" }
            };
            const status = statusMap[rowData.status] || { label: rowData.status, color: "bg-gray-100 text-gray-800" };
            return <Tag value={status.label} className={status.color} style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />;
        };


    const photoBodyTemplate = (rowData) => {
        if (rowData.photo_url) {
            return (
                <Image
                    src={rowData.photo_url}
                    alt="Work Order Photo"
                    width="50"
                    height="50"
                    preview
                    className="border-round"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                    }}
                />
            );
        }
        return <span className="text-gray-400">No photo</span>;
    };

   const dateBodyTemplate = (rowData) => {
       // Ambil nilai tanggal dari field 'created_at' di rowData
       const dateValue = rowData.created_at;

       if (!dateValue) return "N/A"; // Cek jika nilainya ada

       const date = new Date(dateValue);

       // Tambahkan pengecekan jika tanggalnya tetap tidak valid setelah di-parse
       if (isNaN(date)) {
           return "Invalid Date";
       }

       return date.toLocaleDateString("en-US", {
           day: "2-digit",
           month: "short",
           year: "numeric"
       });
   };

    const priorityBodyTemplate = (rowData) => {
        const priorityMap = {
            high: { label: "High", color: "bg-red-100 text-red-800" },
            medium: { label: "Medium", color: "bg-orange-100 text-orange-800" },
            low: { label: "Low", color: "bg-yellow-100 text-yellow-800" }
        };

        const priority = priorityMap[rowData.priority] || { label: rowData.priority, color: "bg-gray-100 text-gray-800" };
        return <Tag value={priority.label} className={priority.color} />;
    };

    useEffect(() => {
        setFilters({
            global: { value: searchText || null, matchMode: FilterMatchMode.CONTAINS },
            status: { value: statusFilter, matchMode: FilterMatchMode.EQUALS }
        });
    }, [searchText, statusFilter]);

    const handleSelectionChange = (e) => {
        onSelectionChange(e.value);
        setSelectAll(e.value.length === workOrders.length);
    };

    const handleSelectAllChange = (e) => {
        const checked = e.checked;
        const selected = checked ? workOrders : [];
        setSelectAll(checked);
        onSelectionChange(selected);
    };

    const onPageChange = (e) => {
        setCurrentFirst(e.first);
        setCurrentRows(e.rows);
    };

    const machineOrAssetBodyTemplate = (rowData) => {
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


    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-eye" rounded outlined className="p-button-sm" onClick={() => onDetail(rowData)} tooltip="View Details" tooltipOptions={{ position: "top" }} />
                {/* Only show Edit and Delete when status is 'open' (pending) */}
                {rowData.status === 'open' && (
                    <>
                        <Button icon="pi pi-pencil" rounded outlined className="p-button-sm" onClick={() => onEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: "top" }} />
                        <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => onDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: "top" }} />
                    </>
                )}
            </div>
        );
    };

    const header = (
         <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Work Order List</span>
            </div>
            <div className="flex align-items-center gap-3">
                <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} className="w-10rem" />
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={searchText} onChange={(e) => onSearch(e.target.value)} placeholder="Search" />
                </span>
            </div>
        </div>
    );

    return (
        <>
            {loading ? (
                <div className="flex justify-center py-6">
                    <ProgressSpinner />
                </div>
            ) : (
                <>
                    <DataTable
                        value={workOrders}
                        selection={selectedWorkOrders}
                        onSelectionChange={handleSelectionChange}
                        selectAll={selectAll}
                        onSelectAllChange={handleSelectAllChange}
                        onPage={onPageChange}
                        first={currentFirst}
                        rows={currentRows}
                        dataKey="id"
                        paginator
                        loading={loading}
                        emptyMessage="No work orders found."
                        filters={filters}
                        globalFilterFields={["title", "description", "machine.name", "asset.name", "status", "priority"]}
                        className="border-round-lg"
                        rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} work orders"
                        rowsPerPageOptions={[5, 10, 25]}
                        header={header}
                        selectionMode="multiple"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                        <Column
                            field="title"
                            header="Title"
                            sortable
                            style={{ width: "200px" }}
                            body={(rowData) => (
                                <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                                    {rowData.title}
                                </motion.div>
                            )}
                        />
                        <Column
                            field="description"
                            header="Description"
                            sortable
                            body={(rowData) => (
                                <>
                                    <Tooltip target={`.description-tooltip-${rowData.id}`} position="bottom" />
                                    <span
                                        className={`text-sm description-tooltip-${rowData.id}`}
                                        data-pr-tooltip={rowData.description}
                                        style={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "block",
                                            maxWidth: "200px"
                                        }}
                                    >
                                        {rowData.description}
                                    </span>
                                </>
                            )}
                        />
                        
                         <Column field="target" header="Machine/Asset" body={machineOrAssetBodyTemplate} style={{ minWidth: "180px" }} sortable sortField="machine.name" />
                                       
                        <Column
                            field="note"
                            header="Note"
                            body={(rowData) => {
                                const note = rowData.note || rowData.workOrder?.notes;
                                if (!note) return <span className="text-gray-400">No note</span>;
                                return (
                                    <>
                                        <Tooltip target={`.note-tooltip-${rowData.id}`} position="bottom" />
                                        <span
                                            className={`note-tooltip-${rowData.id}`}
                                            data-pr-tooltip={note}
                                            style={{
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "block",
                                                maxWidth: "150px"
                                            }}
                                        >
                                            {note}
                                        </span>
                                    </>
                                );
                            }}
                            style={{ width: "150px" }}
                        />
                        <Column
                            field="repairable"
                            header="Repairable"
                            body={(rowData) => {
                                // Handle multiple possible shapes for repairable value
                                let val = null;
                                if (typeof rowData.repairable === "boolean") {
                                    val = rowData.repairable;
                                } else if (rowData.repairable === 1 || rowData.repairable === "1") {
                                    val = true;
                                } else if (rowData.repairable === 0 || rowData.repairable === "0") {
                                    val = false;
                                } else if (typeof rowData.workOrder?.repairable === "boolean") {
                                    val = rowData.workOrder.repairable;
                                } else if (rowData.workOrder?.repairable === 1 || rowData.workOrder?.repairable === "1") {
                                    val = true;
                                } else if (rowData.workOrder?.repairable === 0 || rowData.workOrder?.repairable === "0") {
                                    val = false;
                                }

                                const config =
                                    val === true
                                        ? { bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check", label: "Repairable" }
                                        : val === false
                                        ? { bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi-times-circle", label: "Not Repairable" }
                                        : { bgColor: "bg-gray-100", textColor: "text-gray-600", icon: "pi-minus", label: "N/A" };

                                return (
                                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                                            <i className={`pi ${config.icon}`}></i>
                                            <span className="font-medium">{config.label}</span>
                                        </div>
                                    </motion.div>
                                );
                            }}
                            sortable
                            style={{ width: "140px", textAlign: "center" }}
                        />
                        <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                        <Column header="Photo" body={photoBodyTemplate} />
                        <Column field="created_at" header="Created" body={dateBodyTemplate} sortable style={{ minWidth: "120px" }}  />
                        <Column header="Actions" body={actionBodyTemplate} style={{ width: "150px" }} />
                    </DataTable>

                    {/* Remove custom preview dialog, since <Image preview /> handles it */}
                </>
            )}
        </>
    );
};

export default WorkOrderTable;
