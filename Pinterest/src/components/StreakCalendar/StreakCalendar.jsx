import React, { useMemo, useRef, useEffect } from "react";

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function buildYearDates(end = new Date()) {
  const days = [];
  const endDate = new Date(end);
  endDate.setHours(12, 0, 0, 0);
  const roughStart = new Date(endDate);
  roughStart.setDate(endDate.getDate() - 364);
  // align the grid to real calendar weeks (Sunday-start) so week columns
  // and month boundaries match an actual calendar instead of raw 7-day chunks
  const startDate = new Date(roughStart);
  startDate.setDate(roughStart.getDate() - roughStart.getDay());
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function getLevel(count) {
  if (!count) return 0;
  if (count >= 5) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 1;
}

// color scale per design (level-0 uses a visible neutral fill)
const COLORS = ["#E6EEF8", "#BFDBFE", "#60A5FA", "#2563EB", "#1E3A8A"];

export default function StreakCalendar({ activityMap = {}, onClickDay, compact = false }) {
  const days = useMemo(() => buildYearDates(), []);

  const items = days.map((d) => {
    const key = formatDate(d);
    const count = activityMap[key] || 0;
    return { date: new Date(d), key, count, level: getLevel(count) };
  });

  // group by week (Sunday-start) so columns are weeks
  const weeks = [];
  items.forEach((item) => {
    const weekIndex = Math.floor((item.date - items[0].date) / (7 * 24 * 60 * 60 * 1000));
    weeks[weekIndex] = weeks[weekIndex] || [];
    weeks[weekIndex].push(item);
  });
  // compact the array to remove any sparse holes that can cause off-by-one rendering
  const denseWeeks = weeks.filter(Boolean);

  // compute month labels: render at the first week-column whose month differs
  // from the previous column's month. Skip if fewer than 3 columns remain.
  const monthLabels = [];
  for (let wi = 0; wi < denseWeeks.length; wi++) {
    const week = denseWeeks[wi];
    const firstDate = week[0]?.date;
    if (!firstDate) continue;
    const month = firstDate.getMonth();
    const prevWeek = denseWeeks[wi - 1];
    const prevMonth = prevWeek && prevWeek[0] ? prevWeek[0].date.getMonth() : null;
    const remaining = denseWeeks.length - wi;
    // Avoid crowded labels: require a small column gap between labels and skip very-early columns
    const minGapBetweenLabels = 2;
    const lastLabelIndex = monthLabels.length ? monthLabels[monthLabels.length - 1].index : -999;
    const enoughGap = (wi - lastLabelIndex) >= minGapBetweenLabels;
    const notTooEarly = wi >= 1;
    // Only show a label when month changes, at least 3 columns remain, and spacing rules pass
    if (month !== prevMonth && remaining >= 3 && enoughGap && notTooEarly) {
      monthLabels.push({ label: firstDate.toLocaleString(undefined, { month: 'short' }), col: wi + 2, index: wi });
    }
  }

  const todayKey = formatDate(new Date());
  const CELL = compact ? 10 : 14;
  const GAP = compact ? 4 : 6;
  const LEFT = compact ? 56 : 72; // left column width for weekday labels
  const weeksCount = denseWeeks.length;
  const scrollRef = useRef(null);

  // keep the most recent activity (today) in view instead of letting the card clip it
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [weeksCount]);

  // build explicit grid template for precise month label alignment
  const gridTemplateColumns = `${LEFT}px ${Array(weeksCount).fill(`${CELL}px`).join(' ')}`;
  const gridTemplateRows = `auto repeat(7, ${CELL}px)`;

  return (
    <div className="overflow-hidden" style={{ width: '100%' }}>
      <div ref={scrollRef} style={{ overflowX: 'auto', width: '100%', paddingBottom: 2 }}>
      <div
        role="table"
        aria-label="Activity calendar"
        style={{
          display: 'grid',
          gridTemplateColumns,
          gridTemplateRows,
          columnGap: `${GAP}px`,
          rowGap: `${GAP}px`,
          alignItems: 'center'
        }}
      >
        {/* Month labels row (grid row 1) - placed over exact week columns */}
        {monthLabels.map((m, i) => (
          <div key={i} style={{ gridColumn: `${m.col}`, gridRow: 1, textAlign: 'left', paddingLeft: 2, whiteSpace: 'nowrap' }} className="text-xs text-slate-500">
            {m.label}
          </div>
        ))}

        {/* Weekday labels in first column (rows 2..8) */}
        <div style={{ gridColumn: 1, gridRow: 2 }} />
        <div style={{ gridColumn: 1, gridRow: 3 }} className="text-xs text-slate-500 text-right">Mon</div>
        <div style={{ gridColumn: 1, gridRow: 4 }} />
        <div style={{ gridColumn: 1, gridRow: 5 }} className="text-xs text-slate-500 text-right">Wed</div>
        <div style={{ gridColumn: 1, gridRow: 6 }} />
        <div style={{ gridColumn: 1, gridRow: 7 }} className="text-xs text-slate-500 text-right">Fri</div>
        <div style={{ gridColumn: 1, gridRow: 8 }} />

        {/* Day cells placed by their week (column) and weekday (row) */}
        {denseWeeks.map((week, wi) =>
          (week || []).map((day) => {
            if (!day || !day.date) return null;
            const weekday = day.date.getDay(); // 0 = Sun .. 6 = Sat
            // ensure column index is within grid bounds
            if (wi < 0 || wi >= weeksCount) return null;
            const col = wi + 2; // first column is weekday labels
            const row = weekday + 2; // row 2 = Sunday
            const isToday = day.key === todayKey;
            const color = COLORS[day.level] || COLORS[0];
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onClickDay && onClickDay(day)}
                aria-label={`${day.key}: ${day.count} activity`}
                title={`${new Date(day.key).toDateString()} — ${day.count} quiz${day.count === 1 ? '' : 'zes'}`}
                className="transition-shadow duration-150 focus:outline-none"
                style={{
                  gridColumn: col,
                  gridRow: row,
                  width: CELL,
                  height: CELL,
                  background: color,
                  borderRadius: 4,
                  boxShadow: isToday ? '0 0 6px rgba(59,130,246,0.18)' : undefined,
                  border: isToday ? `1.5px solid rgba(59,130,246,0.9)` : '1px solid rgba(0,0,0,0.04)'
                }}
              />
            );
          })
        )}

        {/* Legend spans full width at bottom of grid */}
        <div style={{ gridColumn: `1 / span ${weeksCount + 1}`, gridRow: 9 }}>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="text-xs font-semibold text-slate-500">Daily Activity</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Less</span>
              <div className="flex gap-1 items-center">
                {COLORS.map((c, i) => (
                  <div key={i} style={{ background: c }} className="w-4 h-4 rounded-md border" />
                ))}
              </div>
              <span className="text-sm text-slate-500">More</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
