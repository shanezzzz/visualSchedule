"use client";

import {
  Drawer,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  ColorPicker
} from "antd";
import { CalendarEventData } from "schedule-calendar";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface EventDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<CalendarEventData, "id">) => Promise<boolean>;
  onDelete?: (eventId: string) => void;
  employees: Array<{ id: string; name: string }>;
  editingEvent?: CalendarEventData | null;
  initialValues?: {
    employeeId?: string;
    startTime?: string;
  };
}

export default function EventDrawer({
  open,
  onClose,
  onSubmit,
  onDelete,
  employees,
  editingEvent,
  initialValues
}: EventDrawerProps) {
  const [form] = Form.useForm();
  const [color, setColor] = useState("#1677ff");
  const [submitting, setSubmitting] = useState(false);

  // 判断是编辑模式还是新增模式
  const isEditing = !!editingEvent;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.timeRange as [Dayjs, Dayjs];

      const eventData: Omit<CalendarEventData, "id"> = {
        title: values.title,
        start: start.toISOString(),
        end: end.toISOString(),
        employeeId: values.employeeId,
        color: color,
        description: values.description
      };

      setSubmitting(true);
      const success = await onSubmit(eventData);
      if (success) {
        form.resetFields();
        setColor("#1677ff");
        onClose();
      }
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setColor("#1677ff");
    onClose();
  };

  // Set initial values when drawer opens
  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      if (editingEvent) {
        // 编辑模式：回显事件数据
        const parseTime = (time: string) => {
          if (time.match(/^\d{2}:\d{2}$/)) {
            const today = dayjs().format("YYYY-MM-DD");
            return dayjs(`${today} ${time}`);
          }
          return dayjs(time);
        };

        const startTime = parseTime(editingEvent.start);
        const endTime = parseTime(editingEvent.end);

        form.setFieldsValue({
          title: editingEvent.title,
          timeRange: [startTime, endTime],
          employeeId: editingEvent.employeeId,
          description: editingEvent.description
        });

        if (editingEvent.color) {
          setColor(editingEvent.color);
        }
      } else if (initialValues) {
        // 新增模式：使用初始值
        let startTime = dayjs();

        if (initialValues.startTime) {
          const parsed = dayjs(initialValues.startTime);
          if (parsed.isValid()) {
            startTime = parsed;
          } else {
            console.warn("Invalid startTime:", initialValues.startTime);
          }
        }

        const endTime = startTime.add(1, "hour");

        form.setFieldsValue({
          employeeId: initialValues.employeeId,
          timeRange: [startTime, endTime]
        });
      }
    }
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      onDelete(editingEvent.id);
      form.resetFields();
      setColor("#1677ff");
      onClose();
    }
  };

  return (
    <Drawer
      title={isEditing ? "Edit Event" : "Add Event"}
      placement="right"
      width={480}
      open={open}
      onClose={handleClose}
      afterOpenChange={handleAfterOpenChange}
      footer={
        <Space className="w-full justify-end">
          {isEditing && onDelete && (
            <Button danger onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            {isEditing ? "Save" : "Confirm"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          color: "#1677ff"
        }}
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter event title" }]}
        >
          <Input placeholder="Please enter event title" />
        </Form.Item>

        <Form.Item
          label="Time Range"
          name="timeRange"
          rules={[{ required: true, message: "Please select time range" }]}
        >
          <RangePicker
            showTime={{
              format: "HH:mm",
              minuteStep: 15
            }}
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
            // disabledDate={(current) => {
            //   // 禁用今天以外的日期
            //   return current && !current.isSame(dayjs(), "day");
            // }}
          />
        </Form.Item>

        <Form.Item
          label="Assignee"
          name="employeeId"
          rules={[{ required: true, message: "Please select an assignee" }]}
        >
          <Select
            placeholder="Please select an assignee"
            showSearch
            optionFilterProp="children"
          >
            {employees.map((employee) => (
              <Select.Option key={employee.id} value={employee.id}>
                {employee.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Color">
          <ColorPicker
            value={color}
            onChange={(_, hex) => setColor(hex)}
            showText
            presets={[
              {
                label: "Presets",
                colors: [
                  "#1677ff",
                  "#52c41a",
                  "#faad14",
                  "#f5222d",
                  "#722ed1",
                  "#13c2c2",
                  "#eb2f96",
                  "#fa8c16"
                ]
              }
            ]}
          />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea
            rows={4}
            placeholder="Please enter event description (optional)"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
