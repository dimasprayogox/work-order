"use client";

import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { useState } from "react";

const AssetInsightPage = () => {
    const assetInsights = {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [
            {
                label: "Low Risk Severity",
                data: [65, 59, 80, 81, 56, 55, 40],
                fill: false,
                tension: 0.4
            },
            {
                label: "High Risk Severity",
                data: [28, 48, 40, 19, 86, 27, 90],
                fill: false,
                tension: 0.4
            }
        ]
    };

    const [selectedAsset, setSelectedAsset] = useState("");
    const [asset, setAssets] = useState(["forklift #1", "forklift #2", "forklift #3", "forklift #4"]);
    return (
        <div>
            <div className="my-3">
                <p>
                    Asset <sup>*</sup>
                </p>

                <Dropdown value={selectedAsset} options={asset} style={{ width: "150px" }} onChange={(e) => setSelectedAsset(e.value)} />
            </div>

            <div className="grid">
                <div className="col-12 md:col-4">
                    <div className="card">
                        <h4 className="mb-3 text-center">Asset name</h4>
                        <h5 className="text-center m-0 p-0">{selectedAsset || "Not selected asset"}</h5>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="card">
                        <h5 className="text-center m-0 p-0">$100</h5>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="card">
                        <h5 className="text-center m-0 p-0">{new Date("2025-04-05").toLocaleDateString()}</h5>
                        <p className="mt-3 text-center font-semibold">Report Generated On</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <Chart
                    type="line"
                    data={assetInsights}
                    options={{
                        maintainAspectRatio: false,
                        aspectRatio: 1
                    }}
                />
            </div>

            <div className="my-5 text-center">
                <h4>Asset Insights Overview</h4>

                <p>To view more detailed insights</p>
            </div>

            <div className="card mb-3">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Asset Insights Overview</h3>
                </div>

                <DataTable tableStyle={{ minWidth: "100rem" }} rows={5} rowsPerPageOptions={[5, 10, 20]} paginator>
                    <Column header="No" field="No" />
                    <Column header="Asset Name" />
                    <Column header="Asset Code" />
                    <Column header="Category" />
                    <Column header="Asset Maintenance Efficiency" />
                    <Column header="Prediction for Next Month" />
                    <Column header="Number of Closed WOs" />
                    <Column header="Maintenance Hours" />
                </DataTable>
            </div>
        </div>
    );
};

export default AssetInsightPage;
