import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import VersionFormPage from './pages/VersionFormPage';
import VersionDetailPage from './pages/VersionDetailPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import GlobalBoardPage from './pages/GlobalBoardPage';
import HistoryPage from './pages/HistoryPage';
import GlobalSearchPage from './pages/GlobalSearchPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/new-version" element={<VersionFormPage />} />
          <Route path="/projects/:id/versions/:versionId" element={<VersionDetailPage />} />
          <Route path="/projects/:id/versions/:versionId/edit" element={<VersionFormPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/board" element={<GlobalBoardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/search" element={<GlobalSearchPage />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UserDetailPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
