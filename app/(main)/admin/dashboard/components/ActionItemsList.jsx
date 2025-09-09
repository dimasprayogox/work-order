import { Skeleton } from "primereact/skeleton";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, CheckCircle2, Clock, User } from "lucide-react";

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const ActionItemsList = ({ loading, items = [] }) => {
    return (
        <>
            <div className="flex justify-content-between align-items-center ">
                <h5 className="font-semibold flex align-items-center m-0 text-800">Need Attention</h5>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center justify-center bg-red-100 text-red-600 text-xs font-medium px-2 py-1 gap-1"
                    style={{
                        borderRadius: "0.5rem",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                    }}
                >
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium leading-none flex items-center pt-2">{items.length} items</span>
                </motion.div>
            </div>
            <div className="overflow-hidden">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="mb-3">
                            <Skeleton height="4.5rem" className="border-round" />
                        </div>
                    ))
                ) : items.length > 0 ? (
                    items.slice(0, 4).map((wo) => (
                        <div key={wo.id} className="flex align-items-center py-3 px-3 border-bottom-1 surface-border hover:surface-50 transition-duration-150 cursor-pointer">
                            <div className="flex align-items-center justify-content-center bg-red-100 border-circle mr-3 flex-shrink-0" style={{ width: "48px", height: "48px" }}>
                                <Clock className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm line-height-2 truncate">{wo.title}</div>
                                <div className="text-xs text-color-secondary flex align-items-center mt-1">
                                    <Calendar size={12} className="mr-1" />
                                    {formatDate(wo.scheduled_date)}
                                </div>
                                <div className="text-xs text-color-secondary flex align-items-center mt-1">
                                    <User size={12} className="mr-1" />
                                    {wo.assignedTo?.full_name || "Belum ditugaskan"}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-color-secondary py-5">
                        <CheckCircle2 size={48} className="text-green-400 mb-2" />
                        <p className="font-medium">Tidak ada pekerjaan yang lewat jatuh tempo.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default ActionItemsList;
