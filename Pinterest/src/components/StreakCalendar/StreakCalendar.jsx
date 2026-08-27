import React, { useMemo } from "react";

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function buildYearDates(end = new Date()) {
  const days = [];
  const endDate = new Date(end);
  endDate.setHours(12, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 364);
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

export default function StreakCalendar({ activityMap = {}, onClickDay }) {
  const days = useMemo(() => buildYearDates(), []);
  const CELL = 14; // consistent pixel size for each day square

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

  // compute month segments (label and number of weeks)
  const monthSegments = [];
  weeks.forEach((week, wi) => {
    const first = week[0]?.date;
    if (!first) return;
    const label = first.toLocaleString(undefined, { month: "short" });
    const lastSegment = monthSegments[monthSegments.length - 1];
    if (!lastSegment || lastSegment.label !== label) {
      monthSegments.push({ label, start: wi, count: 1 });
    } else {
      lastSegment.count += 1;
    }
  });

  return (
    <div className="flex flex-col gap-1">
      <div className="overflow-x-auto px-0"> 
        {/* Month labels and weeks are inside the same scroll container so they stay aligned */}
        <div className="inline-block min-w-max">
          <div className="flex items-center mb-0">
            {monthSegments.map((seg, i) => (
              <div
                key={i}
                style={{ width: `${seg.count * CELL}px` }}
                className="text-center text-xs text-slate-500"
              >
                {seg.label}
              </div>
            ))}
          </div>
          <div className="flex" role="grid" aria-label="Activity calendar">
            {weeks.map((week, wi) => (
              <div className="flex flex-col" key={wi} role="gridcell">
                {week.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    style={{ width: CELL, height: CELL }}
                    className={`rounded-sm ${
                      day.level === 0 ? "bg-blue-50 border border-blue-100" : day.level === 1 ? "bg-blue-200 border border-blue-200" : day.level === 2 ? "bg-blue-300 border border-blue-300" : day.level === 3 ? "bg-blue-600 border border-blue-600" : "bg-blue-800 border border-blue-800"
                    } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                    title={`${day.key}: ${day.count} activity`}
                    onClick={() => onClickDay && onClickDay(day)}
                    aria-label={`${day.key}: ${day.count} activity`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>Less</span>
        <div className="flex gap-0 items-center">
          <span style={{ width: CELL, height: CELL }} className="rounded-sm bg-blue-50 border border-blue-100" />
          <span style={{ width: CELL, height: CELL }} className="rounded-sm bg-blue-200 border border-blue-200" />
          <span style={{ width: CELL, height: CELL }} className="rounded-sm bg-blue-300 border border-blue-300" />
          <span style={{ width: CELL, height: CELL }} className="rounded-sm bg-blue-600 border border-blue-600" />
          <span style={{ width: CELL, height: CELL }} className="rounded-sm bg-blue-800 border border-blue-800" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
