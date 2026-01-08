"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DayView, CalendarEventData } from "schedule-calendar";
import { message, Spin } from "antd";
import EventDrawer from "@/app/components/EventDrawer";
import EventCard from "@/app/components/EventCard";
import api from "@/app/lib/axios";
import dayjs from "dayjs";

type Employee = {
  id: string;
  name: string;
  role?: string;
  color?: string | null;
};

type ScheduleEvent = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  employee_id: string;
  color: string | null;
};

const toCalendarEvent = (event: ScheduleEvent): CalendarEventData => ({
  id: event.id,
  title: event.title,
  start: dayjs(event.start_at).format("HH:mm"), // to 9:00
  end: dayjs(event.end_at).format("HH:mm"), // to 20:00
  employeeId: event.employee_id,
  color: event.color ?? undefined,
  description: event.description ?? undefined,
});

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | null>(
    null
  );
  const [initialValues, setInitialValues] = useState<{
    employeeId?: string;
    startTime?: string;
  }>({});

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
      })),
    [employees]
  );

  const fetchEmployees = useCallback(async () => {
    const response = await api.get<{ employees: Employee[] }>("/employees");

    if (response.error) {
      message.error(response.error.message);
      return;
    }

    setEmployees(response.data?.employees ?? []);
  }, []);

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true);
    const start = dayjs(date).startOf("day").toISOString();
    const end = dayjs(date).endOf("day").toISOString();
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
    setEvents(fetchedEvents.map(toCalendarEvent));
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents(currentDate);
  }, [currentDate, fetchEvents]);

  const handleTimeLabelClick = (
    timeLabel: string,
    _index: number,
    timeSlot: string,
    employee: { id: string; name: string }
  ) => {
    // 构建完整的日期时间
    // timeSlot 可能是 ISO 字符串或只是时间标签
    let startTime: string;

    if (timeSlot.includes("T") || timeSlot.includes("Z")) {
      // 已经是 ISO 格式
      startTime = timeSlot;
    } else {
      // 只是时间标签（如 "09:00"），需要组合今天的日期
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
      startTime: startTime,
    });
    setDrawerOpen(true);
  };

  const handleEventSubmit = async (
    eventData: Omit<CalendarEventData, "id">
  ): Promise<boolean> => {
    const payload = {
      title: eventData.title,
      description: eventData.description,
      start_at: eventData.start,
      end_at: eventData.end,
      employee_id: eventData.employeeId,
      color: eventData.color,
    };

    if (editingEvent) {
      const response = await api.patch<{ event: ScheduleEvent }>(
        `/schedule-events/${editingEvent.id}`,
        payload
      );

      if (response.error) {
        message.error(response.error.message);
        return false;
      }

      if (response.data?.event) {
        const updated = toCalendarEvent(response.data.event);
        setEvents((prev) =>
          prev.map((event) => (event.id === updated.id ? updated : event))
        );
      } else {
        await fetchEvents(currentDate);
      }

      setEditingEvent(null);
      return true;
    }

    const response = await api.post<{ event: ScheduleEvent }>(
      "/schedule-events",
      payload
    );

    if (response.error) {
      message.error(response.error.message);
      return false;
    }

    await fetchEvents(currentDate);
    return true;
  };

  const handleEventClick = (event: CalendarEventData) => {
    // 设置编辑事件并打开抽屉
    setEditingEvent(event);
    setInitialValues({}); // 清空初始值，使用 editingEvent
    setDrawerOpen(true);
  };

  const handleEventDelete = async (eventId: string) => {
    const response = await api.delete<{ event: ScheduleEvent }>(
      `/schedule-events/${eventId}`
    );

    if (response.error) {
      message.error(response.error.message);
      return;
    }

    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    setEditingEvent(null);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    // 关闭时清空编辑状态
    setTimeout(() => {
      setEditingEvent(null);
      setInitialValues({});
    }, 300); // 等待抽屉关闭动画
  };

  // 辅助函数：解析时间（支持简单格式和 ISO 格式）
  const parseTime = (time: string) => {
    if (time.match(/^\d{2}:\d{2}$/)) {
      const today = dayjs(currentDate).format("YYYY-MM-DD");
      return dayjs(`${today} ${time}`);
    }
    return dayjs(time);
  };

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

    const updatedEvent: CalendarEventData = {
      ...event,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    };

    // 更新事件列表
    setEvents((prev) => {
      const updatedEvents = prev.map((item) =>
        item.id === event.id
          ? {
              ...item,
              employeeId: next.employeeId,
              start: newStart.format("HH:mm"),
              end: newEnd.format("HH:mm"),
            }
          : item
      );
      return updatedEvents;
    });

    const response = await api.patch<{
      event: ScheduleEvent;
      events?: ScheduleEvent[];
    }>(`/schedule-events/${event.id}`, {
      employee_id: next.employeeId,
      start_at: updatedEvent.start,
      end_at: updatedEvent.end,
    });

    if (response.error) {
      // 更新失败，重新获取事件列表
      message.error(response.error.message);
      fetchEvents(currentDate);
      return;
    }
  };

  return (
    <div className="h-full relative">
      <DayView
        startHour={9}
        endHour={20}
        stepMinutes={15}
        use24HourFormat
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        employees={employeeOptions}
        events={events}
        renderEvent={(params) => {
          return (
            <EventCard event={params.event} isDragging={params.isDragging} />
          );
        }}
        eventClassName="rounded-xl shadow-sm"
        onEventDrop={handleEventDrop}
        onEventClick={handleEventClick}
        onTimeLabelClick={handleTimeLabelClick}
      />

      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <Spin size="large" tip="Loading schedule..." />
        </div>
      )}

      <EventDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSubmit={handleEventSubmit}
        onDelete={handleEventDelete}
        employees={employeeOptions}
        editingEvent={editingEvent}
        initialValues={initialValues}
      />
    </div>
  );
}
