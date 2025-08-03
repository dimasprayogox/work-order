"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";

const ScheduleDetailDialog = ({ visible, onHide, schedule }) => {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("en-US", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFrequencyDetails = (frequency) => {
        const frequencyMap = {
            'daily': { label: 'Daily', severity: 'info', icon: 'pi pi-calendar', description: 'Maintenance required every day' },
            'weekly': { label: 'Weekly', severity: 'success', icon: 'pi pi-calendar', description: 'Maintenance required every week' },
            'monthly': { label: 'Monthly', severity: 'warning', icon: 'pi pi-calendar', description: 'Maintenance required every month' },
            'yearly': { label: 'Yearly', severity: 'danger', icon: 'pi pi-calendar', description: 'Maintenance required every year' }
        };
        return frequencyMap[frequency] || { label: frequency, severity: 'info', icon: 'pi pi-calendar', description: 'Custom frequency' };
    };

    const getPriorityDetails = (priority) => {
        const priorityMap = {
            'low': { label: 'Low Priority', severity: 'success', icon: 'pi pi-arrow-down', description: 'Low priority maintenance' },
            'medium': { label: 'Medium Priority', severity: 'warning', icon: 'pi pi-minus', description: 'Medium priority maintenance' },
            'high': { label: 'High Priority', severity: 'danger', icon: 'pi pi-arrow-up', description: 'High priority maintenance' }
        };
        return priorityMap[priority] || { label: priority, severity: 'info', icon: 'pi pi-minus', description: 'Custom priority' };
    };

    const getDueDateStatus = (dueDateString) => {
        if (!dueDateString) return { status: 'unknown', message: 'No due date set', severity: 'secondary' };

        const dueDate = new Date(dueDateString);
        const now = new Date();
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                status: 'overdue',
                message: `Overdue by ${Math.abs(diffDays)} days`,
                severity: 'danger',
                icon: 'pi pi-exclamation-triangle'
            };
        } else if (diffDays === 0) {
            return {
                status: 'due_today',
                message: 'Due today',
                severity: 'warning',
                icon: 'pi pi-clock'
            };
        } else if (diffDays === 1) {
            return {
                status: 'due_tomorrow',
                message: 'Due tomorrow',
                severity: 'warning',
                icon: 'pi pi-clock'
            };
        } else if (diffDays <= 7) {
            return {
                status: 'due_soon',
                message: `Due in ${diffDays} days`,
                severity: 'warning',
                icon: 'pi pi-clock'
            };
        } else if (diffDays <= 30) {
            return {
                status: 'upcoming',
                message: `Due in ${diffDays} days`,
                severity: 'info',
                icon: 'pi pi-calendar-clock'
            };
        } else {
            return {
                status: 'future',
                message: `Due in ${diffDays} days`,
                severity: 'success',
                icon: 'pi pi-check-circle'
            };
        }
    };

    const calculateNextDueDates = (currentDueDate, frequency, count = 5) => {
        if (!currentDueDate || !frequency) return [];

        const dates = [];
        let nextDate = new Date(currentDueDate);

        for (let i = 0; i < count; i++) {
            if (frequency === 'daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (frequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (frequency === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (frequency === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            dates.push(new Date(nextDate));
        }

        return dates;
    };

    // Return null after all hooks
    if (!schedule) return null;

    const frequencyDetails = getFrequencyDetails(schedule.frequency);
    const priorityDetails = getPriorityDetails(schedule.priority);
    const dueDateStatus = getDueDateStatus(schedule.next_due_date);
    const upcomingDates = calculateNextDueDates(schedule.next_due_date, schedule.frequency);

    const footerContent = (
        <div className="flex justify-content-end">
            <Button
                label="Close"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
            />
        </div>
    );

    return (
        <Dialog
            header="Schedule Details"
            visible={visible}
            style={{ width: "60rem" }}
            breakpoints={{ "960px": "75vw", "641px": "90vw" }}
            onHide={onHide}
            modal
            footer={footerContent}
        >
            <div className="grid">
                {/* Left Column */}
                <div className="col-12 md:col-8">
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
                        <label className="font-semibold text-gray-800 block mb-2">Machine</label>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-cog text-blue-500"></i>
                            <span className="font-medium">{schedule.machine?.name || 'N/A'}</span>
                            {schedule.machine?.machine_code && (
                                <Tag value={schedule.machine.machine_code} className="p-tag-secondary" />
                            )}
                        </div>
                        {schedule.machine?.location && (
                            <div className="flex align-items-center gap-2 mt-1">
                                <i className="pi pi-map-marker text-gray-500"></i>
                                <span className="text-gray-600">{schedule.machine.location}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="field mb-4">
                                <label className="font-semibold text-gray-800 block mb-2">Frequency</label>
                                <Tag
                                    value={<span className="flex align-items-center gap-1"><i className={frequencyDetails.icon}></i> {frequencyDetails.label}</span>}
                                    severity={frequencyDetails.severity}
                                    className="font-medium text-base"
                                />
                                <p className="text-sm text-gray-600 mt-1">{frequencyDetails.description}</p>
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            <div className="field mb-4">
                                <label className="font-semibold text-gray-800 block mb-2">Priority</label>
                                <Tag
                                    value={<span className="flex align-items-center gap-1"><i className={priorityDetails.icon}></i> {priorityDetails.label}</span>}
                                    severity={priorityDetails.severity}
                                    className="font-medium text-base"
                                />
                                <p className="text-sm text-gray-600 mt-1">{priorityDetails.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="field mb-4">
                        <label className="font-semibold text-gray-800 block mb-2">Next Due Date</label>
                        <div className="p-3 border-1 border-gray-300 border-round bg-gray-50">
                            <div className="flex align-items-center gap-2 mb-2">
                                <i className={`${dueDateStatus.icon} text-${dueDateStatus.severity === 'danger' ? 'red' : dueDateStatus.severity === 'warning' ? 'yellow' : dueDateStatus.severity === 'info' ? 'blue' : 'green'}-500`}></i>
                                <span className="font-medium">{formatDate(schedule.next_due_date)}</span>
                            </div>
                            <Tag
                                value={dueDateStatus.message}
                                severity={dueDateStatus.severity}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    {upcomingDates.length > 0 && (
                        <>
                            <Divider />
                            <div className="field mb-4">
                                <label className="font-semibold text-gray-800 block mb-2">
                                    <i className="pi pi-calendar-plus mr-2"></i>
                                    Upcoming Maintenance Dates
                                </label>
                                <div className="p-3 border-1 border-gray-300 border-round bg-blue-50">
                                    <p className="text-sm text-gray-600 mb-3">Based on {frequencyDetails.label.toLowerCase()} frequency:</p>
                                    <div className="grid">
                                        {upcomingDates.map((date, index) => (
                                            <div key={index} className="col-12 md:col-6">
                                                <div className="flex align-items-center gap-2 mb-2">
                                                    <i className="pi pi-calendar text-blue-500"></i>
                                                    <span className="text-sm">{formatDate(date.toISOString())}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column */}
                <div className="col-12 md:col-4">
                    <div className="field mb-3">
                        <label className="font-semibold text-gray-800 block mb-2">Schedule ID</label>
                        <div className="p-2 bg-gray-100 border-round">
                            <code className="text-sm text-gray-700">{schedule.id}</code>
                        </div>
                    </div>

                    <div className="field mb-3">
                        <label className="font-semibold text-gray-800 block mb-2">Created</label>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar text-gray-500"></i>
                            <span className="text-sm text-gray-700">{formatDate(schedule.created_at)}</span>
                        </div>
                    </div>

                    {schedule.updated_at && (
                        <div className="field mb-3">
                            <label className="font-semibold text-gray-800 block mb-2">Last Updated</label>
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-clock text-gray-500"></i>
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
                            Schedule Info
                        </label>
                        <div className="p-3 border-1 border-blue-200 border-round bg-blue-50">
                            <div className="text-sm text-blue-800">
                                <p className="mb-2">
                                    <strong>Maintenance Type:</strong> {frequencyDetails.label}
                                </p>
                                <p className="mb-2">
                                    <strong>Priority Level:</strong> {priorityDetails.label}
                                </p>
                                <p className="mb-0">
                                    <strong>Status:</strong> {dueDateStatus.message}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <strong>Status Jadwal:</strong>{" "}
                        {schedule.is_active ? (
                            <span style={{ color: "green" }}>Aktif</span>
                        ) : (
                            <span style={{ color: "red" }}>Nonaktif</span>
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ScheduleDetailDialog;
