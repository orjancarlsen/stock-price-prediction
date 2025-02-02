import React, { useState, useRef, useEffect } from 'react';

// Utility: Converts polar coordinates to cartesian coordinates.
function polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
): { x: number; y: number } {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

// New utility: Generates an SVG donut slice (arc with a hole) path.
function describeDonutArc(
    x: number,
    y: number,
    outerRadius: number,
    innerRadius: number,
    startAngle: number,
    endAngle: number
): string {
    // Compute points along the outer circle.
    const outerStart = polarToCartesian(x, y, outerRadius, startAngle);
    const outerEnd = polarToCartesian(x, y, outerRadius, endAngle);
    // Compute points along the inner circle.
    const innerStart = polarToCartesian(x, y, innerRadius, startAngle);
    const innerEnd = polarToCartesian(x, y, innerRadius, endAngle);

    // Determine if the arc is greater than 180 degrees.
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        // Move to the starting point on the outer circle.
        'M', outerStart.x, outerStart.y,
        // Draw the outer arc.
        'A', outerRadius, outerRadius, 0, largeArcFlag, 1, outerEnd.x, outerEnd.y,
        // Draw a line to the corresponding point on the inner circle.
        'L', innerEnd.x, innerEnd.y,
        // Draw the inner arc (sweeping in the opposite direction).
        'A', innerRadius, innerRadius, 0, largeArcFlag, 0, innerStart.x, innerStart.y,
        'Z' // Close the path.
    ].join(' ');
}

// PieChart Component Props
interface PieChartData {
    name: string;
    value: number;
}

interface PieChartProps {
    data: PieChartData[];
    width?: number;
    height?: number;
    colors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({
    data,
    width = 300,
    height = 300,
    colors,
    }) => {
    // Track hovered slice index.
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const hoverTimerRef = useRef<number | null>(null);

    // Calculate the total and radii.
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    let cumulativeAngle = 0;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.5; // Adjust this factor to change donut thickness.
    const centerX = width / 2;
    const centerY = height / 2;

    // Default color palette.
    const defaultColors = [
        'lightgrey',
        '#36A2EB',
        '#FFCE56',
        '#66BB6A',
        '#BA68C8',
        '#FF7043',
        '#26A69A',
        '#8D6E63',
    ];

    const hoverOffset = 10;
    const leaderLineLength = 20;

    // Extend the viewBox to allow for hover offsets.
    const viewBoxX = -hoverOffset;
    const viewBoxY = -hoverOffset;
    const viewBoxWidth = width + 2 * hoverOffset;
    const viewBoxHeight = height + 2 * hoverOffset;

    // Handlers for hover events.
    const handleMouseEnter = (index: number) => {
        if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setHoveredIndex(index);
    };

    const handleMouseLeave = () => {
        hoverTimerRef.current = window.setTimeout(() => {
            setHoveredIndex(null);
            hoverTimerRef.current = null;
        }, 100);
    };

    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) {
                window.clearTimeout(hoverTimerRef.current);
            }
        };
    }, []);

    // Build slices with calculated properties.
    const slices = data.map((slice, index) => {
        const sliceAngle = (slice.value / total) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + sliceAngle;
        cumulativeAngle += sliceAngle;

        // Create the donut slice path.
        const pathData = describeDonutArc(
            centerX,
            centerY,
            radius,
            innerRadius,
            startAngle,
            endAngle
        );

        // Choose the fill color.
        const fillColor = colors
            ? colors[index % colors.length]
            : defaultColors[index % defaultColors.length];

        const midAngle = startAngle + sliceAngle / 2;

        // Place the label in the middle of the donut ring.
        const labelRadius = (radius + innerRadius) / 2;
        const labelCoords = polarToCartesian(centerX, centerY, labelRadius, midAngle);
        const percentageText = ((slice.value / total) * 100).toFixed(0) + '%';

        // Leader line from the outer edge.
        const lineStart = polarToCartesian(centerX, centerY, radius, midAngle);
        const isLeftSide = lineStart.x < centerX;
        const lineEnd = {
            x: lineStart.x + (isLeftSide ? -leaderLineLength : leaderLineLength),
            y: lineStart.y,
        };

        // Position for slice name.
        const textOffset = 4;
        const textX = lineEnd.x + (isLeftSide ? -textOffset : textOffset);
        const textAnchor = isLeftSide ? 'end' : 'start';

        // Compute a slight translation for hover effect.
        const offset =
            hoveredIndex === index
                ? polarToCartesian(0, 0, hoverOffset, midAngle)
                : { x: 0, y: 0 };

        return {
            key: index,
            pathData,
            fillColor,
            midAngle,
            labelCoords,
            percentageText,
            lineStart,
            lineEnd,
            textX,
            textAnchor,
            name: slice.name,
            offset,
        };
    });

    return (
        <svg
            width={width}
            height={height}
            viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
            style={{ overflow: 'visible' }}
        >
            {slices.map((slice, index) => (
                <g
                    key={slice.key}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: 'pointer' }}
                    transform={`translate(${hoveredIndex === index ? slice.offset.x : 0}, ${
                        hoveredIndex === index ? slice.offset.y : 0
                    })`}
                >
                    {/* Donut slice */}
                    <path
                        d={slice.pathData}
                        fill={slice.fillColor}
                        stroke="#fff"
                        strokeWidth="1"
                    />
                    {/* Percentage label */}
                    <text
                        x={slice.labelCoords.x}
                        y={slice.labelCoords.y}
                        fill="#fff"
                        fontSize="14"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        style={{ pointerEvents: 'none' }}
                    >
                        {slice.percentageText}
                    </text>
                    {/* Leader line */}
                    <line
                        x1={slice.lineStart.x}
                        y1={slice.lineStart.y}
                        x2={slice.lineEnd.x}
                        y2={slice.lineEnd.y}
                        stroke={slice.fillColor}
                        strokeWidth="1"
                    />
                    {/* Slice name */}
                    <text
                        x={slice.textX}
                        y={slice.lineEnd.y}
                        fill="#000"
                        fontSize="14"
                        textAnchor={slice.textAnchor}
                        alignmentBaseline="middle"
                        style={{ pointerEvents: 'none' }}
                    >
                        {slice.name}
                    </text>
                </g>
            ))}
        </svg>
    );
};

export default PieChart;
