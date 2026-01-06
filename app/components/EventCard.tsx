"use client";

import { CalendarEventData } from "schedule-calendar";
import dayjs from "dayjs";
import { getContrastTextColor } from "@/app/utils/colorUtils";

interface EventCardProps {
  event: CalendarEventData;
  isDragging: boolean;
}

export default function EventCard({ event, isDragging }: EventCardProps) {
  // 处理简单时间格式（如 "09:00"）或完整日期时间
  const parseTime = (time: string) => {
    // 如果是简单时间格式（HH:mm），需要添加今天的日期
    if (time.match(/^\d{2}:\d{2}$/)) {
      const today = dayjs().format("YYYY-MM-DD");
      return dayjs(`${today} ${time}`);
    }
    return dayjs(time);
  };

  const startParsed = parseTime(event.start);
  const endParsed = parseTime(event.end);

  const startTime = startParsed.format("HH:mm");
  const endTime = endParsed.format("HH:mm");
  const duration = endParsed.diff(startParsed, "minute");

  // 根据持续时间决定是否显示完整信息
  const isCompact = duration < 30;

  // 获取事件颜色和对应的文字颜色
  const eventColor = event.color || "#1677ff";
  const textColor = getContrastTextColor(eventColor);

  return (
    <div
      className={`
        h-full w-full p-2 rounded-lg shadow-sm border-l-4
        transition-all duration-200 overflow-hidden
        ${isDragging ? "opacity-50 shadow-lg scale-105" : "hover:shadow-md"}
      `}
      style={{
        backgroundColor: eventColor,
        borderLeftColor: eventColor,
        color: textColor,
      }}
    >
      {
        event.title && (
          <div className="font-medium text-sm line-clamp-1 mb-1">
            {event.title}
          </div>
        )
      }

      {/* 时间范围 - 只在非紧凑模式下显示 */}
      {!isCompact && (
        <div className="text-xs flex items-center gap-1 opacity-90">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {startTime} - {endTime}
          </span>
        </div>
      )}

      {/* 描述 - 只在有足够空间时显示 */}
      {!isCompact && event.description && duration >= 60 && (
        <div className="text-xs mt-2 line-clamp-2 opacity-80">
          {event.description}
        </div>
      )}

      {/* 紧凑模式：只显示开始时间 */}
      {isCompact && <div className="text-xs opacity-90">{startTime}</div>}
    </div>
  );
}
