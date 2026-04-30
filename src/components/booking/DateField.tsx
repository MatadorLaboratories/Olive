"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function todayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

export function DateField({
  id,
  name,
  label,
  hint,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  defaultValue: string;
}) {
  const initialValue = defaultValue || "";
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    initialValue ? parseISO(initialValue) : new Date(),
  );
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setValue(initialValue);
    setVisibleMonth(initialValue ? parseISO(initialValue) : new Date());
  }, [initialValue]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [visibleMonth]);

  const selectedDate = value ? parseISO(value) : null;
  const displayValue = selectedDate ? format(selectedDate, "EEEE d MMMM yyyy") : "Choose a date";

  const choose = (date: Date) => {
    setValue(format(date, "yyyy-MM-dd"));
    setVisibleMonth(date);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("date-card", open && "date-card-open")}>
      <div className="date-card-label">
        <div className="date-card-copy">
          <label htmlFor={`${id}-trigger`} className="field-label">{label}</label>
          <p className="date-card-hint">{hint}</p>
        </div>
        <span className="date-card-icon" aria-hidden="true">
          <CalendarDays className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </span>
      </div>

      <input type="hidden" id={id} name={name} value={value} />

      <button
        id={`${id}-trigger`}
        type="button"
        className={cn("date-trigger", !value && "date-trigger-placeholder")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-calendar`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="date-trigger-value">{displayValue}</span>
        <CalendarDays className="h-[17px] w-[17px] text-olive-600" strokeWidth={1.6} />
      </button>

      {open && (
        <div id={`${id}-calendar`} className="date-popover" role="dialog" aria-label={`${label} calendar`}>
          <div className="date-popover-header">
            <button
              type="button"
              className="date-popover-nav"
              aria-label="Previous month"
              onClick={() => setVisibleMonth((current) => subMonths(current, 1))}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.6} />
            </button>
            <div className="date-popover-title">
              <span className="eyebrow text-clay-500">Select</span>
              <strong>{format(visibleMonth, "MMMM yyyy")}</strong>
            </div>
            <button
              type="button"
              className="date-popover-nav"
              aria-label="Next month"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </div>

          <div className="date-popover-weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((day, index) => (
              <span key={`${id}-${index}-${day}`}>{day}</span>
            ))}
          </div>

          <div className="date-popover-grid">
            {calendarDays.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = isSameMonth(day, visibleMonth);

              return (
                <button
                  key={`${id}-${day.toISOString()}`}
                  type="button"
                  className={cn(
                    "date-popover-day",
                    !isCurrentMonth && "date-popover-day-outside",
                    isSelected && "date-popover-day-selected",
                  )}
                  aria-pressed={isSelected}
                  onClick={() => choose(day)}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="date-popover-actions">
            <button type="button" className="date-popover-link" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="date-popover-link text-clay-600"
              onClick={() => choose(parseISO(todayIso()))}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
