import React, { useState, useRef, useEffect } from 'react';

// Utility function: Converts polar coordinates to cartesian coordinates.
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

// Utility function: Generates an SVG arc path description given start and end angles.
interface CartesianCoordinates {
  x: number;
  y: number;
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start: CartesianCoordinates = polarToCartesian(x, y, radius, endAngle);
  const end: CartesianCoordinates = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag: string = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', x, y, // Move to center
    'L', start.x, start.y, // Line to start of arc
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y, // Arc command
    'Z' // Close path (draw line back to center)
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
  // State to track which slice is hovered.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // Timer ref to delay un-hovering (reducing twitchiness).
  const hoverTimerRef = useRef<number | null>(null);

  // Calculate total value.
  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  let cumulativeAngle = 0;
  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  // Default colors.
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

  // Hover offset for "popping" out a slice.
  const hoverOffset = 10;
  // Additional length for the leader line.
  const leaderLineLength = 20;

  // Extend the viewBox to account for the hover offset.
  const viewBoxX = -hoverOffset;
  const viewBoxY = -hoverOffset;
  const viewBoxWidth = width + 2 * hoverOffset;
  const viewBoxHeight = height + 2 * hoverOffset;

  // Handlers for hover with a slight delay on leave.
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

  // Build an array of slices with calculated properties.
  const slices = data.map((slice, index) => {
    // Calculate the angular span.
    const sliceAngle = (slice.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    // Path for the slice.
    const pathData = describeArc(centerX, centerY, radius, startAngle, endAngle);

    // Select color.
    const fillColor = colors
      ? colors[index % colors.length]
      : defaultColors[index % defaultColors.length];

    // Calculate mid-angle.
    const midAngle = startAngle + sliceAngle / 2;

    // Label for the percentage inside the slice.
    const labelRadius = radius * 0.6;
    const labelCoords = polarToCartesian(centerX, centerY, labelRadius, midAngle);
    const percentageText = ((slice.value / total) * 100).toFixed(0) + '%';

    // Leader line: starting from the edge of the pie.
    const lineStart = polarToCartesian(centerX, centerY, radius, midAngle);
    // Decide horizontal extension based on which side the slice is on.
    const isLeftSide = lineStart.x < centerX;
    const lineEnd = {
      x: lineStart.x + (isLeftSide ? -leaderLineLength : leaderLineLength),
      y: lineStart.y,
    };

    // Position the name text at the end of the leader line.
    const textOffset = 4;
    const textX = lineEnd.x + (isLeftSide ? -textOffset : textOffset);
    const textAnchor = isLeftSide ? 'end' : 'start';

    // If hovered, calculate an offset translation.
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
          // Apply translation if this slice is hovered.
          transform={`translate(${hoveredIndex === index ? slice.offset.x : 0}, ${
            hoveredIndex === index ? slice.offset.y : 0
          })`}
        >
          {/* The slice path */}
          <path
            d={slice.pathData}
            fill={slice.fillColor}
            stroke="#fff"
            strokeWidth="1"
          />
          {/* Percentage value inside the slice */}
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
          {/* Leader line from the pie edge */}
          <line
            x1={slice.lineStart.x}
            y1={slice.lineStart.y}
            x2={slice.lineEnd.x}
            y2={slice.lineEnd.y}
            stroke={slice.fillColor}
            strokeWidth="1"
          />
          {/* Slice name at the end of the leader line */}
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
