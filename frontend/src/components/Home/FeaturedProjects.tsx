import { useEffect, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getProjectsPage } from "../../api/projects.api";
import type { Project } from "../../types/project";
import { ProjectCard } from "../Projects/ProjectCard/ProjectCard";
import { ProjectModal } from "../Projects/ProjectModal/ProjectModal";
import styles from "./FeaturedProjects.module.css";

export function FeaturedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProjects() {
      setIsLoading(true);
      setError(null);

      try {
        const page = await getProjectsPage(0, abortController.signal);
        setProjects(page.items.slice(0, 2));
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return;
        }

        setError("Projekte konnten nicht geladen werden.");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => abortController.abort();
  }, [requestVersion]);

  return (
    <section className={styles.featured} aria-label="Ausgewählte Projekte">
      <h2 className={styles.title}>Meine Projekte</h2>

      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={() => setSelectedProject(project)}
          />
        ))}
      </div>

      {isLoading && <p className={styles.status}>Projekte werden geladen...</p>}
      {error && (
        <div className={styles.status}>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setRequestVersion((value) => value + 1)}>
            Erneut versuchen
          </button>
        </div>
      )}

      <Link className={styles.allProjects} to="/projects">
        <span>Alle meine Projekte</span>
        <FiArrowRight aria-hidden="true" />
      </Link>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}
