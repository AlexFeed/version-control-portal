import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { PinnedTabsProvider } from './pinned/PinnedTabsContext';
import { ThemeProvider, useThemeMode } from './theme/ThemeContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

function ThemedConfigProvider({ children }: { children: ReactNode }) {
  const { darkMode } = useThemeMode();

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2f54eb',
          borderRadius: 8,
          fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
          ...(darkMode ? {} : { colorBgLayout: '#f5f6fa' }),
        },
        components: {
          Layout: {
            headerBg: darkMode ? undefined : '#fff',
            bodyBg: darkMode ? undefined : '#f5f6fa',
          },
          Card: {
            boxShadowTertiary: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 6px -1px rgba(15, 23, 42, 0.08)',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedConfigProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PinnedTabsProvider>
              <App />
            </PinnedTabsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemedConfigProvider>
    </ThemeProvider>
  </StrictMode>,
);
