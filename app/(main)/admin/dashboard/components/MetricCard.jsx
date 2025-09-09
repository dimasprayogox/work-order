import { Skeleton } from "primereact/skeleton";

const MetricCard = ({ loading, title, value, icon, color, trend, trendLabel = "compared to yesterday" }) => {
    return (
        <div className="surface-0 shadow-2 p-3 border-1 border-50 border-round h-full transition-all transition-duration-300 hover:shadow-3">
            {loading ? (
                <Skeleton height="6rem" className="border-round" />
            ) : (
                <>
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-2">{title}</span>
                            <div className="text-900 font-bold text-xl">
                                <span className={`text-${color}-500`}>{value ?? 0}</span>
                            </div>
                        </div>
                        <div className={`flex align-items-center justify-content-center bg-${color}-100 border-round`} style={{ width: "2.5rem", height: "2.5rem" }}>
                            {icon}
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <span className={`text-xs font-medium ${trend?.startsWith("+") ? "text-green-500" : "text-red-500"}`}>{trend}</span>
                        <span className="text-500 text-xs">{trendLabel}</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default MetricCard;
