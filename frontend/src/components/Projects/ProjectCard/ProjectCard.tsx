import styles from "./ProjectCard.module.css";

import type { Project } from "../../../types/project";
import { FaFilePdf, FaGithub, FaGlobe } from "react-icons/fa";


type ProjectCardProps = {
  project: Project;
  onOpen: () => void;
};

const linkIcons = {
    website: FaGlobe,
    github: FaGithub,
    document: FaFilePdf,
};

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
    return (
        <article className={styles.card}>
            <img
                className={styles.image}
                src={project.coverMedia.src}
                onClick={onOpen}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                    onOpen();
                    }
                }}
            />

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

                <div className={styles.links}>
                    {project.links.map((link) => {
                        const LinkIcon = linkIcons[link.type];

                        return (
                            <a
                                key={`${link.type}-${link.href}`}
                                href={link.href}
                                className={styles.link}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <LinkIcon className={styles.linkIcon} />
                                {link.label}
                            </a>
                        );
                    })}
                </div>
            </div>
        </article>
    );
}
