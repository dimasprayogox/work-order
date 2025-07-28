import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner'; // Import untuk loading indicator

// 1. Aktifkan impor CSS yang penting
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 2. Gunakan path absolut ke worker yang ada di folder `public`
// PENTING: Anda harus menyalin file `pdf.worker.min.js` dari `node_modules/pdfjs-dist/build/`
// ke dalam folder `public/` di proyek Anda.
pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/worker/pdf.worker.min.mjs`;


function PDFViewer({ pdfUrl, fileName }) {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0); // Skala default

    function onDocumentLoadSuccess({ numPages: nextNumPages }) {
        setNumPages(nextNumPages);
        setCurrentPage(1); // Kembali ke halaman 1 setiap kali dokumen baru dimuat
    }

    const handleFirstPage = () => setCurrentPage(1);
    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages));
    const handleLastPage = () => setCurrentPage(numPages);
    const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
    const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.4));

    const handleDownloadPDF = () => {
        if (!pdfUrl) return;
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `${fileName || 'document'}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const handlePrint = () => {
        if (pdfUrl) {
            const printWindow = window.open(pdfUrl);
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        }
    };

    const loadingIndicator = (
        <div className="flex flex-column align-items-center justify-content-center p-5">
            <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="8" />
            <p className="mt-3">Loading PDF...</p>
        </div>
    );

    const errorIndicator = (
        <div className="flex align-items-center justify-content-center p-5 text-red-500">
            <i className="pi pi-exclamation-triangle mr-2"></i>
            <p>Failed to load PDF file.</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {pdfUrl && (
                <>
                    {/* Toolbar */}
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        flexWrap: 'wrap',
                        borderBottom: '1px solid #ddd'
                    }}>
                        <Button icon="pi pi-angle-double-left" onClick={handleFirstPage} disabled={!numPages || currentPage === 1} tooltip="First Page" />
                        <Button icon="pi pi-angle-left" onClick={handlePrevPage} disabled={!numPages || currentPage === 1} tooltip="Previous Page" />
                        <span className="p-2 text-sm">Page {currentPage || '--'} of {numPages || '--'}</span>
                        <Button icon="pi pi-angle-right" onClick={handleNextPage} disabled={!numPages || currentPage === numPages} tooltip="Next Page" />
                        <Button icon="pi pi-angle-double-right" onClick={handleLastPage} disabled={!numPages || currentPage === numPages} tooltip="Last Page" />
                        <Button icon="pi pi-search-minus" onClick={handleZoomOut} disabled={!numPages || scale <= 0.4} tooltip="Zoom Out" />
                        <Button icon="pi pi-search-plus" onClick={handleZoomIn} disabled={!numPages || scale >= 3.0} tooltip="Zoom In" />
                        <Button icon="pi pi-download" onClick={handleDownloadPDF} disabled={!numPages} tooltip="Download" />
                        <Button icon="pi pi-print" onClick={handlePrint} disabled={!numPages} tooltip="Print" />
                    </div>

                    {/* PDF Container */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '20px',
                        backgroundColor: '#e9e9e9'
                    }}>
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={(error) => console.error('Gagal memuat PDF:', error.message)}
                            loading={loadingIndicator}
                            error={errorIndicator}
                        >
                            <Page
                                pageNumber={currentPage}
                                scale={scale}
                                renderAnnotationLayer={true}
                                renderTextLayer={true}
                            />
                        </Document>
                    </div>
                </>
            )}
        </div>
    );
}

export default PDFViewer;
