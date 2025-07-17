"use client";

import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";

import { API_ENDPOINTS } from "../../../../app/api/api";
import { useEffect, useState } from "react";

const PartsForecasterPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const formatDate = (date) => {
        const day = date.getDate();
        const month = date.getMonth() + 1; // Months are 0-indexed!
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const getPartsForecaster = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.GETALLPARTSFORECASTER, { method: "GET" });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            setData(data);
        } catch (err) {
            console.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getPartsForecaster();
    }, []);

    return (
        <div>
            <div className="grid mb-3">
                <div className="col-6">
                    <div className="card text-center">
                        <h3 className="text-lg font-bold">{formatDate(new Date())}</h3>
                        Effective Period - From
                    </div>
                </div>
                <div className="col-6">
                    <div className="card text-center">
                        <h3 className="text-lg font-bold">{formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</h3>
                        Effective Period - To
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">All parts Purchasing Recommendations</h3>
                </div>

                <DataTable value={data} tableStyle={{ minWidth: "100rem" }} loading={loading} rows={5} rowsPerPageOptions={[5, 10, 20]} paginator>
                    <Column header="No" field="No" />
                    <Column header="Site" field="Site" />
                    <Column header="Part Code" field="Part Code" />
                    <Column header="Part" field="Part" />
                    <Column header="Category" field="Category" />
                    <Column header="Scheduled Part Usage" field="Scheduled Part Usage" />
                    <Column header="Predicted Unplanned" field="Predicted Unplanned" />
                    <Column header="Stock on Hand" field="Stock on Hand" />
                    <Column header="Minimum Stock Quantity" field="Minimum Stock Quantity" />
                    <Column header="Recommended Purchase" field="Recommended Purchase" />
                    <Column header="Order Status" field="Order Status" />
                </DataTable>
            </div>
        </div>
    );
};

export default PartsForecasterPage;
