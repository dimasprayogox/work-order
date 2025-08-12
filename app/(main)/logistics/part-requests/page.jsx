"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import PartRequestTable from "./components/PartRequestTable";
import UpdateStatusDialog from "./components/UpdateStatusDialog";
import { Dialog } from "primereact/dialog";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const AdjustPrintMarginLaporan = dynamic(() => import("../../Export/adjustPrintMarginLaporan"), { ssr: false });
const PDFViewer = dynamic(() => import("../../Export/PDFViewer"), { ssr: false });

const PartRequestPage = () => {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const toast = useRef(null);

    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setJsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileName, setFileName] = useState("PartRequestReport");
    const [printConfig, setPrintConfig] = useState({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    });

    const columnOptions = [
        { header: "No", key: "no", visible: true },
        { header: "Teknisi", key: "technician", visible: true },
        { header: "Catatan", key: "notes", visible: true },
        { header: "Items", key: "items", visible: true },
        { header: "Status", key: "status", visible: true }
    ];

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/logistics/part-requests");
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Gagal mengambil data request");
            }
            const result = await res.json();
            setRequests(result.data || []);
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleUpdateStatus = (req) => {
        setSelectedRequest(req);
        setDialogOpen(true);
    };

    const handleRefresh = () => {
        fetchRequests();
        setSearchText("");
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const exportExcel = async () => {
        if (!requests.length) {
            showToast("warn", "No Data", "Tidak ada data permintaan parts untuk diekspor");
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Permintaan Parts");

            // Add headers
            const headers = columnOptions.filter((col) => col.visible).map((col) => col.header);
            worksheet.addRow(headers);

            // Add data with numbering
            requests.forEach((request, index) => {
                const itemsText = request.items.map((item) => `${item.part?.name} (${item.quantity_requested})` + (item.quantity_approved != null ? ` → Disetujui: ${item.quantity_approved}` : "")).join("\n");

                const rowData = [
                    index + 1, // Numbering
                    request.requestedBy?.full_name || "-",
                    request.note || "-",
                    itemsText,
                    request.status === "false" ? "Completed" : request.status
                ];

                worksheet.addRow(rowData);
            });

            // Style headers
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE0E0E0" }
                };
                cell.alignment = { vertical: "middle", horizontal: "center" };
            });

            worksheet.columns.forEach((column, index) => {
                const header = headers[index];
                // Set column width based on header length
                column.width = Math.max(header.length * 1.5, 10);
                // Set number format for numeric columns
                if (index === 0 || index === 4 || index === 5) {
                    column.numFmt = "0";
                }
            });

            // Generate Excel file
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Laporan_Permintaan_Parts_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast("success", "Success", "Data berhasil diekspor ke Excel");
        } catch (error) {
            showToast("error", "Error", `Gagal mengekspor: ${error.message}`);
        }
    };

    // --- Export to PDF ---
    const exportPdf = (config = null) => {
        const currentConfig = config || printConfig;

        if (requests.length === 0) {
            showToast("warn", "No Data", "Tidak ada data permintaan parts untuk dicetak");
            return;
        }

        const doc = new jsPDF({
            orientation: currentConfig.orientation,
            unit: currentConfig.unit,
            format: currentConfig.format
        });

        const headers = columnOptions.filter((col) => col.visible).map((col) => col.header);

        const data = requests.map((request, index) => {
            const itemsText = request.items.map((item) => `${item.part?.name} (${item.quantity_requested})` + (item.quantity_approved != null ? ` → Disetujui: ${item.quantity_approved}` : "")).join("\n");

            return [(index + 1).toString(), request.requestedBy?.full_name || "-", request.note || "-", itemsText, request.status === "false" ? "Completed" : request.status];
        });

        doc.text("Request Parts Report", currentConfig.marginLeft, currentConfig.marginTop);

        autoTable(doc, {
            startY: currentConfig.marginTop + 10,
            head: [headers],
            body: data,
            margin: {
                left: currentConfig.marginLeft,
                right: currentConfig.marginRight,
                top: currentConfig.marginTop + 10,
                bottom: currentConfig.marginBottom
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setJsPdfPreviewOpen(true);
    };

    // --- Print Handler ---
    const handlePrint = () => {
        exportPdf();
    };

    // --- Adjust Print Margins ---
    const handleAdjust = (newConfig) => {
        setPrintConfig(newConfig);
        exportPdf(newConfig);
    };

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

            <div className="card">
                <h3 className="mb-4">Manajemen Parts Request</h3>
                <div className="flex flex-row gap-2 mb-4 justify-content-between">
                    <Button label="Back" icon="pi pi-arrow-left" outlined onClick={() => router.push("/dashboard")} />
                    <Button label="New" icon="pi pi-plus" outlined severity="success" disabled />
                    <Divider layout="vertical" />
                    <Button label="Import" icon="pi pi-file-import" outlined disabled />
                    <Button label="Export" icon="pi pi-file-export" outlined onClick={exportExcel} />
                    <Button label="Print" icon="pi pi-print" outlined onClick={() => setAdjustDialog(true)} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Delete" icon="pi pi-trash" outlined severity="danger" disabled />
                    <Divider layout="vertical" />
                    <Button label="Refresh" icon="pi pi-refresh" outlined onClick={handleRefresh} />
                </div>

                <PartRequestTable requests={requests} loading={loading} onUpdateStatus={handleUpdateStatus} searchText={searchText} onSearch={handleSearch} />

                <UpdateStatusDialog
                    visible={isDialogOpen}
                    onHide={() => setDialogOpen(false)}
                    request={selectedRequest}
                    fetchRequests={fetchRequests}
                    showToast={(type, title, msg) => toast.current.show({ severity: type, summary: title, detail: msg })}
                />

                <AdjustPrintMarginLaporan
                    key={adjustDialog ? "open" : "closed"}
                    adjustDialog={adjustDialog}
                    setAdjustDialog={setAdjustDialog}
                    handleAdjust={handleAdjust}
                    printConfig={printConfig}
                    setPrintConfig={setPrintConfig}
                    excel={exportExcel}
                />

                {/* PDF Preview Dialog */}
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setJsPdfPreviewOpen(false)} modal style={{ width: "90vw", height: "90vh" }} header="PDF Preview">
                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                </Dialog>
            </div>
        </div>
    );
};

export default PartRequestPage;
