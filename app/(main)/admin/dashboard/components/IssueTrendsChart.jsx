import { Skeleton } from "primereact/skeleton";
import { Chart } from "primereact/chart";
import { MoreHorizontal } from "lucide-react";

const IssueTrendsChart = ({ loading, data, options }) => {
    // tambahkan supaya chart bisa menyesuaikan container
    const mergedOptions = {
        ...options,
        maintainAspectRatio: false,
        responsive: true
    };

    return (
        <div className="card border-round-xl surface-0 shadow-2 p-3 border-1 border-50 border-round h-full transition-all transition-duration-300 hover:shadow-3" style={{ maxHeight: "380px", overflowY: "auto" }}>
            <div className="flex justify-content-between align-items-center mb-4">
                <h5 className="font-semibold text-lg m-0 text-900">Issue Report Trends Monthly</h5>
                <button className="p-1 border-none bg-transparent text-color-secondary cursor-pointer">
                    <MoreHorizontal size={10} />
                </button>
            </div>
            {loading ? (
                <Skeleton height="100px" className="border-round" />
            ) : (
                <div style={{ height: "279px" }}>
                    {/* Atur max tinggi chart */}
                    <Chart type="line" data={data} options={mergedOptions} style={{ height: "100%" }} />
                </div>
            )}
        </div>
    );
};

export default IssueTrendsChart;
