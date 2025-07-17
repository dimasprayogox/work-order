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
import { Paginator } from "primereact/paginator";
import { API_ENDPOINTS } from "../../../../app/api/api";
// import Link from 'next/link';

const HeaderDataTable = ({ search, status, setSearch, setStatus }) => (
    <div className="flex align-items-center justify-content-between gap-2">
        <div>
            <span className="text-xl font-bold mr-3">Work Orders</span>
            <Dropdown placeholder="Filter Status" value={status} options={["", "Pending", "In Progress", "Completed"]} onChange={(e) => setStatus(e.value)} />
        </div>

        <InputText placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>
);

const CustomTypeFieldDataTable = (rowData) => {
    let bgClass = "";
    switch (rowData.type) {
        case "Maintenance":
            bgClass = "bg-yellow-100 text-yellow-800";
            break;
        // return <span className="bg-yellow-200">{rowData.type}</span>;
        case "Repair":
            bgClass = "bg-red-100 text-red-800";
            break;
        // return <span className="bg-success">{rowData.type}</span>;
        case "Inspection":
            bgClass = "bg-gray-100 text-gray-800";
            break;
        // return <span className="bg-primary">{rowData.type}</span>;

        default:
            bgClass = "bg-gray-100 text-gray-800";
    }

    return <span className={`px-2 py-1 text-sm rounded-md font-medium ${bgClass}`}>{rowData.type}</span>;
};

const WorkOrderPage = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);

    const [activeIndex, setActiveIndex] = useState(0);

    const [workOrders, setWorkOders] = useState([]);
    const [continent, setContinent] = useState([]);

    const getWorkOrder = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.GETALLWORKORDER, { method: "GET" });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            setWorkOders(data);
        } catch (err) {
            console.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getContinent = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.GETALLCONTINENT, { method: "GET" });

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

    const filteredData = workOrders.filter((item) => {
        const matchesStatus = status === "" || item.status.toLowerCase() === status.toLowerCase();
        const matchesSearch = search === "" || item.code.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleDelete = () => {
        const selectedCodes = selected.map((item) => item.code);
        const updatedWorkerOrders = workOrders.filter((item) => !selectedCodes.includes(item.code));
        setWorkOders(updatedWorkerOrders);
        setSelected([]);
    };

    useEffect(() => {
        getWorkOrder();
        getContinent();
    }, []);

    return (
        <>
            <div className="card">
                <h3>Work Order Page</h3>

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
                    <Button size="small" label="Delete" icon="pi pi-trash" outlined severity="danger" onClick={handleDelete} disabled={selected.length === 0} />
                    <Divider layout="vertical" />
                    <Button size="small" icon="pi pi-ellipsis-v" outlined />
                </div>

                <DataTable
                    className="my-3"
                    value={filteredData}
                    selection={selected}
                    onSelectionChange={(e) => {
                        setSelected(e.value);
                    }}
                    dataKey="code"
                    loading={loading}
                    header={<HeaderDataTable search={search} status={status} setSearch={setSearch} setStatus={setStatus} />}
                    rows={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    paginator
                    removableSort
                >
                    <Column selectionMode="multiple" />
                    <Column header="Code" field="code" />
                    <Column header="Description" field="description" style={{ minWidth: "250px" }} />
                    <Column header="Type" sortable field="type" body={CustomTypeFieldDataTable} />
                    <Column header="Priority" field="priority" />
                    <Column
                        header="Assets"
                        field="assets"
                        body={(rowData) =>
                            rowData.assets.map((item, index) => (
                                <div key={index}>
                                    <p>{item}</p>
                                </div>
                            ))
                        }
                        style={{ minWidth: "200px" }}
                    />
                    <Column header="Worker" field="worker" />
                    <Column header="Status" field="status" />
                    <Column header="Origin Work Order" field="originWorkOrder" style={{ minWidth: "200px" }} />
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
                                            <Link href={`/maintenance/work-orders/add?city=${city}`}>{city}</Link>
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

export default WorkOrderPage;
