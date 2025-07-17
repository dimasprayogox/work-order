"use client";

import Link from "next/link";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { Paginator } from "primereact/paginator";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../../../../app/api/api";

const CustomCard = ({ title, description, worker, queue, date, requestBy }) => {
    return (
        <div className="card">
            <h6>
                <span className="font-bold">REQUESTED</span> {title}
            </h6>

            <div className="">{description}</div>
            <div className="">{worker}</div>

            <Divider />

            <div className="flex flex-col justify-content-between">
                <span className="font-semibold">{queue}</span>

                <div>
                    <span className="mr-3">Submitted on: {date}</span>
                    Requester: {requestBy}
                </div>
            </div>
        </div>
    );
};

const WorkRequest = () => {
    const [loading, setLoading] = useState(false);
    const [request, setRequest] = useState(false);

    const [sortRequest, setSortRequest] = useState("latest");
    const [workRequest, setWorkRequest] = useState([]);

    const getWorkRequest = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.GETALLWORKREQUEST, { method: "GET" });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            const formattedData = data.map((item) => ({
                ...item,
                submittedOn: new Date(item.submittedOn)
            }));
            setWorkRequest(formattedData);
        } catch (err) {
            console.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const sortedWorkRequest = [...workRequest].sort((a, b) => {
        if (sortRequest === "latest") {
            return a.submittedOn - b.submittedOn;
        } else {
            return b.submittedOn - a.submittedOn;
        }
    });

    useEffect(() => {
        getWorkRequest();
    }, []);

    return (
        <div className="card">
            <div className="flex align-items-center justify-content-between mb-5">
                <h3>Work Requests</h3>
                <Link href="/maintenance/work-orders/request/add">
                    <Button label="New Request" icon="pi pi-plus" />
                </Link>
            </div>

            <div>
                {/* <h5>Work Request</h5> */}
                <div className="flex align-items-center justify-content-between my-4">
                    <InputText placeholder="Search" />

                    <div className="flex gap-2">
                        <span className="mt-1">Only my Request</span>
                        <InputSwitch checked={request} onChange={(e) => setRequest(e.value)} />
                        <Button icon="pi pi-sync" onClick={getWorkRequest} />
                        <Dropdown placeholder="Sort by submitted" value={sortRequest} onChange={(e) => setSortRequest(e.value)} options={["latest", "earliest"]} style={{ width: "10em" }} />
                    </div>
                </div>
            </div>
            {loading ? (
                <div className="flex align-items-center justify-content-center">
                    <ProgressSpinner />
                </div>
            ) : (
                sortedWorkRequest.map((item, index) => <CustomCard key={index} title={item.title} description={item.description} worker={item.worker} queue={item.queue} date={item.submittedOn.toLocaleString()} requestBy={item.requester} />)
            )}
        </div>
    );
};

export default WorkRequest;
