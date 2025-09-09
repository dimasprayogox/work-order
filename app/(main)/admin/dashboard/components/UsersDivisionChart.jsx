import { Skeleton } from "primereact/skeleton";
import { Chart } from "primereact/chart";
import { MoreHorizontal } from "lucide-react";

const UsersDivisionChart = ({ loading, data, options }) => {
    return (
        <div className=" h-full border-round-xl p-3">
            <div className="flex justify-content-between align-items-center mb-4">
                <h5 className="font-semibold text-lg m-0 text-900">User Distribution per Division</h5>
                <button className="p-1 border-none bg-transparent text-color-secondary cursor-pointer">
                    <MoreHorizontal size={18} />
                </button>
            </div>
            {loading ? (
                <Skeleton height="250px" className="border-round" />
            ) : (
                <div className="relative" style={{ height: "250px" }}>
                    <Chart type="bar" data={data} options={options} />
                </div>
            )}
        </div>
    );
};

export default UsersDivisionChart;
