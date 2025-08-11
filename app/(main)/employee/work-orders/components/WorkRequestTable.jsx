"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
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

const WorkOrderTable = ({ workOrders = [], loading = false, selectedWorkOrders = [], onSelectionChange = () => {}, onEdit = () => {}, onDelete = () => {}, searchText = "", onSearch = () => {} }) => {
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

    const statusBodyTemplate = (rowData) => {
        const statusMap = {
            open: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
            resolved: { label: "Resolved", color: "bg-green-100 text-green-800" },
            closed: { label: "Closed", color: "bg-gray-100 text-gray-800" }
        };

        const status = statusMap[rowData.status] || { label: rowData.status, color: "bg-gray-100 text-gray-800" };
        return <Tag value={status.label} className={status.color} />;
    };

    const photoBodyTemplate = (rowData) => {
        const handleImageClick = (e, url) => {
            e.stopPropagation();
            setPreviewImageUrl(url);
            setImagePreviewVisible(true);
        };

        const handleMouseEnter = (id) => {
            setHoveredImageId(id);
        };

        const handleMouseLeave = () => {
            setHoveredImageId(null);
        };

        const overlayStyle = {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: "6px",
            cursor: "pointer"
        };

        if (rowData.photo_url) {
            return (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onMouseEnter={() => handleMouseEnter(rowData.id)} onMouseLeave={handleMouseLeave} className="relative">
                    <img
                        src={rowData.photo_url}
                        alt="Issue Preview"
                        style={{ width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" }}
                        className="shadow-lg border-round"
                        onClick={(e) => handleImageClick(e, rowData.photo_url)}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/50x50/cccccc/000000?text=No+Image";
                        }}
                    />
                    {isImageHovered && hoveredImageId === rowData.id && (
                        <div
                            style={overlayStyle}
                            onClick={(e) => handleImageClick(e, rowData.photo_url)} // Kirim event (e)
                        >
                            <i className="pi pi-eye text-white text-xl"></i>
                        </div>
                    )}
                </motion.div>
            );
        }
        return <img src="https://placehold.co/50x50/cccccc/000000?text=No+Image" alt="No photo" style={{ width: "50px", height: "50px", objectFit: "cover" }} className="shadow-lg border-round" />;
    };

    const dateBodyTemplate = (rowData) => {
        return rowData.created_at ? new Date(rowData.created_at).toLocaleString("id-ID") : "N/A";
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

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined severity="info" onClick={() => onEdit(rowData)} tooltip="Edit" tooltipOptions={{ position: "top" }} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => onDelete(rowData)} tooltip="Delete" tooltipOptions={{ position: "top" }} />
            </div>
        );
    };

    const header = (
         <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <span className="text-xl font-bold">Work Order List</span>
                <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} className="w-10rem" />
            </div>
            <span className="p-input-icon-left w-full md:w-auto">
                <i className="pi pi-search" />
                    <InputText value={searchText} onChange={(e) => onSearch(e.target.value)} placeholder="Search" />
                </span>
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
                        globalFilterFields={["title", "description", "machine.name", "status"]}
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
                                        className={`description-tooltip-${rowData.id}`}
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
                        <Column field="machine.name" header="Machine" body={(rowData) => <Tag value={rowData.machine?.name} className="bg-gray-100 text-gray-800 font-medium" />} />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                        <Column header="Photo" body={photoBodyTemplate} />
                        <Column field="created_at" header="Created" body={dateBodyTemplate} sortable />
                        <Column header="Actions" body={actionBodyTemplate} style={{ width: "120px" }} />
                    </DataTable>

                    <Dialog visible={imagePreviewVisible} onHide={() => setImagePreviewVisible(false)} modal header="Pratinjau Gambar" style={{ width: "50vw" }} contentStyle={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {previewImageUrl && (
                            <img
                                src={previewImageUrl}
                                alt="Pratinjau Isu"
                                style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/600x400/cccccc/000000?text=Image+Not+Found";
                                }}
                            />
                        )}
                    </Dialog>
                </>
            )}
        </>
    );
};

export default WorkOrderTable;
