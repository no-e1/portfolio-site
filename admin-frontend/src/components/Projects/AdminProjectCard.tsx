import type { AdminProject } from "../../types/project";
import { getMediaUrl } from "../../utils/media-url";
import styles from "./AdminProjectCard.module.css";

type AdminProjectCardProps = {
  project: AdminProject;
  isChangingPublication: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onChangePublication: () => void;
  onDelete: () => void;
};

export function AdminProjectCard({
  project,
  isChangingPublication,
  isDeleting,
  onEdit,
  onChangePublication,
  onDelete,
}: AdminProjectCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.mediaFrame}>
        <img
          className={styles.image}
          src={getMediaUrl(project.coverMedia.src)}
          alt={`Cover of ${project.title}`}
        />
        <span
          className={`${styles.status} ${
            project.isPublished ? styles.published : styles.draft
          }`}
        >
          {project.isPublished ? "published" : "draft"}
        </span>
      </div>

      <div className={styles.content}>
        <p className={styles.period}>{project.period}</p>
        <h2 className={styles.title}>{project.title}</h2>
        <p className={styles.description}>{project.shortDescription}</p>

        <div className={styles.tags}>
          {project.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        {project.links.length > 0 && (
          <div className={styles.links}>
            {project.links.map((link) => (
              <a
                key={`${link.type}-${link.href}`}
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryAction} type="button" onClick={onEdit}>
            edit
          </button>
          <button
            className={styles.secondaryAction}
            type="button"
            onClick={onChangePublication}
            disabled={isChangingPublication}
          >
            {isChangingPublication
              ? project.isPublished
                ? "unpublishing..."
                : "publishing..."
              : project.isPublished
                ? "unpublish"
                : "publish"}
          </button>
          {!project.isPublished && (
            <button
              className={styles.deleteAction}
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "deleting..." : "delete"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
