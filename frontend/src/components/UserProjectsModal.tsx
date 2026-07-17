import React, { useEffect, useState } from 'react';
import { Modal, Table, Input, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getProjects } from '../api/projectsApi';
import type { Project } from '../types';

interface UserProjectsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (projectIds: number[]) => Promise<void>;
  initialSelectedIds: number[];
}

export const UserProjectsModal: React.FC<UserProjectsModalProps> = ({ open, onClose, onSave, initialSelectedIds }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedRowKeys(initialSelectedIds);
      fetchProjects();
    }
  }, [open, initialSelectedIds]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      message.error('Ошибка загрузки проектов');
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
      message.error('Ошибка сохранения проектов');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => 
    p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Проект',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
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
      title="Добавить проекты пользователю"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={loading}
      width={600}
      okText="Сохранить"
      cancelText="Отмена"
    >
      <Input
        placeholder="Поиск по названию"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredProjects}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        size="small"
      />
    </Modal>
  );
};
