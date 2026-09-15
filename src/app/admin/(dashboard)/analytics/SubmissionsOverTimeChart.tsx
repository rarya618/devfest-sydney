'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { ACCENT_CHART_CLASSES, type AnalyticsAccent } from './shared';

interface DatedEntry {
  submittedAt: string; // ISO date string
}

interface Props {
  entries: DatedEntry[];
  // What one entry is called, lower case (e.g. "submissions", "signups", "entries").
  noun: string;
  accent: AnalyticsAccent;
}

interface DayPoint {
  dateKey: string;
  label: string;
  daily: number;
  cumulative: number;
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 200;
const CHART_HEIGHT_MOBILE = 300;
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

function buildDayPoints(entries: DatedEntry[]): DayPoint[] {
  if (entries.length === 0) return [];

  const countsByDay = new Map<string, number>();
  for (const entry of entries) {
    const key = dateKeyOf(new Date(entry.submittedAt));
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

export default function SubmissionsOverTimeChart({ entries, noun, accent }: Props) {
  const points = useMemo(() => buildDayPoints(entries), [entries]);
  const chartClasses = ACCENT_CHART_CLASSES[accent];
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    setIsMobile(query.matches);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const chartHeight = isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT;
  const labelFontSize = isMobile ? 13 : 9;
  const paddingLeft = isMobile ? 40 : PADDING_LEFT;
  const maxCumulative = points.length > 0 ? points[points.length - 1].cumulative : 0;
  const plotWidth = CHART_WIDTH - paddingLeft - PADDING_RIGHT;
  const plotHeight = chartHeight - PADDING_TOP - PADDING_BOTTOM;

  const xForIndex = useCallback(
    (index: number) => (points.length <= 1 ? paddingLeft + plotWidth / 2 : paddingLeft + (index / (points.length - 1)) * plotWidth),
    [points.length, plotWidth, paddingLeft]
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
      const clamped = Math.min(Math.max(relativeX, paddingLeft), paddingLeft + plotWidth);
      const ratio = plotWidth > 0 ? (clamped - paddingLeft) / plotWidth : 0;
      const index = Math.round(ratio * (points.length - 1));
      setHoverIndex(Math.min(Math.max(index, 0), points.length - 1));
    },
    [points.length, plotWidth, paddingLeft]
  );

  const handlePointerLeave = useCallback(() => setHoverIndex(null), []);

  const gridSteps = 4;
  // De-duplicated: with fewer entries than grid steps, rounding makes neighbouring steps collide.
  const gridValues = Array.from(new Set(Array.from({ length: gridSteps + 1 }, (_, step) => Math.round((maxCumulative / gridSteps) * step))));

  const tickIndices =
    points.length <= 1 ? points.map((_, index) => index) : Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));

  if (points.length === 0) return null;

  const lastPoint = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipX = hoverIndex !== null ? xForIndex(hoverIndex) : 0;
  const tooltipOnRight = tooltipX < CHART_WIDTH / 2;

  return (
    <div className="bg-surface border border-white/10 rounded-2xl px-5 py-5 mb-6">
      <h2 className="text-sm font-bold text-white/70 mb-4">Cumulative {noun} over time</h2>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${chartHeight}`}
          className="w-full h-auto touch-none"
          role="img"
          aria-label={`Cumulative ${noun} over time, reaching ${maxCumulative} total by ${lastPoint.label}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {gridValues.map((value) => (
            <g key={value}>
              <line
                x1={paddingLeft}
                x2={CHART_WIDTH - PADDING_RIGHT}
                y1={yForValue(value)}
                y2={yForValue(value)}
                className="stroke-white/10"
                strokeWidth={1}
              />
              <text x={paddingLeft - 6} y={yForValue(value)} textAnchor="end" dominantBaseline="middle" className="fill-white/55" fontSize={labelFontSize}>
                {value}
              </text>
            </g>
          ))}

          {tickIndices.map((index) => (
            <text
              key={index}
              x={xForIndex(index)}
              y={chartHeight - 6}
              textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
              className="fill-white/55"
              fontSize={labelFontSize}
            >
              {points[index].label}
            </text>
          ))}

          <path d={areaPath} className={chartClasses.fill} fillOpacity={0.1} />
          <path d={linePath} className={chartClasses.stroke} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />

          <circle cx={xForIndex(points.length - 1)} cy={yForValue(lastPoint.cumulative)} r={4} className={`${chartClasses.fill} stroke-[#010103]`} strokeWidth={2} />

          {hovered && (
            <>
              <line x1={tooltipX} x2={tooltipX} y1={PADDING_TOP} y2={PADDING_TOP + plotHeight} className="stroke-white/20" strokeWidth={1} />
              <circle cx={tooltipX} cy={yForValue(hovered.cumulative)} r={4} className={`${chartClasses.fill} stroke-[#010103]`} strokeWidth={2} />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="absolute top-2 pointer-events-none bg-[#3c4043] text-white rounded-lg px-3 py-2 text-xs shadow-lg whitespace-nowrap"
            style={{
              left: `${(tooltipX / CHART_WIDTH) * 100}%`,
              transform: tooltipOnRight ? 'translateX(8px)' : 'translateX(calc(-100% - 8px))',
            }}
          >
            <p className="text-white/70 mb-1">{hovered.label}</p>
            <p>
              <span className="font-bold">{hovered.cumulative}</span> total
            </p>
            <p className="text-white/70">+{hovered.daily} that day</p>
          </div>
        )}
      </div>

      <details className="mt-4">
        <summary className="text-xs font-medium text-white/50 cursor-pointer select-none">View as table</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-white/50 border-b border-white/10">
                <th className="py-1.5 pr-4 font-medium">Date</th>
                <th className="py-1.5 pr-4 font-medium capitalize">{noun}</th>
                <th className="py-1.5 font-medium">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.dateKey} className="border-b border-white/10">
                  <td className="py-1.5 pr-4 text-white/70">{point.label}</td>
                  <td className="py-1.5 pr-4 text-white/70">{point.daily}</td>
                  <td className="py-1.5 text-white/70">{point.cumulative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
