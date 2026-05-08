import React, { useState, useRef } from 'react';
import { MdCheck } from 'react-icons/md';
import { FaFileCsv, FaFileImage } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import './VisualizationCard.css';

const VisualizationCard = ({
    title,
    titleVariant = 'default',
    data = [],
    csvFilename = 'export',
    csvHeaders = [],
    csvMapper = null,
    children
}) => {
    const [pngDownloaded, setPngDownloaded] = useState(false);
    const [csvDownloaded, setCsvDownloaded] = useState(false);
    const contentRef = useRef(null);
    const exportRef = useRef(null);

    // Convert data to CSV format
    const convertToCSV = () => {
        if (!data || data.length === 0) return '';

        const rows = [];

        // Add headers
        if (csvHeaders.length > 0) {
            rows.push(csvHeaders.join(','));
        }

        // Add data rows
        data.forEach(item => {
            let row;
            if (csvMapper && typeof csvMapper === 'function') {
                row = csvMapper(item);
            } else {
                // Default: use object values
                row = Object.values(item);
            }

            // Escape commas and quotes in values
            const escapedRow = row.map(value => {
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });

            rows.push(escapedRow.join(','));
        });

        return rows.join('\n');
    };

    // Download as CSV
    const handleDownloadCSV = () => {
        try {
            const csv = convertToCSV();
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `${csvFilename}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show checkmark
            setCsvDownloaded(true);
            setTimeout(() => setCsvDownloaded(false), 2000);
        } catch (error) {
            console.error('Error downloading CSV:', error);
        }
    };

    // Download as PNG
    const handleDownloadPNG = async () => {
        try {
            if (!exportRef.current) return;

            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true,
            });

            canvas.toBlob((blob) => {
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);

                link.setAttribute('href', url);
                link.setAttribute('download', `${csvFilename}.png`);
                link.style.visibility = 'hidden';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);

                // Show checkmark
                setPngDownloaded(true);
                setTimeout(() => setPngDownloaded(false), 2000);
            });
        } catch (error) {
            console.error('Error downloading PNG:', error);
        }
    };

    // Check if titleVariant is a hex color
    const isHexColor = titleVariant && titleVariant.startsWith('#');
    const titleStyle = isHexColor ? { backgroundColor: titleVariant } : {};
    const titleClass = titleVariant === 'blue' ? 'section-title-blue' : '';

    return (
        <div className="visualization-card" ref={contentRef}>
            <div className="visualization-export-area" ref={exportRef}>
                <div className="visualization-header">
                    <h2 
                        className={`section-title ${titleClass}`}
                        style={titleStyle}
                    >
                        {title}
                    </h2>
                </div>
                <div className="visualization-content">
                    {children}
                </div>
            </div>

            <div className="visualization-actions">
                <button
                    className="export-btn"
                    onClick={handleDownloadPNG}
                    title="Download as PNG"
                    disabled={pngDownloaded}
                >
                    {pngDownloaded ? (
                        <MdCheck className="icon-check" />
                    ) : (
                        <FaFileImage className="icon-default" />
                    )}
                </button>
                <button
                    className="export-btn"
                    onClick={handleDownloadCSV}
                    title="Download as CSV"
                    disabled={csvDownloaded}
                >
                    {csvDownloaded ? (
                        <MdCheck className="icon-check" />
                    ) : (
                        <FaFileCsv className="icon-default" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default VisualizationCard;
