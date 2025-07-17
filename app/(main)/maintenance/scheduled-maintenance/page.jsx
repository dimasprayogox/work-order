"use client";

import { useEffect, useState } from "react";

import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Accordion, AccordionTab } from "primereact/accordion";
import Link from "next/link";
import { Dropdown } from "primereact/dropdown";
import { API_ENDPOINTS } from "../../../../app/api/api";
// import Link from 'next/link';

const HeaderDataTable = ({ search, status, setSearch, setStatus }) => (
    <div className="flex align-items-center justify-content-between gap-2">
        <div>
            <span className="text-xl font-bold mr-3">Work Orders</span>
            <Dropdown placeholder="Filter Status" value={status} options={["", "Low", "Medium", "High"]} onChange={(e) => setStatus(e.value)} />
        </div>

        <InputText placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
);

const CustomTypeFieldDataTable = (rowData) => {
    /**
     * Cleaning
     * Corrective
     * Inspection
     * Preventive
     */
    let bgClass = "";
    switch (rowData.type) {
        case "EWO":
            bgClass = "bg-red-800 text-white";
            break;
        case "Inspection":
            bgClass = "bg-gray-400 text-white";
            break;
        case "Preventive":
            bgClass = "bg-blue-800 text-white";
            break;
        // return <span className="bg-yellow-200">{rowData.type}</span>;
        case "Cleaning":
            bgClass = "bg-primary-500 text-white";
            break;
        // return <span className="bg-success">{rowData.type}</span>;
        // return <span className="bg-primary">{rowData.type}</span>;

        default:
            bgClass = "bg-gray-100 text-gray-800";
    }

    return <span className={`px-2 py-1 text-sm rounded-md font-medium ${bgClass}`}>{rowData.type}</span>;
};

const ScheduledMaintenancePage = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);

    const [activeIndex, setActiveIndex] = useState(0);

    const [scheduledMaintenance, setScheduledMaintenance] = useState([]);
    const [continent, setContinent] = useState([]);

    const getScheduledMaintenance = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.GETALLSCHEDULEMAINTENANCE, { method: "GET" });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            setScheduledMaintenance(data);
        } catch (e) {
            console.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getContinent = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:3001/continent", { method: "GET" });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            setContinent(data);
        } catch (err) {
            console.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = scheduledMaintenance.filter((item) => {
        const matchesStatus = status === "" || item.priority.toLowerCase() === status.toLowerCase();
        const matchesSearch = search === "" || item.code.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    useEffect(() => {
        getScheduledMaintenance();
        getContinent();
    }, []);

    return (
        <>
            <div className="card">
                <h3>Scheduled Maintenance Page</h3>

                <div className="flex flex-row gap-2">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    {/* <Link href="/work-orders/add">
                    </Link> */}
                    <Button size="small" label="New" icon="pi pi-plus" outlined severity="success" onClick={() => setVisible(true)} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined />
                    <Button size="small" label="Print" icon="pi pi-print" outlined />
                    <Divider layout="vertical" />
                    {/* onClick={handleDelete} */}
                    <Button size="small" label="Delete" icon="pi pi-trash" outlined severity="danger" disabled={selected.length === 0} />
                    <Divider layout="vertical" />
                    <Button size="small" icon="pi pi-ellipsis-v" outlined />
                </div>

                <DataTable
                    className="my-3"
                    value={filteredData}
                    header={<HeaderDataTable search={search} status={status} setSearch={setSearch} setStatus={setStatus} />}
                    selection={selected}
                    loading={loading}
                    onSelectionChange={(e) => setSelected(e.value)}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 20]}
                >
                    <Column selectionMode="multiple" />
                    <Column header="When" field="when" style={{ width: "10%" }} />
                    <Column header="Description" field="description" style={{ minWidth: "250px" }} />
                    <Column header="SM Status" field="smStatus" body={(rowData) => (rowData.smStatus ? <i className="pi pi-play"></i> : <i className="pi pi-pause"></i>)} />
                    <Column header="Code" field="code" />
                    <Column header="Priority" field="priority" />
                    <Column header="Assets" field="assets" style={{ minWidth: "200px" }} />
                    <Column header="Assigned Users" field="assignedUsers" />
                    <Column header="Time Estimated Hours" field="estimatedHours" />
                    <Column header="Type" sortable field="type" body={CustomTypeFieldDataTable} />
                </DataTable>

                {/* Add new work orders */}
                <Dialog
                    header="Pick a site for work order"
                    visible={visible}
                    style={{ width: "50vw" }}
                    onHide={() => {
                        if (!visible) return;
                        setVisible(false);
                    }}
                >
                    <Accordion activeIndex={activeIndex}>
                        {continent.map((item, index) => (
                            <AccordionTab key={index} header={item.continent}>
                                <ul className="list-disc pl-4">
                                    {item.cities.map((city, idx) => (
                                        <li key={idx}>
                                            <Link href={`/scheduled-maintenance/add?city=${city}`}>{city}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionTab>
                        ))}
                    </Accordion>
                </Dialog>
            </div>
        </>
    );
};

export default ScheduledMaintenancePage;
