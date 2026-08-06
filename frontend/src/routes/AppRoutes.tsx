import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "../components/Layout/Layout";
import { HomePage } from "../pages/Home/HomePage";
import { AboutPage } from "../pages/About/AboutPage";
import { ProjectsPage } from "../pages/Projects/ProjectsPage";
import { DocsPage } from "../pages/Docs/DocsPage";
import { PrivacyPage } from "../pages/Privacy/PrivacyPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="impressum" element={<PrivacyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
