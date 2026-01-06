"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api from "@/app/lib/axios";

const { Title } = Typography;

// 员工数据类型
interface Employee {
  id: string;
  name: string;
  role?: string;
  color?: string | null;
}

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // 打开新增/编辑弹窗
  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      // 编辑模式
      setEditingEmployee(employee);
      form.setFieldsValue({
        name: employee.name,
        role: employee.role,
      });
    } else {
      // 新增模式
      setEditingEmployee(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const response = await api.get<{ employees: Employee[] }>("/employees");

    if (response.error) {
      message.error(response.error.message);
      setLoading(false);
      return;
    }

    setEmployees(response.data?.employees ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingEmployee) {
        const response = await api.patch<{ employee: Employee }>(
          `/employees/${editingEmployee.id}`,
          {
            name: values.name,
            role: values.role,
          }
        );

        if (response.error) {
          message.error(response.error.message);
          setSaving(false);
          return;
        }

        if (response.data?.employee) {
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === editingEmployee.id
                ? response.data?.employee || emp
                : emp
            )
          );
        } else {
          await fetchEmployees();
        }

        message.success("Employee information updated successfully");
      } else {
        const response = await api.post<{ employee: Employee }>("/employees", {
          name: values.name,
          role: values.role,
        });

        if (response.error) {
          message.error(response.error.message);
          setSaving(false);
          return;
        }

        if (response.data?.employee) {
          setEmployees((prev) => [
            ...prev,
            response.data?.employee || {
              id: "",
              name: "",
              role: "",
              color: "",
            },
          ]);
        } else {
          await fetchEmployees();
        }

        message.success("Employee added successfully");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setSaving(false);
    }
  };

  // 删除员工
  const handleDelete = async(employee: Employee) => {
    try {
      const response = await api.delete<{ employee: Employee }>(
        `/employees/${employee.id}`
      );

      if (response.error) {
        message.error(response.error.message);
        return;
      }

      setEmployees((prev) => prev.filter((emp) => emp.id !== employee.id));
      message.success("Employee deleted successfully");
    } catch (error) {
      console.error("Failed to delete employee:", error);
      message.error("Failed to delete employee");
    }
  };

  // 表格列定义
  const columns: ColumnsType<Employee> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 300,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 300,
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            Edit
          </Button>
          <Popconfirm title={`Are you sure you want to delete employee ${record.name}?`} onConfirm={() => handleDelete(record)}>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <Title level={3} style={{ margin: 0 }}>
            Staff Management
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Add Employee
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`,
          }}
        />
      </Card>

      {/* 新增/编辑员工弹窗 */}
      <Modal
        title={editingEmployee ? "Edit Employee" : "Add Employee"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText={editingEmployee ? "Save" : "Add"}
        confirmLoading={saving}
        cancelText="Cancel"
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter employee name" }]}
          >
            <Input placeholder="Please enter employee name" />
          </Form.Item>

          <Form.Item label="Role" name="role">
            <Input placeholder="e.g. Software Engineer" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
