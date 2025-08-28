import React, { useMemo, useState } from "react";
import { Calendar } from "primereact/calendar";
import { motion } from "framer-motion";
import { classNames } from "primereact/utils";
import { Card } from "primereact/card";

const MaintenanceSchedule = ({ workOrders, maintenanceSchedules }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const allScheduledEvents = useMemo(() => {
        const events = [];

        workOrders.forEach((wo) => {
            if (wo.scheduled_date) {
                // Get the name from either machine or asset
                const itemName = wo.machine?.name || wo.asset?.name || "Unspecified";

                events.push({
                    date: new Date(wo.scheduled_date),
                    type: "workOrder",
                    title: wo.title,
                    description: wo.description,
                    itemName: itemName,
                    status: wo.status,
                    priority: wo.priority,
                    assignedTo: wo.assignedTo?.full_name,
                    id: wo.id
                });
            }
        });

        maintenanceSchedules.forEach((sch) => {
            if (sch.next_due_date) {
                // Get the name from either machine or asset
                const itemName = sch.machine?.name || sch.asset?.name || "Unspecified";

                events.push({
                    date: new Date(sch.next_due_date),
                    type: "maintenanceSchedule",
                    title: sch.title,
                    description: sch.description,
                    itemName: itemName,
                    frequency: sch.frequency,
                    id: sch.id
                });
            }
        });

        events.sort((a, b) => a.date.getTime() - b.date.getTime());
        return events;
    }, [workOrders, maintenanceSchedules]);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "text-yellow-600";
            case "in progress":
                return "text-blue-600";
            case "completed":
                return "text-green-600";
            case "high":
                return "text-red-600";
            case "medium":
                return "text-orange-600";
            case "low":
                return "text-blue-400";
            default:
                return "text-gray-600";
        }
    };

    const dateTemplate = (date) => {
        const eventsOnThisDay = allScheduledEvents.filter((event) => event.date.getDate() === date.day && event.date.getMonth() === date.month && event.date.getFullYear() === date.year);

        const hasEvent = eventsOnThisDay.length > 0;
        const hasWorkOrder = eventsOnThisDay.some((e) => e.type === "workOrder");
        const hasMaintenance = eventsOnThisDay.some((e) => e.type === "maintenanceSchedule");

        let bgColor = "";

        if (hasWorkOrder && hasMaintenance) {
            bgColor = "bg-orange-500"; // kombinasi
        } else if (hasWorkOrder) {
            bgColor = "bg-blue-500"; // khusus work order
        } else if (hasMaintenance) {
            bgColor = "bg-purple-500"; // khusus maintenance
        }

        return (
            <div
                className={classNames("relative p-1 rounded-full w-2.5rem h-2.5rem flex align-items-center justify-content-center", {
                    [bgColor]: hasEvent,
                    "text-surface-900": !hasEvent,
                    "bg-primary": date.today && !hasEvent,
                    "text-primary-50": date.today && !hasEvent,
                    "font-bold": hasEvent || date.today,
                    "text-white": hasEvent // biar angka tanggal kontras
                })}
                onClick={() => setSelectedDate(new Date(date.year, date.month, date.day))}
                style={{ cursor: "pointer" }}
            >
                {date.day}
            </div>
        );
    };

    const eventsForSelectedDate = allScheduledEvents.filter((event) => event.date.getDate() === selectedDate.getDate() && event.date.getMonth() === selectedDate.getMonth() && event.date.getFullYear() === selectedDate.getFullYear());

    const upcomingEvents = allScheduledEvents.filter((event) => event.date >= new Date()).slice(0, 5);

    const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    return (
        <div className="grid mt-4">
            <div className="col-12 md:col-8">
                <div className="card overflow-hidden">
                    <h5 className="font-bold mb-4">Maintenance Calendar</h5>
                    <div className="w-full overflow-auto">
                        <Calendar inline value={selectedDate} readOnlyInput style={{ width: "100%", minWidth: "300px" }} dateTemplate={dateTemplate} onChange={(e) => setSelectedDate(e.value)} />
                    </div>
                </div>
            </div>

            <div className="col-12 md:col-4">
                <div className="card">
                    <h5 className="font-bold mb-4">Upcoming Tasks</h5>
                    <div className="grid" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        {upcomingEvents.slice(0, 4).map((event, index) => (
                            <div key={`upcoming-${event.type}-${event.id}`} className="col-12">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.1 }} className="border-round border-1 surface-border p-3 mb-2">
                                    <div className="flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <h6 className="my-0 text-sm">{event.title}</h6>
                                            <p className="text-xs text-color-secondary mt-1 mb-1">
                                                {event.date.toLocaleDateString()} • {event.itemName}
                                            </p>
                                        </div>
                                        <i
                                            className={classNames("pi mt-1 ml-2", {
                                                "pi-briefcase text-blue-500": event.type === "workOrder",
                                                "pi-cog text-purple-500": event.type === "maintenanceSchedule"
                                            })}
                                        />
                                    </div>
                                    <div className="grid text-xs mt-2">
                                        {event.type === "workOrder" && (
                                            <>
                                                <div className="col-6 font-semibold">Status:</div>
                                                <div className={classNames("col-6", getStatusStyle(event.status))}>{event.status}</div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <h5 className="font-bold mb-4">Schedule for {formatDate(selectedDate)}</h5>
                    <div className="grid">
                        {eventsForSelectedDate.length > 0 ? (
                            eventsForSelectedDate.map((event, index) => (
                                <div key={`${event.type}-${event.id}`} className="col-12 md:col-6 lg:col-4 ">
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                        <Card
                                            className={classNames("p-1 ", {
                                                "border-left-3 border-blue-500": event.type === "workOrder",
                                                "border-left-3 border-purple-500": event.type === "maintenanceSchedule"
                                            })}
                                        >
                                            <div className="flex justify-content-between align-items-start mb-2">
                                                <h6 className="my-0 text-base">{event.title}</h6>
                                                <i
                                                    className={classNames("pi", {
                                                        "pi-briefcase text-blue-500": event.type === "workOrder",
                                                        "pi-cog text-purple-500": event.type === "maintenanceSchedule"
                                                    })}
                                                />
                                            </div>

                                            <p className="text-xs text-color-secondary mt-1 mb-2 line-clamp-2">{event.description}</p>

                                            <div className="text-sm mt-2">
                                                <div className="flex align-items-center mb-2">
                                                    <i className="pi pi-cog mr-2 text-color-secondary"></i>
                                                    <span className="font-medium">Equipment:</span>
                                                    <span className="ml-1 text-sm">{event.itemName}</span>
                                                </div>

                                                {event.type === "workOrder" && (
                                                    <>
                                                        <div className="flex align-items-center mb-2">
                                                            <i className="pi pi-info-circle mr-2 text-color-secondary"></i>
                                                            <span className="font-medium">Status:</span>
                                                            <span className={classNames("ml-1", getStatusStyle(event.status))}>{event.status}</span>
                                                        </div>

                                                        <div className="flex align-items-center mb-2">
                                                            <i className="pi pi-exclamation-triangle mr-2 text-color-secondary"></i>
                                                            <span className="font-medium">Priority:</span>
                                                            <span className={classNames("ml-1", getStatusStyle(event.priority))}>{event.priority}</span>
                                                        </div>

                                                        <div className="flex align-items-center">
                                                            <i className="pi pi-user mr-2 text-color-secondary"></i>
                                                            <span className="font-medium">Assigned:</span>
                                                            <span className="ml-1">{event.assignedTo || "Unassigned"}</span>
                                                        </div>
                                                    </>
                                                )}

                                                {event.type === "maintenanceSchedule" && (
                                                    <div className="flex align-items-center">
                                                        <i className="pi pi-calendar mr-2 text-color-secondary"></i>
                                                        <span className="font-medium">Frequency:</span>
                                                        <span className="ml-1">{event.frequency}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <p className="text-color-secondary text-center py-4">No scheduled tasks for this date.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceSchedule;
