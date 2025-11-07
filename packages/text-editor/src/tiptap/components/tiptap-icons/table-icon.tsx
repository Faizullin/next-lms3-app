import React from "react";

export const TableIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="10"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* 둥근 테두리 */}
    <rect
      x="5"
      y="5"
      width="90"
      height="90"
      rx="15"
      ry="15"
      stroke="currentColor"
      strokeWidth="10"
      fill="none"
    />

    {/* 세로 구분선 2개 */}
    <line
      x1="35"
      y1="5"
      x2="35"
      y2="95"
      stroke="currentColor"
      strokeWidth="10"
    />
    <line
      x1="65"
      y1="5"
      x2="65"
      y2="95"
      stroke="currentColor"
      strokeWidth="10"
    />

    {/* 가로 구분선 1개 */}
    <line
      x1="5"
      y1="50"
      x2="95"
      y2="50"
      stroke="currentColor"
      strokeWidth="10"
    />
  </svg>
);
