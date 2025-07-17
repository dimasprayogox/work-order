/* eslint-disable @next/next/no-img-element */
"use client";

import { Knob } from "primereact/knob";
import { Panel } from "primereact/panel";
import { ProgressBar } from "primereact/progressbar";
import { useEffect, useState } from "react";

const Dashboard = () => {
    const [totalWorkOrder, setTotalWorkOrder] = useState(0);
    const [overdueWorkOrder, setOverdueWorkOrder] = useState(0);
    const max = 12;

    useEffect(() => {
        const timer = setTimeout(() => {
            setTotalWorkOrder(30);
            setOverdueWorkOrder(6);
        }, 5000);

        return () => clearTimeout(timer);
    }, [totalWorkOrder, overdueWorkOrder]);

    return (
        <>
            <div className="card">
                <h2 className="font-semibold">Admin Dashboard</h2>
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "575px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h4 className="font-bold">WORK ORDER ON-TIME COMPLETION RATE</h4>
                                <p>All Assets & All Groups</p>
                            </div>

                            <Knob value={totalWorkOrder} valueTemplate={"{value}%"} readOnly size={250} />
                            {/* <h6>All Assets & All Groups</h6> */}
                        </div>
                        {/* <Panel header="WORK ORDER ON-TIME COMPLETION RATE" className="text-center">
                        </Panel> */}
                    </div>

                    <div className="col-12 md:col-6">
                        <div className="grid">
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px ", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">WORK ORDER ON-TIME COMPLETION RATE</h6>
                                        <p>All Assets & All Groups</p>
                                    </div>
                                    <Knob value={overdueWorkOrder} max={max} valueTemplate={`{value} of ${max}`} readOnly />
                                </div>
                            </div>
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">CLOSED WORK ORDER</h6>
                                        <p>All Assets & All Groups</p>
                                    </div>
                                    <h3>25</h3>
                                </div>
                                {/* <Panel header="CLOSED WORK ORDERS" className="text-center">
                                    <h5>30</h5>
                                </Panel> */}
                            </div>
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">WORK REQUEST</h6>
                                        <p>All Assets & All Groups</p>
                                    </div>
                                    <h3 className="text-yellow-500">3</h3>
                                </div>
                                {/* <Panel header="WORK REQUESTS" className="text-center">
                                    <h5 className="font-bold text-yellow-500">13</h5>
                                </Panel> */}
                            </div>

                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">MTTR (FROM WORK ORDER)</h6>
                                        <p>All Assets</p>
                                    </div>
                                    <h3>2H</h3>
                                </div>
                                {/* <Panel header="MTTR (FROM WORK ORDER)" className="text-center">
                                    <h5 className="font-bold">2H</h5>
                                </Panel> */}
                            </div>
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">CURRENT OFFLINE ASSETS</h6>
                                        <p>All Assets</p>
                                    </div>
                                    <h3>25</h3>
                                </div>
                                {/* <Panel header="CURRENT OFFLINE ASSETS" className="text-center">
                                    <h5 className="font-bold">1</h5>
                                </Panel> */}
                            </div>
                            <div className="col-12 md:col-4">
                                <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ height: "280px", flexDirection: "column" }}>
                                    <div className="text-center mb-3">
                                        <h6 className="font-bold">LOW STOCK ITEMS</h6>
                                        <p>All Assets</p>
                                    </div>
                                    <h3 className="text-yellow-500">100</h3>
                                </div>
                                {/* <Panel header="LOW STOCK ITEMS" className="text-center">
                                    <h5 className="font-bold text-yellow-500">100</h5>
                                </Panel> */}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">MTBF (FROM AVAILABILITY TRACKER)</h6>
                                <p>All Assets</p>
                            </div>
                            <h3>7.9H</h3>
                        </div>
                        {/* <Panel header="MTBF (FROM AVAILABILITY TRACKER)" className="text-center">
                            <h5 className="font-bold">7.9h</h5>
                        </Panel> */}
                    </div>
                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">MAINTENANCE EXPENSES</h6>
                                <p>All Assets</p>
                            </div>
                            <h3>$100.76</h3>
                        </div>
                        {/* <Panel header="MAINTENANCE EXPENSES" className="text-center">
                            <h5 className="font-bold">$100.76</h5>
                        </Panel> */}
                    </div>
                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">MAINTENANCE PERCENTAGE</h6>
                                <p>All Assets</p>
                            </div>
                            <h3>100%</h3>
                        </div>
                        {/* <Panel header="PLANNED MAINTENANCE PERCENTAGE" className="text-center">
                            <h5 className="font-bold">100%</h5>
                        </Panel> */}
                    </div>
                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">PURCHASE ORDERS AWAITING APPROVAL</h6>
                                <p>All Assets</p>
                            </div>
                            <h3 className="text-yellow-500">0</h3>
                        </div>
                        {/* <Panel header="PURCHASE ORDERS AWAITING APPROVAL" className="text-center">
                            <h5 className="font-bold text-yellow-500">0</h5>
                        </Panel> */}
                    </div>
                    <div className="col-12 md:col-2">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">MAINTENANCE EXPENSES</h6>
                                <p>All Assets</p>
                            </div>
                            <h3>$80</h3>
                        </div>
                        {/* <Panel header="MAINTENANCE EXPENSES" className="text-center">
                            <h5 className="font-bold">$70</h5>
                        </Panel> */}
                    </div>
                </div>

                {/* <div className="grid mb-3">
                    <div className="col-12 lg:col-6 xl:col-3">
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">Orders</span>
                                    <div className="text-900 font-medium text-xl">152</div>
                                </div>
                                <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                    <i className="pi pi-shopping-cart text-blue-500 text-xl" />
                                </div>
                            </div>
                            <span className="text-green-500 font-medium">24 new </span>
                            <span className="text-500">since last visit</span>
                        </div>
                    </div>
                    <div className="col-12 lg:col-6 xl:col-3">
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">Revenue</span>
                                    <div className="text-900 font-medium text-xl">$2.100</div>
                                </div>
                                <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                    <i className="pi pi-map-marker text-orange-500 text-xl" />
                                </div>
                            </div>
                            <span className="text-green-500 font-medium">%52+ </span>
                            <span className="text-500">since last week</span>
                        </div>
                    </div>
                    <div className="col-12 lg:col-6 xl:col-3">
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">Customers</span>
                                    <div className="text-900 font-medium text-xl">28441</div>
                                </div>
                                <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                    <i className="pi pi-inbox text-cyan-500 text-xl" />
                                </div>
                            </div>
                            <span className="text-green-500 font-medium">520 </span>
                            <span className="text-500">newly registered</span>
                        </div>
                    </div>
                    <div className="col-12 lg:col-6 xl:col-3">
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">Comments</span>
                                    <div className="text-900 font-medium text-xl">152 Unread</div>
                                </div>
                                <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                    <i className="pi pi-comment text-purple-500 text-xl" />
                                </div>
                            </div>
                            <span className="text-green-500 font-medium">85 </span>
                            <span className="text-500">responded</span>
                        </div>
                    </div>
                </div> */}
            </div>
        </>
    );
};

export default Dashboard;
