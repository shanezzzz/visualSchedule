"use client";

import { useState } from "react";
import { DayView, CalendarEventData } from "schedule-calendar";
import EventDrawer from "@/app/components/EventDrawer";
import EventCard from "@/app/components/EventCard";
import dayjs from "dayjs";

const EMPLOYEE_IDS = ["john", "jane", "mike"];

// Mock 事件数据
const getMockEvents = (): CalendarEventData[] => {
  return [
    {
      id: "mock-1",
      title: "团队晨会",
      start: "09:00",
      end: "09:30",
      employeeId: "john",
      color: "#1677ff",
      description: "每日站会，同步项目进度",
    },
    {
      id: "mock-2",
      title: "客户会议",
      start: "10:00",
      end: "11:30",
      employeeId: "jane",
      color: "#52c41a",
      description: "与客户讨论新项目需求，准备产品演示材料",
    },
    {
      id: "mock-3",
      title: "午餐",
      start: "12:00",
      end: "13:00",
      employeeId: "mike",
      color: "#faad14",
    },
    {
      id: "mock-4",
      title: "代码审查",
      start: "14:00",
      end: "14:15",
      employeeId: "john",
      color: "#722ed1",
      description: "审查 PR #123",
    },
    {
      id: "mock-5",
      title: "产品设计讨论",
      start: "15:00",
      end: "17:00",
      employeeId: "jane",
      color: "#eb2f96",
      description: "讨论新功能的 UI/UX 设计方案，包括用户流程和交互细节",
    },
    {
      id: "mock-6",
      title: "项目冲刺会议",
      start: "16:00",
      end: "17:00",
      employeeId: "mike",
      color: "#13c2c2",
      description: "Sprint 规划和任务分配",
    },
  ];
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventData[]>(getMockEvents());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | null>(null);
  const [initialValues, setInitialValues] = useState<{
    employeeId?: string;
    startTime?: string;
  }>({});

  // 调试：打印事件数据
  console.log("Current events:", events);
  console.log("Current date:", currentDate);

  const handleTimeLabelClick = (
    timeLabel: string,
    index: number,
    timeSlot: string,
    employee: { id: string; name: string }
  ) => {
    console.log("Time label clicked:", { timeLabel, index, timeSlot, employee });

    // 构建完整的日期时间
    // timeSlot 可能是 ISO 字符串或只是时间标签
    let startTime: string;

    if (timeSlot.includes("T") || timeSlot.includes("Z")) {
      // 已经是 ISO 格式
      startTime = timeSlot;
    } else {
      // 只是时间标签（如 "09:00"），需要组合今天的日期
      const today = new Date();
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

  const handleEventSubmit = (eventData: Omit<CalendarEventData, "id">) => {
    console.log("Event submitted:", eventData);

    // 转换为简单时间格式
    const start = dayjs(eventData.start).format("HH:mm");
    const end = dayjs(eventData.end).format("HH:mm");

    if (editingEvent) {
      // 编辑模式：更新现有事件
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? {
                ...eventData,
                start,
                end,
                id: e.id,
              }
            : e
        )
      );
      setEditingEvent(null);
    } else {
      // 新增模式：创建新事件
      const newEvent: CalendarEventData = {
        ...eventData,
        start,
        end,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
  };

  const handleEventClick = (event: CalendarEventData) => {
    console.log("Event clicked:", event);
    // 设置编辑事件并打开抽屉
    setEditingEvent(event);
    setInitialValues({}); // 清空初始值，使用 editingEvent
    setDrawerOpen(true);
  };

  const handleEventDelete = (eventId: string) => {
    console.log("Event deleted:", eventId);
    // 删除事件
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
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

  const handleEventDrop = (
    event: CalendarEventData,
    next: { employeeId: string; start: string }
  ) => {
    console.log("Event dropped:", { event, next });

    // 辅助函数：解析时间（支持简单格式和 ISO 格式）
    const parseTime = (time: string) => {
      if (time.match(/^\d{2}:\d{2}$/)) {
        const today = dayjs().format("YYYY-MM-DD");
        return dayjs(`${today} ${time}`);
      }
      return dayjs(time);
    };

    // 辅助函数：格式化为简单时间格式
    const formatToSimpleTime = (time: dayjs.Dayjs) => {
      return time.format("HH:mm");
    };

    // 计算原始事件的持续时间（分钟）
    const originalStart = parseTime(event.start);
    const originalEnd = parseTime(event.end);
    const duration = originalEnd.diff(originalStart, "minute");

    // 解析新的开始时间并计算新的结束时间
    const newStart = parseTime(next.start);
    const newEnd = newStart.add(duration, "minute");

    // 更新事件的员工和时间
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              employeeId: next.employeeId,
              start: formatToSimpleTime(newStart),
              end: formatToSimpleTime(newEnd),
            }
          : e
      )
    );
  };

  return (
    <div className="h-full">
      <DayView
        startHour={9}
        endHour={20}
        stepMinutes={15}
        use24HourFormat
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        employeeIds={EMPLOYEE_IDS}
        events={events}
        renderEvent={(params) => {
          return (
            <EventCard event={params.event} isDragging={params.isDragging} />
          );
        }}
        onEventDrop={handleEventDrop}
        onEventClick={handleEventClick}
        onTimeLabelClick={handleTimeLabelClick}
      />

      <EventDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSubmit={handleEventSubmit}
        onDelete={handleEventDelete}
        employeeIds={EMPLOYEE_IDS}
        editingEvent={editingEvent}
        initialValues={initialValues}
      />
    </div>
  );
}
