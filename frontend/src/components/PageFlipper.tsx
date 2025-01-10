import React from 'react';

interface PageFlipperProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const PageFlipper: React.FC<PageFlipperProps> = ({ currentPage, totalPages, onPageChange }) => {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                borderTop: '1px solid #ccc',
                padding: '0.5rem 0',
            }}
        >
            {/* Left Arrow */}
            <button
                onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
                disabled={currentPage === 0}
                style={{ fontSize: '1.1rem', padding: '0.25rem 0.5rem' }}
            >
                &larr; {/* or "←" */}
            </button>

            {/* Page Indicator, e.g. "1 / 4" */}
            <span style={{ fontSize: '1rem' }}>
                {currentPage + 1} / {totalPages}
            </span>

            {/* Right Arrow */}
            <button
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                style={{ fontSize: '1.1rem', padding: '0.25rem 0.5rem' }}
            >
                &rarr; {/* or "→" */}
            </button>
        </div>
    );
};

export default PageFlipper;
