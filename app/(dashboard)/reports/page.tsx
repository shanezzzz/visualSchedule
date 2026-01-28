"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  DatePicker,
  Empty,
  Space,
  Spin,
  Statistic,
  Table,
  Typography,
  message,
  Progress
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";

import api from "@/app/lib/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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

type EmployeeSummary = {
  id: string;
  name: string;
  eventCount: number;
  totalMinutes: number;
  totalHours: number;
  avgHours: number;
};

const TIMEZONE_STORAGE_KEY = "visual-schedule.timezone";
const DEFAULT_RANGE: [Dayjs, Dayjs] = [
  dayjs().subtract(6, "day").startOf("day"),
  dayjs().endOf("day")
];

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<[Dayjs, Dayjs]>(DEFAULT_RANGE);
  const [timeZone, setTimeZone] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    const response = await api.get<{ employees: Employee[] }>("/employees");

    if (response.error) {
      message.error(response.error.message);
      return;
    }

    setEmployees(response.data?.employees ?? []);
  }, []);

  const fetchEvents = useCallback(async (nextRange: [Dayjs, Dayjs]) => {
    setLoading(true);
    const start = nextRange[0].startOf("day").toISOString();
    const end = nextRange[1].endOf("day").toISOString();
    const params = new URLSearchParams({ start, end });
    const response = await api.get<{ events: ScheduleEvent[] }>(
      `/schedule-events?${params.toString()}`
    );

    if (response.error) {
      message.error(response.error.message);
      setLoading(false);
      return;
    }

    setEvents(response.data?.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await fetchEmployees();
    };
    fetchData();
  }, [fetchEmployees]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTimeZone = window.localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (storedTimeZone) {
      setTimeout(() => {
        setTimeZone(storedTimeZone);
      }, 0);
      return;
    }
    const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolvedTimeZone) {
      setTimeout(() => {
        setTimeZone(resolvedTimeZone);
      }, 0);
      window.localStorage.setItem(TIMEZONE_STORAGE_KEY, resolvedTimeZone);
    }
  }, []);

  useEffect(() => {
    if (!range[0] || !range[1]) return;
    const fetchData = async () => {
      await fetchEvents(range);
    };
    fetchData();
  }, [range, fetchEvents]);

  const { summaries, totalMinutes, totalEvents } = useMemo(() => {
    const totals = new Map<string, { minutes: number; events: number }>();

    events.forEach((event) => {
      const start = dayjs(event.start_at);
      const end = dayjs(event.end_at);
      const duration = Math.max(end.diff(start, "minute"), 0);
      const current = totals.get(event.employee_id) ?? {
        minutes: 0,
        events: 0
      };
      totals.set(event.employee_id, {
        minutes: current.minutes + duration,
        events: current.events + 1
      });
    });

    const totalMinutesAll = Array.from(totals.values()).reduce(
      (sum, item) => sum + item.minutes,
      0
    );

    const rows: EmployeeSummary[] = employees.map((employee) => {
      const entry = totals.get(employee.id) ?? { minutes: 0, events: 0 };
      const totalHours = entry.minutes / 60;
      const avgHours = entry.events ? totalHours / entry.events : 0;
      return {
        id: employee.id,
        name: employee.name,
        eventCount: entry.events,
        totalMinutes: entry.minutes,
        totalHours,
        avgHours
      };
    });

    rows.sort((a, b) => b.totalMinutes - a.totalMinutes);

    return {
      summaries: rows,
      totalMinutes: totalMinutesAll,
      totalEvents: events.length
    };
  }, [employees, events]);

  const columns: ColumnsType<EmployeeSummary> = [
    {
      title: "Employee",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Events",
      dataIndex: "eventCount",
      key: "eventCount",
      width: 100
    },
    {
      title: "Total Hours",
      dataIndex: "totalHours",
      key: "totalHours",
      render: (value: number) => value.toFixed(1)
    },
    {
      title: "Avg Hours / Event",
      dataIndex: "avgHours",
      key: "avgHours",
      render: (value: number) => value.toFixed(1)
    },
    
  ];

  const totalHours = totalMinutes / 60;
  const averageHours = totalEvents ? totalHours / totalEvents : 0;

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Space direction="vertical" size={4}>
            <Title level={3} style={{ margin: 0 }}>
              Reports
            </Title>
            <Text type="secondary">
              Analyze workload and time distribution across staff members.
            </Text>
          </Space>
        </Card>

        <Card>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Space wrap>
              <RangePicker
                value={range}
                onChange={(value) => {
                  if (value?.[0] && value?.[1]) {
                    setRange([value[0], value[1]]);
                  }
                }}
                allowClear={false}
              />
              <Text type="secondary">Time zone: {timeZone ?? "Local"}</Text>
            </Space>
          </Space>
        </Card>

        <Card>
          <Space size="large" wrap>
            <Statistic title="Total Events" value={totalEvents} />
            <Statistic title="Total Hours" value={totalHours.toFixed(1)} />
            <Statistic
              title="Avg Hours / Event"
              value={averageHours.toFixed(1)}
            />
          </Space>
        </Card>

        <Card title="Workload Overview">
          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 24 }}
            >
              <Spin />
            </div>
          ) : totalMinutes === 0 ? (
            <Empty description="No events in selected range" />
          ) : (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {summaries.map((summary) => (
                <div key={summary.id}>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Space
                      wrap
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Text>{summary.name}</Text>
                      <Text type="secondary">
                        {summary.totalHours.toFixed(1)} h · {summary.eventCount}{" "}
                        events
                      </Text>
                    </Space>
                    <Progress
                      percent={
                        totalMinutes
                          ? Number(
                              (
                                (summary.totalMinutes / totalMinutes) *
                                100
                              ).toFixed(1)
                            )
                          : 0
                      }
                      size="small"
                      showInfo={false}
                    />
                  </Space>
                </div>
              ))}
            </Space>
          )}
        </Card>

        <Card title="Workload by Employee">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={summaries}
            loading={loading}
            pagination={{ pageSize: 6 }}
          />
        </Card>
      </Space>
    </div>
  );
}
