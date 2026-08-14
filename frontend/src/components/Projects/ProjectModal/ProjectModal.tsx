import type { Project } from "../../../types/project";
import styles from "./ProjectModal.module.css";
import { useCallback, useEffect, useState } from "react";
import { FaFilePdf, FaGithub, FaGlobe } from "react-icons/fa";


type ProjectModalProps = {
    project: Project;
    onClose: () => void;
};

const linkIcons = {
  website: FaGlobe,
  github: FaGithub,
  document: FaFilePdf,
};

export function ProjectModal({ project, onClose }: ProjectModalProps) {

    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const activeMedia = project.media[activeMediaIndex];
    const hasMultipleMedia = project.media.length > 1;

    const showPreviousMedia = useCallback(() => {
    setActiveMediaIndex((currentIndex) =>
        currentIndex === 0 ? project.media.length - 1 : currentIndex - 1
    );
    }, [project.media.length]);

    const showNextMedia = useCallback(() => {
    setActiveMediaIndex((currentIndex) =>
        currentIndex === project.media.length - 1 ? 0 : currentIndex + 1
    );
    }, [project.media.length]);

    useEffect(() => {
        if (!hasMultipleMedia) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setActiveMediaIndex((currentIndex) =>
            currentIndex === project.media.length - 1 ? 0 : currentIndex + 1
            );
        }, 5000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [hasMultipleMedia, project.media.length]);
    
    useEffect(() => {
        const body = document.body;
        const scrollPosition = window.scrollY;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        const previousStyles = {
            overflow: body.style.overflow,
            position: body.style.position,
            top: body.style.top,
            left: body.style.left,
            right: body.style.right,
            paddingRight: body.style.paddingRight,
        };

        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollPosition}px`;
        body.style.left = "0";
        body.style.right = "0";

        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            body.style.overflow = previousStyles.overflow;
            body.style.position = previousStyles.position;
            body.style.top = previousStyles.top;
            body.style.left = previousStyles.left;
            body.style.right = previousStyles.right;
            body.style.paddingRight = previousStyles.paddingRight;
            window.scrollTo(0, scrollPosition);
        };
    }, []);

    useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
        onClose();
        }

        if (hasMultipleMedia && event.key === "ArrowLeft") {
        showPreviousMedia();
        }

        if (hasMultipleMedia && event.key === "ArrowRight") {
        showNextMedia();
        }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
        document.removeEventListener("keydown", handleKeyDown);
    };
    }, [hasMultipleMedia, onClose, showPreviousMedia, showNextMedia]);
  
    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    ×
                </button>

                <div className={styles.gallery}>
                    {hasMultipleMedia && (
                        <button onClick={showPreviousMedia} className={styles.galleryButton} tabIndex={-1}>
                            ‹
                        </button>
                    )}

                    <img
                        className={styles.galleryImage}
                        src={activeMedia.src}
                        alt=""
                    />

                    {hasMultipleMedia && (
                        <button onClick={showNextMedia} className={styles.galleryButton} tabIndex={-1}>
                            ›
                        </button>
                    )}

                    {hasMultipleMedia && (
                        <div className={styles.dots}>
                            {project.media.map((media, index) => (
                            <button
                                key={media.src}
                                className={
                                index === activeMediaIndex ? styles.dotActive : styles.dot
                                }
                                onClick={() => setActiveMediaIndex(index)}
                            />
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.projectHeader}>
                    <div>
                        <h2 className={styles.title}>{project.title}</h2>
                        <p className={styles.period}>{project.period}</p>
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
                <p className={styles.description}>{project.longDescription}</p>

                <div className={styles.tags}>
                    {project.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                        {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
