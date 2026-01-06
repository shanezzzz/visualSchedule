"use client";

import { useState } from "react";
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;

// 员工数据类型
interface Employee {
  id: string;
  name: string;
  role?: string;
}

// Mock 员工数据
const initialEmployees: Employee[] = [
  {
    id: "john",
    name: "John Smith",
    role: "开发工程师",
  },
  {
    id: "jane",
    name: "Jane Doe",
    role: "产品经理",
  },
  {
    id: "mike",
    name: "Mike Johnson",
    role: "设计师",
  },
];

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();

  // 生成唯一 ID
  const generateId = (name: string): string => {
    const timestamp = Date.now();
    const namePart = name.toLowerCase().replace(/\s+/g, "_");
    return `${namePart}_${timestamp}`;
  };

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

      if (editingEmployee) {
        // 编辑员工：保持原有的 id 和 color
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingEmployee.id
              ? {
                  ...emp,
                  name: values.name,
                  role: values.role,
                }
              : emp
          )
        );
        message.success("员工信息更新成功");
      } else {
        // 新增员工：自动生成 id 和 color
        const newEmployee: Employee = {
          id: generateId(values.name),
          name: values.name,
          role: values.role,
        };

        setEmployees((prev) => [...prev, newEmployee]);
        message.success("员工添加成功");
      }

      handleCloseModal();
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  // 删除员工
  const handleDelete = (employee: Employee) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除员工 ${employee.name} 吗？此操作不可撤销。`,
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk() {
        setEmployees((prev) => prev.filter((emp) => emp.id !== employee.id));
        message.success("员工删除成功");
      },
    });
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
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
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
