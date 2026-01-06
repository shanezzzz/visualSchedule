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

        message.success("员工信息更新成功");
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

        message.success("员工添加成功");
      }

      handleCloseModal();
    } catch (error) {
      console.error("表单验证失败:", error);
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
      message.success("员工删除成功");
    } catch (error) {
      console.error("删除员工失败:", error);
      message.error("删除员工失败");
    }
  };

  // 表格列定义
  const columns: ColumnsType<Employee> = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 300,
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 300,
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm title={`确定删除员工 ${record.name} 吗？`} onConfirm={() => handleDelete(record)}>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
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
            员工管理
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            添加员工
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
            showTotal: (total) => `共 ${total} 名员工`,
          }}
        />
      </Card>

      {/* 新增/编辑员工弹窗 */}
      <Modal
        title={editingEmployee ? "编辑员工" : "添加员工"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText={editingEmployee ? "保存" : "添加"}
        confirmLoading={saving}
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: "请输入员工姓名" }]}
          >
            <Input placeholder="请输入员工姓名" />
          </Form.Item>

          <Form.Item label="角色" name="role">
            <Input placeholder="例如: 开发工程师" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
