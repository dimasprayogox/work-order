"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Card } from "primereact/card"; // Added: Card component was used but not imported
import { Timeline } from "primereact/timeline"; // Added: Timeline component was used but not imported

const ScheduleDetailDialog = ({ visible, onHide, schedule }) => {
    // Helper function to format dates, no changes needed
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Helper functions for frequency and priority details, no changes needed
    const getFrequencyDetails = (frequency) => {
        const frequencyMap = {
            daily: { label: "Daily", severity: "info", icon: "pi pi-calendar", description: "Maintenance required every day" },
            weekly: { label: "Weekly", severity: "success", icon: "pi pi-calendar-times", description: "Maintenance required every week" },
            monthly: { label: "Monthly", severity: "warning", icon: "pi pi-calendar-plus", description: "Maintenance required every month" },
            yearly: { label: "Yearly", severity: "danger", icon: "pi pi-calendar-minus", description: "Maintenance required every year" }
        };
        return frequencyMap[frequency] || { label: frequency, severity: "info", icon: "pi pi-calendar", description: "Custom frequency" };
    };

    const getPriorityDetails = (priority) => {
        const priorityMap = {
            low: { label: "Low Priority", severity: "success", icon: "pi pi-arrow-down", description: "Low priority maintenance" },
            medium: { label: "Medium Priority", severity: "warning", icon: "pi pi-minus", description: "Medium priority maintenance" },
            high: { label: "High Priority", severity: "danger", icon: "pi pi-arrow-up", description: "High priority maintenance" }
        };
        return priorityMap[priority] || { label: priority, severity: "info", icon: "pi pi-minus", description: "Custom priority" };
    };

    // Helper function for due date status, no changes needed
    const getDueDateStatus = (dueDateString) => {
        if (!dueDateString) return { status: "unknown", message: "No due date set", severity: "secondary", icon: "pi pi-question-circle" };

        const dueDate = new Date(dueDateString);
        const now = new Date();
        // Reset time part for accurate day difference calculation
        dueDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { status: "overdue", message: `Overdue by ${Math.abs(diffDays)} day(s)`, severity: "danger", icon: "pi pi-exclamation-triangle" };
        } else if (diffDays === 0) {
            return { status: "due_today", message: "Due today", severity: "warning", icon: "pi pi-clock" };
        } else if (diffDays === 1) {
            return { status: "due_tomorrow", message: "Due tomorrow", severity: "warning", icon: "pi pi-clock" };
        } else if (diffDays <= 7) {
            return { status: "due_soon", message: `Due in ${diffDays} days`, severity: "info", icon: "pi pi-spin pi-spinner" };
        } else {
            return { status: "upcoming", message: `Due in ${diffDays} days`, severity: "success", icon: "pi pi-check-circle" };
        }
    };

    const calculateNextDueDates = (currentDueDate, frequency, count = 5) => {
        if (!currentDueDate || !frequency) return [];
        const dates = [];
        let nextDate = new Date(currentDueDate);
        for (let i = 0; i < count; i++) {
            if (frequency === "daily") {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (frequency === "weekly") {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (frequency === "monthly") {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (frequency === "yearly") {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            dates.push(new Date(nextDate));
        }
        return dates;
    };

    if (!schedule) return null;

    // --- Component Logic ---
    const frequencyDetails = getFrequencyDetails(schedule.frequency);
    const priorityDetails = getPriorityDetails(schedule.priority);
    const dueDateStatus = getDueDateStatus(schedule.next_due_date);
    const upcomingDates = calculateNextDueDates(schedule.next_due_date, schedule.frequency);

    // Added: Map severity to color classes for custom styling
    const severityColorMap = {
        danger: "red",
        warning: "orange",
        info: "blue",
        success: "green",
        secondary: "gray"
    };
    const color = severityColorMap[dueDateStatus.severity] || "gray";

    // Added: Data for the Timeline component, needs to be an array of objects
    const upcomingEvents = upcomingDates.map((date) => ({
        status: formatDate(date),
        icon: "pi pi-calendar"
    }));

    // Added: Customization functions for the Timeline component
    const customEventMarker = (item) => {
        return (
            <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: "#9C27B0" }}>
                <i className={item.icon}></i>
            </span>
        );
    };

    const customEventContent = (item) => {
        return <small className="text-color-secondary">{item.status}</small>;
    };

    const footerContent = (
        <div className="flex justify-content-end">
            <Button label="Close" icon="pi pi-times" onClick={onHide} className="p-button-text" />
        </div>
    );

    return (
        <Dialog header="Schedule Details" visible={visible} style={{ width: "60rem" }} breakpoints={{ "960px": "75vw", "641px": "90vw" }} onHide={onHide} modal footer={footerContent}>
            <div className="grid">
                {/* Left Column */}
                <div className="col-12 md:col-8 pr-4">
                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Title</label>
                        <p className="text-lg font-medium">{schedule.title}</p>
                    </div>

                    {schedule.description && (
                        <div className="field mb-4">
                            <label className="font-semibold text-gray-800 block mb-2">Description</label>
                            <p className="line-height-3 text-gray-700">{schedule.description}</p>
                        </div>
                    )}

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Type & Target</label>
                        <div className="flex align-items-center gap-2">
                            {schedule.type === "machine" ? (
                                <>
                                    <i className="pi pi-cog text-blue-500"></i>
                                    <span className="font-medium">Machine: {schedule.machine?.name || "N/A"}</span>
                                    {schedule.machine?.machine_code && <Tag value={schedule.machine.machine_code} />}
                                </>
                            ) : (
                                <>
                                    <i className="pi pi-box text-green-500"></i>
                                    <span className="font-medium">Asset: {schedule.asset?.name || "N/A"}</span>
                                    {schedule.asset?.asset_code && <Tag value={schedule.asset.asset_code} />}
                                </>
                            )}
                        </div>
                        {((schedule.type === "machine" && schedule.machine?.location) || (schedule.type === "asset" && schedule.asset?.location)) && (
                            <div className="flex align-items-center gap-2 mt-1">
                                <i className="pi pi-map-marker text-gray-500"></i>
                                <span className="text-gray-600">{schedule.type === "machine" ? schedule.machine.location : schedule.asset.location}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="field mb-4">
                                <label className="font-semibold text-gray-800 block mb-2">Frequency</label>
                                <Tag icon={frequencyDetails.icon} value={frequencyDetails.label} severity={frequencyDetails.severity} />
                                <p className="text-sm text-gray-600 mt-1">{frequencyDetails.description}</p>
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            <div className="field mb-4">
                                <label className="font-semibold text-gray-800 block mb-2">Priority</label>
                                <Tag icon={priorityDetails.icon} value={priorityDetails.label} severity={priorityDetails.severity} />
                                <p className="text-sm text-gray-600 mt-1">{priorityDetails.description}</p>
                            </div>
                        </div>
                    </div>

                    <Card className="mt-2" title="Due Date Information">
                        <div className={`p-4 border-2 border-round border-${color}-500 bg-${color}-50`}>
                            <div className="flex align-items-center gap-4">
                                <div className={`p-3 border-circle flex-shrink-0 bg-${color}-100`}>
                                    <i className={`${dueDateStatus.icon} text-2xl text-${color}-600`}></i>
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-xl mb-1">{formatDate(schedule.next_due_date)}</h5>
                                    <Tag value={dueDateStatus.message} severity={dueDateStatus.severity} className="font-bold" />
                                </div>
                            </div>
                        </div>

                        {upcomingEvents.length > 0 && (
                            <div className="mt-4">
                                <h5 className="font-semibold mb-3">Upcoming Due Dates</h5>
                                <Timeline value={upcomingEvents} align="alternate" marker={customEventMarker} content={customEventContent} className="customized-timeline" />
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column */}
                <div className="col-12 md:col-4 border-left-1 border-gray-200 pl-4">
                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Status</label>
                        <Tag value={schedule.is_active ? "Active" : "Inactive"} severity={schedule.is_active ? "success" : "danger"} icon={schedule.is_active ? "pi pi-check" : "pi pi-times"} />
                    </div>

                    <Divider />

                    <div className="field mb-3">
                        <label className="font-semibold text-gray-800 block mb-2">Created</label>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar-plus text-gray-500"></i>
                            <span className="text-sm text-gray-700">{formatDate(schedule.created_at)}</span>
                        </div>
                    </div>

                    {schedule.updated_at && schedule.updated_at !== schedule.created_at && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Last Updated</label>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-pencil text-gray-500"></i>
                                <span className="text-sm text-gray-700">{formatDate(schedule.updated_at)}</span>
                            </div>
                        </div>
                    )}

                    {schedule.createdBy && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Created By</label>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-user text-gray-500"></i>
                                <span className="text-sm text-gray-700">{schedule.createdBy.full_name}</span>
                            </div>
                        </div>
                    )}

                    <Divider />

                    <div className="field mb-3">
                        <label className="font-semibold text-gray-800 block mb-2">
                            <i className="pi pi-info-circle mr-2"></i>
                            Quick Info
                        </label>
                        <div className="p-3 border-1 border-blue-200 border-round bg-blue-50 text-sm text-blue-800">
                            <p className="mb-2">
                                <strong>Type:</strong> {frequencyDetails.label}
                            </p>
                            <p className="mb-2">
                                <strong>Priority:</strong> {priorityDetails.label}
                            </p>
                            <p className="mb-0">
                                <strong>Status:</strong> {dueDateStatus.message}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ScheduleDetailDialog;
