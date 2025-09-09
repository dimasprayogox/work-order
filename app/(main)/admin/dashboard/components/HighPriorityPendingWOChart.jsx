import { Skeleton } from "primereact/skeleton";
import { AlertTriangle } from "lucide-react";

const HighPriorityPendingWOChart = ({ loading, data }) => {
    return (
        <div className=" h-full border-round-xl p-3">
            <div className="flex justify-content-between align-items-center mb-4">
                <h5 className="font-semibold text-lg m-0 text-900">WO High Priority & Pending</h5>
            </div>
            {loading ? (
                <Skeleton height="250px" className="border-round" />
            ) : data?.length === 0 ? (
                <div className="text-center text-color-secondary py-5">Tidak ada work order prioritas tinggi yang pending.</div>
            ) : (
                <ul className="list-none m-0 p-0" style={{ maxHeight: 250, overflowY: "auto" }}>
                    {data.map((wo) => (
                        <li key={wo.id} className="mb-3 flex align-items-center gap-3 border-bottom-1 surface-border pb-2">
                            <AlertTriangle className="text-red-500" size={20} />
                            <div>
                                <div className="font-semibold">{wo.title}</div>
                                <div className="text-xs text-color-secondary">
                                    {wo.machine?.name || wo.asset?.name || "-"} | Jadwal: {wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString("id-ID") : "-"}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default HighPriorityPendingWOChart;
