"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DayView, CalendarEventData } from "schedule-calendar";
import { message, Spin } from "antd";
import EventDrawer from "@/app/components/EventDrawer";
import EventCard from "@/app/components/EventCard";
import api from "@/app/lib/axios";
import dayjs from "dayjs";

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

/**
 * 将后端事件数据转换为日历组件所需的格式
 * @param event - 后端返回的事件数据
 * @returns 日历组件所需的事件数据格式
 */
const toCalendarEvent = (event: ScheduleEvent): CalendarEventData => ({
  id: event.id,
  title: event.title,
  start: dayjs(event.start_at).format("HH:mm"), // 转换为 9:00 格式
  end: dayjs(event.end_at).format("HH:mm"), // 转换为 20:00 格式
  employeeId: event.employee_id,
  color: event.color ?? undefined,
  description: event.description ?? undefined
});

/**
 * 日程管理页面组件
 * 显示日历视图，支持创建、编辑、删除和拖拽事件
 */
export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date()); // 当前显示的日期
  const [events, setEvents] = useState<CalendarEventData[]>([]); // 事件列表
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
  const [timeZone, setTimeZone] = useState<string | null>(null);

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

  // 组件挂载时获取员工列表
  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当日期变化时获取该日期的事件
  useEffect(() => {
    fetchEvents(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

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

    // 创建新事件
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

    setEvents((prev) => prev.filter((event) => event.id !== eventId));
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

    const updatedEvent: CalendarEventData = {
      ...event,
      start: newStart.toISOString(),
      end: newEnd.toISOString()
    };

    // 立即更新 UI
    setEvents((prev) => {
      const updatedEvents = prev.map((item) =>
        item.id === event.id
          ? {
              ...item,
              employeeId: next.employeeId,
              start: newStart.format("HH:mm"),
              end: newEnd.format("HH:mm")
            }
          : item
      );
      return updatedEvents;
    });

    // 发送更新请求到后端
    const response = await api.patch<{
      event: ScheduleEvent;
      events?: ScheduleEvent[];
    }>(`/schedule-events/${event.id}`, {
      employee_id: next.employeeId,
      start_at: updatedEvent.start,
      end_at: updatedEvent.end
    });

    if (response.error) {
      // 更新失败，重新获取事件列表
      message.error(response.error.message);
      fetchEvents(currentDate);
      return;
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTimeZone = window.localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (storedTimeZone) {
      setTimeZone(storedTimeZone);
      return;
    }
    const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolvedTimeZone) {
      setTimeZone(resolvedTimeZone);
      window.localStorage.setItem(TIMEZONE_STORAGE_KEY, resolvedTimeZone);
    }
  }, []);

  return (
    <div className="h-full relative">
      {/* 日历视图组件 */}
      <DayView
        startHour={9} // 开始时间：9:00
        endHour={20} // 结束时间：20:00
        stepMinutes={15} // 时间间隔：15分钟
        use24HourFormat // 使用24小时制
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

      {/* 加载中遮罩层 */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <Spin size="large" tip="Loading schedule..." />
        </div>
      )}

      {/* 事件编辑/创建抽屉 */}
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
