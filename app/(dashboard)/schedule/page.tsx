"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ScheduleCalendar, CalendarEventData } from "schedule-calendar";
import { message, Spin } from "antd";
import EventDrawer from "@/app/components/EventDrawer";
import EventCard from "@/app/components/EventCard";
import api from "@/app/lib/axios";
import { getContrastTextColor } from "@/app/utils/colorUtils";
import dayjs, { Dayjs } from "dayjs";

// 员工数据类型
type Employee = {
  id: string;
  name: string;
  role?: string;
  color?: string | null;
};

// 日程事件数据类型
type ScheduleEvent = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  employee_id: string;
  color: string | null;
};

const TIMEZONE_STORAGE_KEY = "visual-schedule.timezone";
const WEEK_STARTS_ON = 1; // 0 = Sunday, 1 = Monday
const HEATMAP_COLORS = ["#ffedd5", "#fdba74", "#fb923c", "#f97316", "#dc2626"];
const MAX_INTERVAL_LABELS = 3;

type CalendarView = "day" | "week" | "month";
const START_HOUR = 9;
const END_HOUR = 20;

/**
 * 将后端事件数据转换为日历组件所需的格式
 * @param event - 后端返回的事件数据
 * @returns 日历组件所需的事件数据格式
 */
const toDayCalendarEvent = (event: ScheduleEvent): CalendarEventData => ({
  id: event.id,
  title: event.title,
  start: dayjs(event.start_at).format("HH:mm"), // 转换为 9:00 格式
  end: dayjs(event.end_at).format("HH:mm"), // 转换为 20:00 格式
  employeeId: event.employee_id,
  color: event.color ?? undefined,
  description: event.description ?? undefined
});

const getHeatmapColor = (ratio: number) => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const index = Math.min(
    HEATMAP_COLORS.length - 1,
    Math.floor(clamped * HEATMAP_COLORS.length)
  );
  return HEATMAP_COLORS[index];
};

const formatIntervals = (intervals: Array<{ start: Dayjs; end: Dayjs }>) => {
  if (intervals.length === 0) return "";
  const visible = intervals.slice(0, MAX_INTERVAL_LABELS);
  const labels = visible.map(
    (interval) =>
      `${interval.start.format("HH:mm")}-${interval.end.format("HH:mm")}`
  );
  const remaining = intervals.length - visible.length;
  return remaining > 0
    ? `${labels.join(" · ")} +${remaining}`
    : labels.join(" · ");
};

const getRangeForView = (date: Date, view: CalendarView) => {
  const base = dayjs(date);
  if (view === "day") {
    return { start: base.startOf("day"), end: base.endOf("day") };
  }
  if (view === "month") {
    return { start: base.startOf("month"), end: base.endOf("month") };
  }

  const dayOfWeek = base.day();
  const diff = (dayOfWeek - WEEK_STARTS_ON + 7) % 7;
  const start = base.subtract(diff, "day").startOf("day");
  const end = start.add(6, "day").endOf("day");
  return { start, end };
};

/**
 * 日程管理页面组件
 * 显示日历视图，支持创建、编辑、删除和拖拽事件
 */
export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date()); // 当前显示的日期
  const [view, setView] = useState<CalendarView>("day");
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]); // 事件列表
  const [employees, setEmployees] = useState<Employee[]>([]); // 员工列表
  const [loading, setLoading] = useState(true); // 加载状态
  const [drawerOpen, setDrawerOpen] = useState(false); // 抽屉是否打开
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | null>(
    null
  ); // 正在编辑的事件
  const [initialValues, setInitialValues] = useState<{
    employeeId?: string;
    startTime?: string;
  }>({}); // 新建事件时的初始值
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);

  // 将员工列表转换为日历组件所需的格式
  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        name: employee.name
      })),
    [employees]
  );

  /**
   * 获取员工列表
   */
  const fetchEmployees = useCallback(async () => {
    const response = await api.get<{ employees: Employee[] }>("/employees");

    if (response.error) {
      message.error(response.error.message);
      return;
    }

    setEmployees(response.data?.employees ?? []);
  }, []);

  /**
   * 获取指定日期的事件列表
   * @param date - 要查询的日期
   */
  const fetchEvents = useCallback(
    async (date: Date, viewType: CalendarView) => {
      setLoading(true);
      const { start: rangeStart, end: rangeEnd } = getRangeForView(
        date,
        viewType
      );
      const start = rangeStart.toISOString();
      const end = rangeEnd.toISOString();
      const params = new URLSearchParams({ start, end });
      const response = await api.get<{ events: ScheduleEvent[] }>(
        `/schedule-events?${params.toString()}`
      );

      if (response.error) {
        message.error(response.error.message);
        setLoading(false);
        return;
      }

      const fetchedEvents = response.data?.events ?? [];
      setScheduleEvents(fetchedEvents);
      setLoading(false);
    },
    []
  );

  // 组件挂载时获取员工列表
  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当日期或视图变化时获取对应范围的事件
  useEffect(() => {
    fetchEvents(currentDate, view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view]);

  /**
   * 处理时间格点击事件
   * 点击日历上的空白时间格时创建新事件
   */
  const handleTimeLabelClick = (
    timeLabel: string,
    _index: number,
    timeSlot: string,
    employee: { id: string; name: string }
  ) => {
    let startTime: string;

    // 判断 timeSlot 是 ISO 格式还是简单时间格式
    if (timeSlot.includes("T") || timeSlot.includes("Z")) {
      startTime = timeSlot;
    } else {
      // 将时间标签（如 "09:00"）组合为完整的日期时间
      const today = new Date(currentDate);
      const [hours, minutes] = timeLabel.split(":").map(Number);
      today.setHours(hours, minutes || 0, 0, 0);
      startTime = today.toISOString();
    }

    // 清空编辑状态，进入新增模式
    setEditingEvent(null);
    // 设置初始值：点击的员工和时间
    setInitialValues({
      employeeId: employee.id,
      startTime: startTime
    });
    setDrawerOpen(true);
  };

  /**
   * 处理事件提交（创建或更新）
   * @param eventData - 事件数据
   * @returns 是否提交成功
   */
  const handleEventSubmit = async (
    eventData: Omit<CalendarEventData, "id">
  ): Promise<boolean> => {
    const payload = {
      title: eventData.title,
      description: eventData.description,
      start_at: eventData.start,
      end_at: eventData.end,
      employee_id: eventData.employeeId,
      color: eventData.color
    };

    if (editingEvent) {
      // 更新现有事件
      const response = await api.patch<{ event: ScheduleEvent }>(
        `/schedule-events/${editingEvent.id}`,
        payload
      );

      if (response.error) {
        message.error(response.error.message);
        return false;
      }

      if (response.data?.event) {
        const updated = response.data.event;
        setScheduleEvents((prev) =>
          prev.map((event) => (event.id === updated.id ? updated : event))
        );
      } else {
        await fetchEvents(currentDate, view);
      }

      setEditingEvent(null);
      return true;
    }

    // 创建新事件
    const response = await api.post<{ event: ScheduleEvent }>(
      "/schedule-events",
      payload
    );

    if (response.error) {
      message.error(response.error.message);
      return false;
    }

    await fetchEvents(currentDate, view);
    return true;
  };

  /**
   * 处理事件点击（编辑事件）
   * @param event - 被点击的事件
   */
  const handleEventClick = (event: CalendarEventData) => {
    setEditingEvent(event);
    setInitialValues({});
    setDrawerOpen(true);
  };

  /**
   * 处理事件删除
   * @param eventId - 要删除的事件ID
   */
  const handleEventDelete = async (eventId: string) => {
    const response = await api.delete<{ event: ScheduleEvent }>(
      `/schedule-events/${eventId}`
    );

    if (response.error) {
      message.error(response.error.message);
      return;
    }

    setScheduleEvents((prev) => prev.filter((event) => event.id !== eventId));
    setEditingEvent(null);
  };

  /**
   * 关闭抽屉
   */
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    // 关闭时清空编辑状态
    setTimeout(() => {
      setEditingEvent(null);
      setInitialValues({});
    }, 300); // 等待抽屉关闭动画
  };

  /**
   * 解析时间字符串（支持简单格式和 ISO 格式）
   * @param time - 时间字符串
   * @returns dayjs 对象
   */
  const parseTime = (time: string) => {
    if (time.match(/^\d{2}:\d{2}$/)) {
      const today = dayjs(currentDate).format("YYYY-MM-DD");
      return dayjs(`${today} ${time}`);
    }
    return dayjs(time);
  };

  /**
   * 处理事件拖拽（重新分配员工或时间）
   * @param event - 被拖拽的事件
   * @param next - 新的位置信息
   */
  const handleEventDrop = async (
    event: CalendarEventData,
    next: { employeeId: string; start: string }
  ) => {
    // 计算原始事件的持续时间（分钟）
    const originalStart = parseTime(event.start);
    const originalEnd = parseTime(event.end);
    const duration = originalEnd.diff(originalStart, "minute");

    // 解析新的开始时间并计算新的结束时间
    const newStart = parseTime(next.start);
    const newEnd = newStart.add(duration, "minute");

    const updatedStart = newStart.toISOString();
    const updatedEnd = newEnd.toISOString();

    // 立即更新 UI
    setScheduleEvents((prev) =>
      prev.map((item) =>
        item.id === event.id
          ? {
              ...item,
              employee_id: next.employeeId,
              start_at: updatedStart,
              end_at: updatedEnd
            }
          : item
      )
    );

    // 发送更新请求到后端
    const response = await api.patch<{
      event: ScheduleEvent;
      events?: ScheduleEvent[];
    }>(`/schedule-events/${event.id}`, {
      employee_id: next.employeeId,
      start_at: updatedStart,
      end_at: updatedEnd
    });

    if (response.error) {
      // 更新失败，重新获取事件列表
      message.error(response.error.message);
      fetchEvents(currentDate, view);
      return;
    }
  };

  const dayEvents = useMemo(
    () => scheduleEvents.map(toDayCalendarEvent),
    [scheduleEvents]
  );

  const aggregatedHeatmap = useMemo(() => {
    const aggregated = new Map<
      string,
      {
        minutes: number;
        count: number;
        earliest: Dayjs;
        latest: Dayjs;
        intervals: Array<{ start: Dayjs; end: Dayjs }>;
      }
    >();

    scheduleEvents.forEach((event) => {
      const start = dayjs(event.start_at);
      const end = dayjs(event.end_at);
      const minutes = Math.max(end.diff(start, "minute"), 0);
      const dateKey = start.format("YYYY-MM-DD");
      const current = aggregated.get(dateKey);
      if (current) {
        aggregated.set(dateKey, {
          minutes: current.minutes + minutes,
          count: current.count + 1,
          earliest: start.isBefore(current.earliest) ? start : current.earliest,
          latest: end.isAfter(current.latest) ? end : current.latest,
          intervals: [...current.intervals, { start, end }]
        });
      } else {
        aggregated.set(dateKey, {
          minutes,
          count: 1,
          earliest: start,
          latest: end,
          intervals: [{ start, end }]
        });
      }
    });

    const maxMinutes = Math.max(
      0,
      ...Array.from(aggregated.values()).map((item) => item.minutes)
    );

    return { aggregated, maxMinutes };
  }, [scheduleEvents]);

  const heatmapWeekEvents = useMemo(() => {
    const { aggregated, maxMinutes } = aggregatedHeatmap;
    return Array.from(aggregated.entries()).map(([dateKey, stats]) => {
      const sortedIntervals = [...stats.intervals].sort(
        (a, b) => a.start.valueOf() - b.start.valueOf()
      );
      const mergedIntervals: Array<{ start: Dayjs; end: Dayjs }> = [];

      sortedIntervals.forEach((interval) => {
        const last = mergedIntervals[mergedIntervals.length - 1];
        if (!last) {
          mergedIntervals.push(interval);
          return;
        }
        if (
          interval.start.isSame(last.end) ||
          interval.start.isBefore(last.end)
        ) {
          last.end = interval.end.isAfter(last.end) ? interval.end : last.end;
        } else {
          mergedIntervals.push(interval);
        }
      });

      const intervalLabel = formatIntervals(mergedIntervals);
      const ratio = maxMinutes ? stats.minutes / maxMinutes : 0;
      const hours = stats.minutes / 60;
      return {
        id: `heat-week-${dateKey}`,
        title: `${stats.count} events`,
        description: intervalLabel
          ? `${intervalLabel} · ${hours.toFixed(1)} h`
          : `${hours.toFixed(1)} h`,
        start: `${dateKey} ${stats.earliest.format("HH:mm")}`,
        end: `${dateKey} ${stats.latest.format("HH:mm")}`,
        employeeId: "all",
        color: getHeatmapColor(ratio)
      };
    });
  }, [aggregatedHeatmap]);

  const heatmapMonthEvents = useMemo(() => {
    const { aggregated, maxMinutes } = aggregatedHeatmap;
    return Array.from(aggregated.entries()).map(([dateKey, stats]) => {
      const ratio = maxMinutes ? stats.minutes / maxMinutes : 0;
      const hours = stats.minutes / 60;
      return {
        id: `heat-month-${dateKey}`,
        title: `${stats.count} events`,
        description: `${hours.toFixed(1)} h`,
        start: `${dateKey} 00:00`,
        end: `${dateKey} 23:59`,
        employeeId: "all",
        color: getHeatmapColor(ratio)
      };
    });
  }, [aggregatedHeatmap]);

  const renderHeatmapEvent = useCallback(
    ({ event }: { event: CalendarEventData }) => {
      const background = event.color ?? "#3b82f6";
      const textColor = getContrastTextColor(background, 0.6);

      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 6,
            background,
            color: textColor,
            padding: "6px 8px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600
          }}
        >
          <div>{event.title}</div>
          {event.description && (
            <div style={{ fontSize: 10, opacity: 0.85 }}>
              {event.description}
            </div>
          )}
        </div>
      );
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTimeZone = window.localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (storedTimeZone) {
      setTimeZone(storedTimeZone);
    }
    const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolvedTimeZone && !storedTimeZone) {
      setTimeZone(resolvedTimeZone);
    }
  }, []);

  return (
    <div className="h-full relative">
      {/* 日历视图组件 */}
      <ScheduleCalendar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        view={view}
        onViewChange={setView}
        showViewSwitcher
        weekStartsOn={WEEK_STARTS_ON}
        timeZone={timeZone}
        events={
          view === "day"
            ? dayEvents
            : view === "week"
              ? heatmapWeekEvents
              : heatmapMonthEvents
        }
        dayViewProps={{
          startHour: START_HOUR,
          endHour: END_HOUR,
          stepMinutes: 15,
          use24HourFormat: true,
          employees: employeeOptions,
          renderEvent: (params) => (
            <EventCard event={params.event} isDragging={params.isDragging} />
          ),
          eventClassName: "rounded-xl shadow-sm",
          onEventDrop: handleEventDrop,
          onEventClick: handleEventClick,
          onTimeLabelClick: handleTimeLabelClick
        }}
        weekViewProps={{
          startHour: START_HOUR,
          endHour: END_HOUR,
          stepMinutes: 30,
          cellHeight: 28,
          use24HourFormat: true,
          renderEvent: renderHeatmapEvent,
          eventStyle: {
            borderRadius: 6
          }
        }}
        monthViewProps={{
          maxEventsPerCell: 1,
          renderEvent: renderHeatmapEvent
        }}
      />

      {/* 加载中遮罩层 */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <Spin size="large" tip="Loading schedule..." />
        </div>
      )}

      {/* 事件编辑/创建抽屉 */}
      {view === "day" && (
        <EventDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          onSubmit={handleEventSubmit}
          onDelete={handleEventDelete}
          employees={employeeOptions}
          editingEvent={editingEvent}
          initialValues={initialValues}
        />
      )}
    </div>
  );
}
