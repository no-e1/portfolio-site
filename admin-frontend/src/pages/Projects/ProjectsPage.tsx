import { useEffect, useState } from "react";
import {
  createAdminProject,
  deleteAdminProject,
  deleteAdminProjectMedia,
  getAdminProjects,
  publishAdminProject,
  unpublishAdminProject,
  updateAdminProject,
} from "../../api/admin-projects.api";
import { AdminProjectCard } from "../../components/Projects/AdminProjectCard";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { ProjectEditor } from "../../components/Projects/ProjectEditor";
import type { AdminProject, ProjectEditorValue } from "../../types/project";
import styles from "./ProjectsPage.module.css";

type EditorProject = AdminProject | null | undefined;

function sortProjects(projects: AdminProject[]): AdminProject[] {
  return [...projects].sort(
    (first, second) => first.sortOrder - second.sortOrder || first.id - second.id,
  );
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [editorProject, setEditorProject] = useState<EditorProject>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [changingPublicationId, setChangingPublicationId] = useState<
    number | null
  >(null);
  const [pendingPublicationProject, setPendingPublicationProject] =
    useState<AdminProject | null>(null);
  const [pendingDeleteProject, setPendingDeleteProject] =
    useState<AdminProject | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const publishedProjects = projects.filter((project) => project.isPublished);
  const unpublishedProjects = projects.filter(
    (project) => !project.isPublished,
  );

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProjects() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const loadedProjects = await getAdminProjects(abortController.signal);
        setProjects(sortProjects(loadedProjects));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError("Projects could not be loaded.");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();
    return () => abortController.abort();
  }, [requestVersion]);

  async function handleSave(value: ProjectEditorValue, publish: boolean) {
    let savedProject = editorProject
      ? await updateAdminProject(
          editorProject.id,
          value,
          publish || editorProject.isPublished,
        )
      : await createAdminProject(value, publish);

    if (editorProject && !value.replaceMedia) {
      for (const source of value.removedMediaSources) {
        const media = savedProject.media.find(
          (projectMedia) => projectMedia.src === source,
        );

        if (media) {
          savedProject = await deleteAdminProjectMedia(
            savedProject.id,
            media.id,
          );
        }
      }
    }

    setProjects((currentProjects) =>
      sortProjects([
        ...currentProjects.filter((project) => project.id !== savedProject.id),
        savedProject,
      ]),
    );
    setEditorProject(undefined);
  }

  async function handlePublicationChange(project: AdminProject) {
    const action = project.isPublished ? "unpublish" : "publish";
    setActionError(null);
    setChangingPublicationId(project.id);

    try {
      const updatedProject = project.isPublished
        ? null
        : await publishAdminProject(project.id);

      if (project.isPublished) {
        await unpublishAdminProject(project.id);
      }

      setProjects((currentProjects) =>
        currentProjects.map((currentProject) =>
          currentProject.id === project.id
            ? (updatedProject ?? { ...currentProject, isPublished: false })
            : currentProject,
        ),
      );
    } catch {
      setActionError(
        `${project.title} could not be ${action === "publish" ? "published" : "unpublished"}.`,
      );
    } finally {
      setChangingPublicationId(null);
    }
  }

  async function handleDelete(project: AdminProject) {
    if (project.isPublished) {
      return;
    }

    setActionError(null);
    setDeletingId(project.id);

    try {
      await deleteAdminProject(project.id);
      setProjects((currentProjects) =>
        currentProjects.filter(
          (currentProject) => currentProject.id !== project.id,
        ),
      );
    } catch {
      setActionError(`${project.title} could not be deleted.`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Projects</h1>
        <button
          className={styles.addButton}
          type="button"
          onClick={() => setEditorProject(null)}
        >
          add new project
        </button>
      </div>

      {actionError && (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      )}

      {isLoading && <p className={styles.status}>Projects are loading...</p>}

      {loadError && (
        <div className={styles.status}>
          <p role="alert">{loadError}</p>
          <button
            className={styles.retryButton}
            type="button"
            onClick={() => setRequestVersion((version) => version + 1)}
          >
            try again
          </button>
        </div>
      )}

      {!loadError && (
        <div className={styles.projectGroups}>
          <section className={styles.projectGroup}>
            <h2>
              Published projects
              <span>{publishedProjects.length}</span>
            </h2>
            {!isLoading && publishedProjects.length === 0 && (
              <p className={styles.emptyGroup}>No published projects.</p>
            )}
            {publishedProjects.length > 0 && (
              <div className={styles.projectGrid}>
                {publishedProjects.map((project) => (
                  <AdminProjectCard
                    key={project.id}
                    project={project}
                    isChangingPublication={
                      changingPublicationId === project.id
                    }
                    isDeleting={false}
                    onEdit={() => setEditorProject(project)}
                    onChangePublication={() =>
                      setPendingPublicationProject(project)
                    }
                    onDelete={() => undefined}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.projectGroup}>
            <h2>
              Unpublished projects
              <span>{unpublishedProjects.length}</span>
            </h2>
            {!isLoading && unpublishedProjects.length === 0 && (
              <p className={styles.emptyGroup}>No unpublished projects.</p>
            )}
            {unpublishedProjects.length > 0 && (
              <div className={styles.projectGrid}>
                {unpublishedProjects.map((project) => (
                  <AdminProjectCard
                    key={project.id}
                    project={project}
                    isChangingPublication={
                      changingPublicationId === project.id
                    }
                    isDeleting={deletingId === project.id}
                    onEdit={() => setEditorProject(project)}
                    onChangePublication={() =>
                      setPendingPublicationProject(project)
                    }
                    onDelete={() => setPendingDeleteProject(project)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {editorProject !== undefined && (
        <ProjectEditor
          key={editorProject?.id ?? "new-project"}
          project={editorProject}
          onCancel={() => setEditorProject(undefined)}
          onSave={handleSave}
        />
      )}

      {pendingPublicationProject && (
        <ConfirmDialog
          title={
            pendingPublicationProject.isPublished
              ? "Unpublish project?"
              : "Publish project?"
          }
          message={
            pendingPublicationProject.isPublished
              ? `${pendingPublicationProject.title} will no longer be visible on the portfolio.`
              : `${pendingPublicationProject.title} will become visible on the portfolio.`
          }
          confirmLabel={
            pendingPublicationProject.isPublished ? "unpublish" : "publish"
          }
          tone={pendingPublicationProject.isPublished ? "danger" : "default"}
          onConfirm={() => {
            const project = pendingPublicationProject;
            setPendingPublicationProject(null);
            void handlePublicationChange(project);
          }}
          onCancel={() => setPendingPublicationProject(null)}
        />
      )}

      {pendingDeleteProject && (
        <ConfirmDialog
          title="Delete project?"
          message={`${pendingDeleteProject.title} and all associated images will be permanently deleted.`}
          confirmLabel="delete project"
          tone="danger"
          onConfirm={() => {
            const project = pendingDeleteProject;
            setPendingDeleteProject(null);
            void handleDelete(project);
          }}
          onCancel={() => setPendingDeleteProject(null)}
        />
      )}
    </section>
  );
}
