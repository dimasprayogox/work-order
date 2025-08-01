// app/(main)/work-order-assignments/components/WorkOrderAssignmentTable.jsx
"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Tooltip } from "primereact/tooltip";
import { Badge } from "primereact/badge";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useState } from "react";

const WorkOrderAssignmentTable = ({
    workOrders,
    technicians,
    loading,
    selectedWorkOrders = [],
    onSelectionChange = () => {},
    onAssign,
    onReassign,
    onUnassign
}) => {
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    const handleSelectionChange = (e) => {
        onSelectionChange(e.value);
    };

    // Status template
    const statusBodyTemplate = (rowData) => {
        let severity = "info";
        let icon = "";

        switch (rowData.status) {
            case "pending":
                severity = "warning";
                icon = "pi pi-clock";
                break;
            case "in_progress":
                severity = "info";
                icon = "pi pi-spin pi-spinner";
                break;
            case "completed":
                severity = "success";
                icon = "pi pi-check-circle";
                break;
            case "cancelled":
                severity = "danger";
                icon = "pi pi-times-circle";
                break;
            default:
                severity = "secondary";
                icon = "pi pi-question-circle";
        }

        return (
            <Tag
                value={
                    <span className="flex align-items-center gap-1">
                        <i className={icon}></i>
                        {rowData.status.replace('_', ' ').toUpperCase()}
                    </span>
                }
                severity={severity}
                className="font-medium"
            />
        );
    };

    // Priority template
    const priorityBodyTemplate = (rowData) => {
        let severity = "info";
        let icon = "";

        switch (rowData.priority) {
            case "high":
                severity = "danger";
                icon = "pi pi-exclamation-triangle";
                break;
            case "medium":
                severity = "warning";
                icon = "pi pi-minus";
                break;
            case "low":
                severity = "success";
                icon = "pi pi-arrow-down";
                break;
            default:
                severity = "secondary";
                icon = "pi pi-minus";
        }

        return (
            <Tag
                value={
                    <span className="flex align-items-center gap-1">
                        <i className={icon}></i>
                        {(rowData.priority || 'medium').toUpperCase()}
                    </span>
                }
                severity={severity}
                className="font-medium"
            />
        );
    };

    // Assignment template
    const assignmentBodyTemplate = (rowData) => {
        if (!rowData.assigned_to_id) {
            return (
                <div className="flex align-items-center gap-2">
                    <Badge value="Unassigned" severity="warning" />
                </div>
            );
        }

        const technician = rowData.assignedTo || technicians.find(t => t.id === rowData.assigned_to_id);

        return (
            <div className="flex align-items-center gap-2">
                <Avatar
                    image={technician?.profile_photo_url}
                    label={technician?.full_name?.charAt(0) || 'T'}
                    className="p-mr-2"
                    size="small"
                    style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                />
                <div>
                    <div className="font-medium">{technician?.full_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">
                        Workload: {technician?.current_workload || 0}
                    </div>
                </div>
            </div>
        );
    };

    // Machine template
    const machineBodyTemplate = (rowData) => {
        return (
            <div>
                <div className="font-medium">{rowData.machine?.name || 'N/A'}</div>
                {rowData.machine?.machine_code && (
                    <div className="text-sm text-gray-500">{rowData.machine.machine_code}</div>
                )}
            </div>
        );
    };

    // Issue template
    const issueBodyTemplate = (rowData) => {
        if (!rowData.issue) return '-';

        return (
            <div className="max-w-200">
                <div className="font-medium text-sm">{rowData.issue.title}</div>
                <div className="text-xs text-gray-500 truncate">
                    {rowData.issue.description}
                </div>
            </div>
        );
    };

    // Date template
    const dateBodyTemplate = (field) => {
        return (rowData) => {
            if (!rowData[field]) return "N/A";
            return new Date(rowData[field]).toLocaleDateString("id-ID", {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        };
    };

    // Scheduled date template with overdue check
    const scheduledDateBodyTemplate = (rowData) => {
        if (!rowData.scheduled_date) return '-';

        const scheduleDate = new Date(rowData.scheduled_date);
        const today = new Date();
        const isOverdue = scheduleDate < today && rowData.status !== 'completed';

        return (
            <div className={`flex align-items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <i className={`pi ${isOverdue ? 'pi-exclamation-triangle' : 'pi-calendar'}`}></i>
                <span className={isOverdue ? 'font-semibold' : ''}>
                    {scheduleDate.toLocaleDateString("id-ID", {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })}
                </span>
                {isOverdue && <Badge value="Overdue" severity="danger" />}
            </div>
        );
    };

    // Action template
    const actionBodyTemplate = (rowData) => {
        const canAssign = !rowData.assigned_to_id && rowData.status !== 'completed';
        const canReassign = rowData.assigned_to_id && rowData.status !== 'completed';
        const canUnassign = rowData.assigned_to_id && rowData.status !== 'completed' && rowData.status !== 'in_progress';

        const handleUnassignClick = () => {
            confirmDialog({
                message: `Apakah Anda yakin ingin membatalkan assignment work order "${rowData.title}"?`,
                header: 'Konfirmasi Unassign',
                icon: 'pi pi-exclamation-triangle',
                acceptClassName: 'p-button-danger',
                accept: () => onUnassign(rowData, 'Unassigned by admin'),
                reject: () => {}
            });
        };

        return (
            <div className="flex gap-1">
                {canAssign && (
                    <Button
                        icon="pi pi-user-plus"
                        rounded
                        outlined
                        size="small"
                        className="p-button-sm"
                        onClick={() => onAssign(rowData)}
                        tooltip="Assign to Technician"
                        tooltipOptions={{ position: 'top' }}
                    />
                )}

                {canReassign && (
                    <Button
                        icon="pi pi-user-edit"
                        rounded
                        outlined
                        size="small"
                        className="p-button-sm"
                        onClick={() => onReassign(rowData)}
                        tooltip="Reassign"
                        tooltipOptions={{ position: 'top' }}
                    />
                )}

                {canUnassign && (
                    <Button
                        icon="pi pi-user-minus"
                        rounded
                        outlined
                        severity="danger"
                        size="small"
                        className="p-button-sm"
                        onClick={handleUnassignClick}
                        tooltip="Unassign"
                        tooltipOptions={{ position: 'top' }}
                    />
                )}
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Work Order Assignments</span>
            <div className="flex gap-2">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <input
                        type="text"
                        value={globalFilterValue}
                        onChange={(e) => setGlobalFilterValue(e.target.value)}
                        placeholder="Search work orders..."
                        className="p-inputtext p-component"
                    />
                </span>
            </div>
        </div>
    );

    return (
        <div>
            <ConfirmDialog />
            <Tooltip target=".p-button" />

            <DataTable
                value={workOrders}
                selection={selectedWorkOrders}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                paginator
                rows={15}
                loading={loading}
                emptyMessage="No work orders found."
                globalFilter={globalFilterValue}
                globalFilterFields={[
                    "title",
                    "description",
                    "machine.name",
                    "assignedTo.full_name",
                    "issue.title"
                ]}
                className="border-round-lg"
                rowClassName={(rowData) => {
                    let className = "hover:bg-gray-50 transition-colors cursor-pointer";

                    // Highlight overdue items
                    if (rowData.scheduled_date) {
                        const scheduleDate = new Date(rowData.scheduled_date);
                        const today = new Date();
                        if (scheduleDate < today && rowData.status !== 'completed') {
                            className += " bg-red-50";
                        }
                    }

                    // Highlight unassigned items
                    if (!rowData.assigned_to_id && rowData.status !== 'completed') {
                        className += " bg-yellow-50";
                    }

                    return className;
                }}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} work orders"
                rowsPerPageOptions={[10, 15, 25, 50]}
                header={header}
                selectionMode="multiple"
                sortMode="multiple"
                resizableColumns
            >
                <Column
                    selectionMode="multiple"
                    headerStyle={{ width: "3rem" }}
                    frozen
                />

                <Column
                    field="title"
                    header="Title"
                    style={{ minWidth: "200px" }}
                    sortable
                    frozen
                />

                <Column
                    field="machine"
                    header="Machine"
                    body={machineBodyTemplate}
                    style={{ minWidth: "150px" }}
                    sortable
                    sortField="machine.name"
                />

                <Column
                    field="issue"
                    header="Related Issue"
                    body={issueBodyTemplate}
                    style={{ minWidth: "200px" }}
                />

                <Column
                    field="status"
                    header="Status"
                    body={statusBodyTemplate}
                    style={{ minWidth: "120px" }}
                    sortable
                />

                <Column
                    field="priority"
                    header="Priority"
                    body={priorityBodyTemplate}
                    style={{ minWidth: "100px" }}
                    sortable
                />

                <Column
                    field="assigned_to_id"
                    header="Assigned To"
                    body={assignmentBodyTemplate}
                    style={{ minWidth: "180px" }}
                    sortable
                    sortField="assignedTo.full_name"
                />

                <Column
                    field="scheduled_date"
                    header="Scheduled"
                    body={scheduledDateBodyTemplate}
                    style={{ minWidth: "120px" }}
                    sortable
                />

                <Column
                    field="created_at"
                    header="Created"
                    body={dateBodyTemplate('created_at')}
                    style={{ minWidth: "100px" }}
                    sortable
                />

                <Column
                    header="Actions"
                    body={actionBodyTemplate}
                    style={{ minWidth: "120px" }}
                    frozen
                    alignFrozen="right"
                />
            </DataTable>
        </div>
    );
};

export default WorkOrderAssignmentTable;
