import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "../components/Layout/Layout";
import { HomePage } from "../pages/Home/HomePage";
import { AboutPage } from "../pages/About/AboutPage";
import { ProjectsPage } from "../pages/Projects/ProjectsPage";
import { DocsPage } from "../pages/Docs/DocsPage";
import { PrivacyPage } from "../pages/Privacy/PrivacyPage";
import { HobbysPage } from "../pages/Hobbys/HobbysPage";

const pageTitles: Record<string, string> = {
  "/": "Home - Noel Kohn",
  "/projects": "Projekte - Noel Kohn",
  "/about": "Über mich - Noel Kohn",
  "/hobbys": "Hobbys - Noel Kohn",
  "/docs": "Dokumente - Noel Kohn",
  "/impressum": "Impressum - Noel Kohn",
};

function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = pageTitles[pathname] ?? "Noel Kohn";
  }, [pathname]);

  return null;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <PageTitle />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="hobbys" element={<HobbysPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="impressum" element={<PrivacyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
