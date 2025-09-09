import { Skeleton } from "primereact/skeleton";
import { Chart } from "primereact/chart";
import { MoreHorizontal } from "lucide-react";

const WorkOrderStatusChart = ({ loading, data, options }) => {
    const chartOptions = {
        ...options,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            ...options?.plugins,
            legend: {
                display: false 
            }
        }
    };

    const getColorForLabel = (label) => {
        if (!data || !data.datasets || !data.datasets[0]) return "#cccccc";

        const index = data.labels.indexOf(label);
        if (index === -1) return "#cccccc";

        return data.datasets[0].backgroundColor[index];
    };

    return (
        <div className=" h-full border-round-xl p-3 flex flex-column">
            <div className="flex justify-content-between align-items-center mb-4">
                <h5 className="font-semibold text-lg m-0 text-900">Work Order Status</h5>
                <button className="p-1 border-none bg-transparent text-color-secondary cursor-pointer">
                    <MoreHorizontal size={12} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-content-center">
                    <Skeleton shape="circle" size="200px" />
                </div>
            ) : (
                <div className="flex flex-column align-items-center w-full">
                    {/* Chart container */}
                    <div className="flex justify-content-center" style={{ height: "200px", width: "200px" }}>
                        <Chart type="doughnut" data={data} options={chartOptions} />
                    </div>

                    {/* Legend container */}
                    <div className="flex justify-content-center flex-wrap mt-3 gap-4">
                        {data &&
                            data.labels &&
                            data.labels.map((label, index) => (
                                <div key={index} className="flex align-items-center gap-2">
                                    <div
                                        className="border-circle"
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                            backgroundColor: getColorForLabel(label)
                                        }}
                                    />
                                    <span className="text-sm white-space-nowrap">{label}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrderStatusChart;
