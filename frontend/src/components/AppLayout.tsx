import { useState, type ReactNode } from 'react';
import { Layout, Avatar, Space, Dropdown, Button, Typography } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined, MessageOutlined, PushpinOutlined, PushpinFilled } from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePinnedTabs } from '../pinned/PinnedTabsContext';
import { useThemeMode } from '../theme/ThemeContext';

const { Header, Content } = Layout;

function NavTab({
  to,
  active,
  icon,
  label,
  darkMode,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  label: ReactNode;
  darkMode: boolean;
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: '100%',
        padding: '0 16px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        color: active ? '#2f54eb' : darkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)',
        borderBottom: active ? '2px solid #2f54eb' : '2px solid transparent',
        fontWeight: 500,
      }}
    >
      {icon}
      {label}
    </Link>
  );
}

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const { darkMode } = useThemeMode();
  const { pinnedTabs, togglePin, isCoreHidden, toggleCoreVisibility } = usePinnedTabs();
  const [vcpOpen, setVcpOpen] = useState(false);

  const coreTabs = [
    { key: '/projects', icon: <ProjectOutlined />, label: 'Проекты' },
    ...(user?.role === 'Admin' ? [{ key: '/users', icon: <TeamOutlined />, label: 'Пользователи' }] : []),
    { key: '/chat', icon: <MessageOutlined />, label: 'Глобальный чат' },
  ];

  const staticItems = coreTabs.filter(tab => !isCoreHidden(tab.key));

  const pinnedItems = pinnedTabs.map(tab => ({
    key: tab.key,
    icon: tab.type === 'project' ? <ProjectOutlined /> : <UserOutlined />,
    label: tab.label,
  }));

  const activeKey = [...staticItems, ...pinnedItems]
    .slice()
    .reverse()
    .find(item => location.pathname.startsWith(item.key))?.key;

  const vcpListPanel = (
    <div
      style={{
        minWidth: 260,
        padding: 8,
        background: darkMode ? '#1f1f1f' : '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
      }}
    >
      <Typography.Text type="secondary" style={{ display: 'block', padding: '4px 8px', fontSize: 12 }}>
        ОСНОВНЫЕ
      </Typography.Text>
      {coreTabs.map(tab => {
        const hidden = isCoreHidden(tab.key);
        return (
          <div
            key={tab.key}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', gap: 8 }}
          >
            <Link
              to={tab.key}
              onClick={() => setVcpOpen(false)}
              style={{ flex: 1, minWidth: 0, color: 'inherit' }}
            >
              <Space style={{ opacity: hidden ? 0.5 : 1 }}>
                {tab.icon}
                {tab.label}
              </Space>
            </Link>
            <Button
              size="small"
              type="text"
              icon={hidden ? <PushpinOutlined /> : <PushpinFilled />}
              onClick={() => toggleCoreVisibility(tab.key)}
            >
              {hidden ? 'Закрепить' : 'Открепить'}
            </Button>
          </div>
        );
      })}
      <Typography.Text type="secondary" style={{ display: 'block', padding: '12px 8px 4px', fontSize: 12 }}>
        ПОЛЬЗОВАТЕЛЬСКИЕ
      </Typography.Text>
      {pinnedTabs.length === 0 && (
        <Typography.Text type="secondary" style={{ display: 'block', padding: '4px 8px' }}>
          Нет закреплённых вкладок
        </Typography.Text>
      )}
      {pinnedTabs.map(tab => (
        <div
          key={tab.key}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', gap: 8 }}
        >
          <Link
            to={tab.key}
            onClick={() => setVcpOpen(false)}
            style={{ flex: 1, minWidth: 0, color: 'inherit' }}
          >
            <Space>
              {tab.type === 'project' ? <ProjectOutlined /> : <UserOutlined />}
              {tab.label}
            </Space>
          </Link>
          <Button size="small" type="text" icon={<PushpinFilled />} onClick={() => togglePin(tab)}>
            Открепить
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
          zIndex: 1,
          gap: 32,
        }}
      >
        <Dropdown
          trigger={['click']}
          open={vcpOpen}
          onOpenChange={setVcpOpen}
          popupRender={() => vcpListPanel}
          menu={{ items: [] }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: '#2f54eb', whiteSpace: 'nowrap', cursor: 'pointer' }}>VCP</span>
        </Dropdown>
        <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {staticItems.map(tab => (
            <NavTab key={tab.key} to={tab.key} active={tab.key === activeKey} icon={tab.icon} label={tab.label} darkMode={darkMode} />
          ))}
          {pinnedItems.length > 0 && (
            <>
              <span
                style={{
                  width: 1,
                  height: 22,
                  margin: '0 12px',
                  flexShrink: 0,
                  background: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                }}
              />
              {pinnedItems.map(tab => (
                <NavTab key={tab.key} to={tab.key} active={tab.key === activeKey} icon={tab.icon} label={tab.label} darkMode={darkMode} />
              ))}
            </>
          )}
        </div>
        <Link to="/profile" style={{ color: 'inherit' }}>
          <Space style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Avatar style={{ backgroundColor: '#2f54eb' }} src={user?.avatarUrl} icon={!user?.avatarUrl ? <UserOutlined /> : undefined} />
            {user?.name}
          </Space>
        </Link>
      </Header>
      <Content style={{ padding: '32px 24px', flex: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
