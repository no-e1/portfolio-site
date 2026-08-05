import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../components/Layout/AdminLayout";
import { LoginPage } from "../pages/Login/LoginPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { ProjectsPage } from "../pages/Projects/ProjectsPage";
import { UsersPage } from "../pages/Users/UsersPage";
import { AboutPage } from "../pages/About/AboutPage";
import { ProtectedRoute } from "./ProtectedRoute";

type AppRoutesProps = {
  accessToken: string | null;
  onLogin: (accessToken: string) => void;
  onLogout: () => void;
};

export function AppRoutes({ accessToken, onLogin, onLogout }: AppRoutesProps) {
  const isAuthenticated = accessToken !== null;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={onLogin} />
            )
          }
        />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<AdminLayout onLogout={onLogout} />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
