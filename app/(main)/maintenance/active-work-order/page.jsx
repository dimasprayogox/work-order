"use client";

import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Sidebar } from "primereact/sidebar";
import { Tree } from "primereact/tree";
import { useEffect, useState } from "react";

const ClosedWorkOrderPage = () => {
    const closeWorkOrder = {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [
            {
                label: "Low Risk Severity",
                data: [65, 59, 80, 81, 56, 55, 40],
                fill: true,
                tension: 0.4
            },
            {
                label: "High Risk Severity",
                data: [28, 48, 40, 19, 86, 27, 90],
                fill: true,
                tension: 0.4
            }
        ]
    };

    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);

    const createLazyNodes = () => {
        return [
            {
                key: "0",
                label: "Node 0",
                leaf: false
            },
            {
                key: "1",
                label: "Node 1",
                leaf: false
            },
            {
                key: "2",
                label: "Node 2",
                leaf: false
            }
        ];
    };

    const loadOnExpand = (event) => {
        if (!event.node.children) {
            setLoading(true);

            setTimeout(() => {
                let node = { ...event.node };

                node.children = [];

                for (let i = 0; i < 3; i++) {
                    node.children.push({
                        key: node.key + "-" + i,
                        label: "Lazy " + node.label + "-" + i
                    });
                }

                let value = [...nodes];

                value[parseInt(event.node.key, 10)] = node;
                setNodes(value);
                setLoading(false);
            }, 200);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            setNodes(createLazyNodes());
            setLoading(false);
        }, 2000);
    }, []);

    return (
        <div>
            <div className="card">
                <Chart
                    type="line"
                    data={closeWorkOrder}
                    options={{
                        maintainAspectRatio: false,
                        aspectRatio: 1
                    }}
                />
            </div>

            <Sidebar visible={visible} position="right" onHide={() => setVisible(false)}>
                <h2>Sidebar</h2>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                    consequat.
                </p>

                <Tree value={nodes} onExpand={loadOnExpand} />
            </Sidebar>
        </div>
    );
};

export default ClosedWorkOrderPage;
