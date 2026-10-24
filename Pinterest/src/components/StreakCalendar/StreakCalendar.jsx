import React, { useMemo, useRef, useEffect, useState } from "react";
import { toDateKey as formatDate } from "../../utils/dateUtils";

const CELL = 13;
const GAP = 3;
const MONTH_GAP = 14;
const LABEL_WIDTH = 30;
const DAYS_SHOWN = 365;
const ROLLING = "recent";
const SINCE_JOINED = "joined";

// color scale per design (level 0 is styled with classes so it adapts to dark mode)
const COLORS = ["", "#BFDBFE", "#60A5FA", "#2563EB", "#1E3A8A"];

function getLevel(count) {
  if (!count) return 0;
  if (count >= 5) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 1;
}

function atNoon(value) {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  return date;
}

function parseJoinDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : atNoon(date);
}

// Resolve the first/last day to show for the selected view. Days before the
// account was created are never shown.
function resolveRange(view, joinDate, today) {
  let start;
  let end = today;

  if (view === SINCE_JOINED) {
    start = joinDate || new Date(today);
  } else if (view === ROLLING) {
    start = new Date(today);
    start.setDate(today.getDate() - (DAYS_SHOWN - 1));
  } else {
    // a calendar year always shows Jan-Dec in full, including upcoming days
    const year = Number(view);
    return { start: atNoon(new Date(year, 0, 1)), end: atNoon(new Date(year, 11, 31)) };
  }

  if (joinDate && start < joinDate) start = joinDate;
  if (end < start) end = start;
  return { start, end };
}

// Split the range into month blocks; each block lays its days out in
// Sunday-start week columns so months are visually separated.
function buildMonths(activityMap, start, end, today) {
  const months = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const date = new Date(cursor);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    let month = months[months.length - 1];
    if (!month || month.key !== monthKey) {
      month = {
        key: monthKey,
        label: date.toLocaleString(undefined, { month: "short" }),
        firstWeekday: date.getDay(),
        days: []
      };
      months.push(month);
    }

    const key = formatDate(date);
    const count = activityMap[key] || 0;
    month.days.push({ date, key, count, level: getLevel(count), isFuture: date > today });
    cursor.setDate(cursor.getDate() + 1);
  }

  return months.map((month) => ({
    ...month,
    columns: Math.ceil((month.firstWeekday + month.days.length) / 7)
  }));
}

export default function StreakCalendar({ activityMap = {}, onClickDay, startDate }) {
  const today = useMemo(() => atNoon(new Date()), []);
  const joinDate = useMemo(() => {
    const parsed = parseJoinDate(startDate);
    return parsed && parsed <= today ? parsed : null;
  }, [startDate, today]);
  const currentYear = today.getFullYear();
  const [view, setView] = useState(String(currentYear));

  const options = useMemo(() => {
    const joinedYear = joinDate ? joinDate.getFullYear() : currentYear;
    const list = [];
    for (let year = currentYear; year >= joinedYear; year -= 1) {
      list.push({ value: String(year), label: year === currentYear ? `${year} (Current)` : String(year) });
    }

    // extra period options only appear once the account spans more than one year
    if (joinedYear < currentYear) {
      list.push({ value: ROLLING, label: "Last 12 months" });
      if ((today - joinDate) / 86400000 > DAYS_SHOWN) {
        list.push({
          value: SINCE_JOINED,
          label: `Since joining (${joinDate.toLocaleString(undefined, { month: "short", year: "numeric" })})`
        });
      }
    }
    return list;
  }, [joinDate, today, currentYear]);

  const activeView = options.some((option) => option.value === view) ? view : String(currentYear);
  const { start, end } = useMemo(() => resolveRange(activeView, joinDate, today), [activeView, joinDate, today]);
  const months = useMemo(() => buildMonths(activityMap, start, end, today), [activityMap, start, end, today]);
  const totalActivities = useMemo(
    () => months.reduce((sum, month) => sum + month.days.filter((day) => day.count > 0).length, 0),
    [months]
  );
  const todayKey = formatDate(today);
  const scrollRef = useRef(null);

  // bring today into view for the current period, start from January for past years
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const todayCell = node.querySelector('[data-today="true"]');
    if (!todayCell) {
      node.scrollLeft = 0;
      return;
    }
    const offset = todayCell.getBoundingClientRect().left - node.getBoundingClientRect().left;
    node.scrollLeft += offset - node.clientWidth / 2;
  }, [activeView, today]);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-sm font-medium text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white">{totalActivities}</span>{" "}
          active {totalActivities === 1 ? "day" : "days"}
        </p>

        <select
          value={activeView}
          onChange={(event) => setView(event.target.value)}
          aria-label="Choose calendar period"
          className="rounded-[8px] border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-400 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <div className="flex w-max items-start">
          <div
            className="no-stagger sticky left-0 z-10 mr-2 grid bg-white pr-1 text-[10px] font-medium text-slate-400 dark:bg-slate-900 dark:text-slate-500"
            style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, rowGap: GAP }}
            aria-hidden="true"
          >
            <span style={{ gridRow: 2 }} className="leading-[13px]">Mon</span>
            <span style={{ gridRow: 4 }} className="leading-[13px]">Wed</span>
            <span style={{ gridRow: 6 }} className="leading-[13px]">Fri</span>
          </div>

          <div role="table" aria-label="Activity calendar" className="flex items-start" style={{ columnGap: MONTH_GAP }}>
            {months.map((month) => (
              <div key={month.key} style={{ minWidth: LABEL_WIDTH }}>
                <div
                  className="no-stagger grid"
                  style={{
                    gridTemplateColumns: `repeat(${month.columns}, ${CELL}px)`,
                    gridTemplateRows: `repeat(7, ${CELL}px)`,
                    gap: GAP
                  }}
                >
                  {month.days.map((day, index) => {
                    const position = month.firstWeekday + index;
                    const isToday = day.key === todayKey;
                    const hasActivity = day.level > 0;

                    return (
                      <button
                        key={day.key}
                        type="button"
                        data-today={isToday ? "true" : undefined}
                        disabled={day.isFuture}
                        onClick={() => onClickDay && onClickDay(day)}
                        aria-label={`${day.key}: ${day.count} activity`}
                        title={
                          day.isFuture
                            ? day.date.toDateString()
                            : `${day.date.toDateString()} — ${day.count} ${day.count === 1 ? "activity" : "activities"}`
                        }
                        className={`rounded-[3px] transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          day.isFuture ? "cursor-default" : "hover:scale-125 hover:brightness-95"
                        } ${
                          hasActivity ? "" : day.isFuture ? "bg-slate-200/40 dark:bg-slate-700/25" : "bg-slate-200/80 dark:bg-slate-700/60"
                        } ${isToday ? "ring-2 ring-blue-500/80 ring-offset-1 ring-offset-white dark:ring-offset-slate-900" : ""}`}
                        style={{
                          gridColumn: Math.floor(position / 7) + 1,
                          gridRow: (position % 7) + 1,
                          backgroundColor: hasActivity ? COLORS[day.level] : undefined
                        }}
                      />
                    );
                  })}
                </div>

                <div className="mt-2 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400">{month.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-end gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold">Daily Activity</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {COLORS.map((color, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-[3px] ${color ? "" : "bg-slate-200/80 dark:bg-slate-700/60"}`}
              style={{ backgroundColor: color || undefined }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
