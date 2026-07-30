'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Submission } from '@/lib/types';

interface Props {
  submissions: Submission[];
}

interface DayPoint {
  dateKey: string;
  label: string;
  daily: number;
  cumulative: number;
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 200;
const PADDING_LEFT = 32;
const PADDING_RIGHT = 12;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 24;

function dateKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function buildDayPoints(submissions: Submission[]): DayPoint[] {
  if (submissions.length === 0) return [];

  const countsByDay = new Map<string, number>();
  for (const submission of submissions) {
    const key = dateKeyOf(new Date(submission.submittedAt));
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const firstDate = new Date([...countsByDay.keys()].sort()[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  firstDate.setHours(0, 0, 0, 0);

  const points: DayPoint[] = [];
  let cumulative = 0;
  for (const cursor = new Date(firstDate); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const key = dateKeyOf(cursor);
    const daily = countsByDay.get(key) ?? 0;
    cumulative += daily;
    points.push({ dateKey: key, label: formatDayLabel(key), daily, cumulative });
  }
  return points;
}

export default function SubmissionsOverTimeChart({ submissions }: Props) {
  const points = useMemo(() => buildDayPoints(submissions), [submissions]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxCumulative = points.length > 0 ? points[points.length - 1].cumulative : 0;
  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const xForIndex = useCallback(
    (index: number) => (points.length <= 1 ? PADDING_LEFT + plotWidth / 2 : PADDING_LEFT + (index / (points.length - 1)) * plotWidth),
    [points.length, plotWidth]
  );

  const yForValue = useCallback(
    (value: number) => (maxCumulative === 0 ? PADDING_TOP + plotHeight : PADDING_TOP + plotHeight - (value / maxCumulative) * plotHeight),
    [maxCumulative, plotHeight]
  );

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForIndex(index)} ${yForValue(point.cumulative)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${xForIndex(points.length - 1)} ${PADDING_TOP + plotHeight} L ${xForIndex(0)} ${PADDING_TOP + plotHeight} Z`
      : '';

  const handlePointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (points.length === 0 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relativeX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
      const clamped = Math.min(Math.max(relativeX, PADDING_LEFT), PADDING_LEFT + plotWidth);
      const ratio = plotWidth > 0 ? (clamped - PADDING_LEFT) / plotWidth : 0;
      const index = Math.round(ratio * (points.length - 1));
      setHoverIndex(Math.min(Math.max(index, 0), points.length - 1));
    },
    [points.length, plotWidth]
  );

  const handlePointerLeave = useCallback(() => setHoverIndex(null), []);

  const gridSteps = 4;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, step) => Math.round((maxCumulative / gridSteps) * step));

  const tickIndices =
    points.length <= 1 ? points.map((_, index) => index) : Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));

  if (points.length === 0) return null;

  const lastPoint = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipX = hoverIndex !== null ? xForIndex(hoverIndex) : 0;
  const tooltipOnRight = tooltipX < CHART_WIDTH / 2;

  return (
    <div className="bg-white border border-black-02/8 rounded-2xl px-5 py-5 mb-6">
      <h2 className="text-sm font-bold text-black-02/70 mb-4">Cumulative submissions over time</h2>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto touch-none"
          role="img"
          aria-label={`Cumulative submissions over time, reaching ${maxCumulative} total by ${lastPoint.label}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {gridValues.map((value) => (
            <g key={value}>
              <line
                x1={PADDING_LEFT}
                x2={CHART_WIDTH - PADDING_RIGHT}
                y1={yForValue(value)}
                y2={yForValue(value)}
                className="stroke-black-02/8"
                strokeWidth={1}
              />
              <text x={PADDING_LEFT - 6} y={yForValue(value)} textAnchor="end" dominantBaseline="middle" className="fill-black-02/40" fontSize={9}>
                {value}
              </text>
            </g>
          ))}

          {tickIndices.map((index) => (
            <text
              key={index}
              x={xForIndex(index)}
              y={CHART_HEIGHT - 6}
              textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
              className="fill-black-02/40"
              fontSize={9}
            >
              {points[index].label}
            </text>
          ))}

          <path d={areaPath} className="fill-google-blue" fillOpacity={0.1} />
          <path d={linePath} className="stroke-google-blue" strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />

          <circle cx={xForIndex(points.length - 1)} cy={yForValue(lastPoint.cumulative)} r={4} className="fill-google-blue stroke-white" strokeWidth={2} />

          {hovered && (
            <>
              <line x1={tooltipX} x2={tooltipX} y1={PADDING_TOP} y2={PADDING_TOP + plotHeight} className="stroke-black-02/20" strokeWidth={1} />
              <circle cx={tooltipX} cy={yForValue(hovered.cumulative)} r={4} className="fill-google-blue stroke-white" strokeWidth={2} />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="absolute top-2 pointer-events-none bg-black-02 text-white rounded-lg px-3 py-2 text-xs shadow-lg whitespace-nowrap"
            style={{
              left: `${(tooltipX / CHART_WIDTH) * 100}%`,
              transform: tooltipOnRight ? 'translateX(8px)' : 'translateX(calc(-100% - 8px))',
            }}
          >
            <p className="text-white/50 mb-1">{hovered.label}</p>
            <p>
              <span className="font-bold">{hovered.cumulative}</span> total
            </p>
            <p className="text-white/70">+{hovered.daily} that day</p>
          </div>
        )}
      </div>

      <details className="mt-4">
        <summary className="text-xs font-medium text-black-02/45 cursor-pointer select-none">View as table</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-black-02/45 border-b border-black-02/8">
                <th className="py-1.5 pr-4 font-medium">Date</th>
                <th className="py-1.5 pr-4 font-medium">Submissions</th>
                <th className="py-1.5 font-medium">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.dateKey} className="border-b border-black-02/8">
                  <td className="py-1.5 pr-4 text-black-02/70">{point.label}</td>
                  <td className="py-1.5 pr-4 text-black-02/70">{point.daily}</td>
                  <td className="py-1.5 text-black-02/70">{point.cumulative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
