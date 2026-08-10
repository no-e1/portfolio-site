import { useState } from "react";
import type { Project } from "../../types/project";
import styles from "./ProjectsPage.module.css";

import { ProjectCard } from "../../components/Projects/ProjectCard/ProjectCard";
import { ProjectModal } from "../../components/Projects/ProjectModal/ProjectModal";
import { useInfiniteProjects } from "../../hooks/useInfiniteProjects";

export function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { projects, loadMoreRef, isLoading, error, retry } =
    useInfiniteProjects();

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Projekte</h1>
      <p className={styles.introduction}>
        Eine Übersicht über meine Informatikprojekte und die Technologien, die
        dabei zum Einsatz kamen.
      </p>

      <div className={styles.projectGrid}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={() => setSelectedProject(project)}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className={styles.loadMore} aria-hidden="true" />

      {isLoading && <p className={styles.status}>Projekte werden geladen...</p>}
      {error && (
        <div className={styles.status}>
          <p role="alert">{error}</p>
          <button type="button" onClick={retry}>
            Erneut versuchen
          </button>
        </div>
      )}
      {!isLoading && !error && projects.length === 0 && (
        <p className={styles.status}>Noch keine Projekte vorhanden.</p>
      )}

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}
