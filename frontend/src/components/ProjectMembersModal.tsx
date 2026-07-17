import React, { useEffect, useState } from 'react';
import { Modal, Table, Input, message, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getUsers } from '../api/usersApi';
import type { User, Role } from '../types';

interface ProjectMembersModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (userIds: number[]) => Promise<void>;
  initialSelectedIds: number[];
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({ open, onClose, onSave, initialSelectedIds }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedRowKeys(initialSelectedIds);
      fetchUsers();
    }
  }, [open, initialSelectedIds]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      // Убираем админов, так как они и так имеют доступ
      setUsers(data.filter((u: User) => u.role !== 'Admin'));
    } catch (error) {
      message.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(selectedRowKeys as number[]);
      onClose();
    } catch (error) {
      message.error('Ошибка сохранения участников');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Пользователь',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: Role) => {
        let color = 'default';
        if (role === 'Developer') color = 'blue';
        if (role === 'Viewer') color = 'green';
        return <Tag color={color}>{role}</Tag>;
      },
      filters: [
        { text: 'Developer', value: 'Developer' },
        { text: 'Viewer', value: 'Viewer' },
      ],
      onFilter: (value: any, record: User) => record.role === value,
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <Modal
      title="Добавить участников в проект"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={loading}
      width={600}
      okText="Сохранить"
      cancelText="Отмена"
    >
      <Input
        placeholder="Поиск по логину"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        size="small"
      />
    </Modal>
  );
};
