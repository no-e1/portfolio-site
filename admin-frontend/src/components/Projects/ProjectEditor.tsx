import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { ApiError } from "../../api/api-client";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import type {
  AdminProject,
  ProjectEditorValue,
  ProjectLink,
} from "../../types/project";
import { getMediaUrl } from "../../utils/media-url";
import styles from "./ProjectEditor.module.css";

const ACCEPTED_MEDIA_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_MEDIA_FILES = 10;

type ProjectEditorProps = {
  project: AdminProject | null;
  onCancel: () => void;
  onSave: (value: ProjectEditorValue, publish: boolean) => Promise<void>;
};

type PendingEditorAction = "cancel" | "save" | "publish" | null;

const EDITOR_CONFIRMATIONS = {
  cancel: {
    title: "Discard changes?",
    message: "All unsaved changes in this project editor will be lost.",
    confirmLabel: "discard changes",
    tone: "danger" as const,
  },
  save: {
    title: "Save project?",
    message: "The current project changes will be saved.",
    confirmLabel: "save",
    tone: "default" as const,
  },
  publish: {
    title: "Save and publish?",
    message: "The project will be saved and made visible on the portfolio.",
    confirmLabel: "save + publish",
    tone: "default" as const,
  },
};

function createInitialValue(project: AdminProject | null): ProjectEditorValue {
  return {
    slug: project?.slug ?? "",
    title: project?.title ?? "",
    shortDescription: project?.shortDescription ?? "",
    longDescription: project?.longDescription ?? "",
    period: project?.period ?? "",
    tags: project?.tags ?? [],
    links: project?.links ?? [],
    sortOrder: project?.sortOrder ?? 0,
    coverFile: null,
    mediaFiles: [],
    replaceMedia: false,
    removedMediaSources: [],
  };
}

function moveItem<T>(items: T[], index: number, offset: -1 | 1): T[] {
  const targetIndex = index + offset;

  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  [nextItems[index], nextItems[targetIndex]] = [
    nextItems[targetIndex],
    nextItems[index],
  ];
  return nextItems;
}

function validateFiles(files: File[]): string | null {
  const unsupportedFile = files.find(
    (file) => !ACCEPTED_MEDIA_TYPES.has(file.type),
  );

  if (unsupportedFile) {
    return `${unsupportedFile.name}: Only JPEG, PNG, WebP and GIF is allowed.`;
  }

  const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

  if (oversizedFile) {
    return `${oversizedFile.name}: Max 5 MB per file`;
  }

  return null;
}

function getFileIdentity(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${file.type}`;
}

export function ProjectEditor({
  project,
  onCancel,
  onSave,
}: ProjectEditorProps) {
  const [value, setValue] = useState(() => createInitialValue(project));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] =
    useState<PendingEditorAction>(null);
  const isNewProject = project === null;
  const canPublish = isNewProject || !project.isPublished;

  const existingDetailMedia = useMemo(() => {
    if (!project) {
      return [];
    }

    const coverIndex = project.media.findIndex(
      (media) =>
        media.src === project.coverMedia.src &&
        media.type === project.coverMedia.type,
    );

    return project.media.filter((_, index) => index !== coverIndex);
  }, [project]);
  const visibleDetailMedia = existingDetailMedia.filter(
    (media) => !value.removedMediaSources.includes(media.src),
  );

  const requestCancel = useCallback(() => {
    setPendingAction("cancel");
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        if (pendingAction) {
          setPendingAction(null);
        } else {
          requestCancel();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, pendingAction, requestCancel]);

  function updateTag(index: number, tag: string) {
    setValue((current) => ({
      ...current,
      tags: current.tags.map((currentTag, currentIndex) =>
        currentIndex === index ? tag : currentTag,
      ),
    }));
  }

  function updateLink(index: number, link: ProjectLink) {
    setValue((current) => ({
      ...current,
      links: current.links.map((currentLink, currentIndex) =>
        currentIndex === index ? link : currentLink,
      ),
    }));
  }

  function handleCoverSelection(files: FileList | null) {
    const file = files?.[0] ?? null;

    if (!file) {
      return;
    }

    const validationError = validateFiles([file]);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setValue((current) => ({ ...current, coverFile: file }));
  }

  function handleMediaSelection(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const combinedFiles = [...value.mediaFiles];
    const existingFileIdentities = new Set(
      combinedFiles.map((file) => getFileIdentity(file)),
    );

    selectedFiles.forEach((file) => {
      const identity = getFileIdentity(file);

      if (!existingFileIdentities.has(identity)) {
        combinedFiles.push(file);
        existingFileIdentities.add(identity);
      }
    });

    const availableFileSlots = value.replaceMedia
      ? MAX_MEDIA_FILES
      : MAX_MEDIA_FILES - visibleDetailMedia.length;

    if (combinedFiles.length > availableFileSlots) {
      setError(
        `Max ${Math.max(0, availableFileSlots - value.mediaFiles.length)} detail-images left`,
      );
      return;
    }

    const validationError = validateFiles(selectedFiles);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setValue((current) => ({
      ...current,
      mediaFiles: combinedFiles,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitEvent = event.nativeEvent as SubmitEvent;
    const submitter = submitEvent.submitter as HTMLButtonElement | null;
    const publish = submitter?.dataset.intent === "publish";

    if (isNewProject && !value.coverFile) {
      setError("New project requires cover-image");
      return;
    }

    const finalDetailMediaCount = value.replaceMedia
      ? value.mediaFiles.length
      : visibleDetailMedia.length + value.mediaFiles.length;

    if (finalDetailMediaCount > MAX_MEDIA_FILES) {
      setError(
        `Max 10 detail-images allowed`,
      );
      return;
    }

    setPendingAction(publish ? "publish" : "save");
  }

  async function saveProject(publish: boolean) {
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave(value, publish);
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "Project couldn't be saved",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmPendingAction() {
    const action = pendingAction;
    setPendingAction(null);

    if (action === "cancel") {
      onCancel();
      return;
    }

    if (action === "save" || action === "publish") {
      void saveProject(action === "publish");
    }
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-editor-title"
      >
        <div className={styles.headingRow}>
          <div>
            <h2 id="project-editor-title" className={styles.title}>
              {isNewProject ? "Add new project" : `Edit ${project.title}`}
            </h2>
          </div>
          {!isNewProject && (
            <span className={styles.projectStatus}>
              {project.isPublished ? "published" : "draft"}
            </span>
          )}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <fieldset className={styles.section} disabled={isSubmitting}>
            <legend>Basic details</legend>
            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Title</span>
                <input
                  value={value.title}
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  maxLength={160}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Slug</span>
                <input
                  value={value.slug}
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      slug: event.target.value.toLowerCase(),
                    }))
                  }
                  maxLength={191}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="my-project"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Period</span>
                <input
                  value={value.period}
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      period: event.target.value,
                    }))
                  }
                  maxLength={120}
                  placeholder="2025 – 2026"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Sort order</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={value.sortOrder}
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                  required
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Short description</span>
              <textarea
                rows={3}
                value={value.shortDescription}
                onChange={(event) =>
                  setValue((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
                maxLength={2000}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Long description</span>
              <textarea
                rows={8}
                value={value.longDescription}
                onChange={(event) =>
                  setValue((current) => ({
                    ...current,
                    longDescription: event.target.value,
                  }))
                }
                maxLength={50000}
                required
              />
            </label>
          </fieldset>

          <fieldset className={styles.section} disabled={isSubmitting}>
            <legend>Tags</legend>
            <div className={styles.sectionAction}>
              <button
                className={styles.smallButton}
                type="button"
                onClick={() =>
                  setValue((current) => ({
                    ...current,
                    tags: [...current.tags, ""],
                  }))
                }
                disabled={value.tags.length >= 30}
              >
                add tag
              </button>
            </div>

            {value.tags.length === 0 && (
              <p className={styles.hint}>No tags added.</p>
            )}
            <div className={styles.rows}>
              {value.tags.map((tag, index) => (
                <div className={styles.reorderRow} key={`tag-${index}`}>
                  <input
                    aria-label={`Tag ${index + 1}`}
                    value={tag}
                    onChange={(event) => updateTag(index, event.target.value)}
                    maxLength={60}
                    required
                  />
                  <button
                    type="button"
                    aria-label="Nach oben"
                    onClick={() =>
                      setValue((current) => ({
                        ...current,
                        tags: moveItem(current.tags, index, -1),
                      }))
                    }
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Nach unten"
                    onClick={() =>
                      setValue((current) => ({
                        ...current,
                        tags: moveItem(current.tags, index, 1),
                      }))
                    }
                    disabled={index === value.tags.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setValue((current) => ({
                        ...current,
                        tags: current.tags.filter(
                          (_, currentIndex) => currentIndex !== index,
                        ),
                      }))
                    }
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.section} disabled={isSubmitting}>
            <legend>Links</legend>
            <div className={styles.sectionAction}>
              <button
                className={styles.smallButton}
                type="button"
                onClick={() =>
                  setValue((current) => ({
                    ...current,
                    links: [
                      ...current.links,
                      { type: "website", label: "", href: "" },
                    ],
                  }))
                }
                disabled={value.links.length >= 10}
              >
                add link
              </button>
            </div>

            {value.links.length === 0 && (
              <p className={styles.hint}>No links added.</p>
            )}
            <div className={styles.rows}>
              {value.links.map((link, index) => (
                <div className={styles.linkRow} key={`link-${index}`}>
                  <div className={styles.selectWrapper}>
                    <select
                      aria-label={`Link-Typ ${index + 1}`}
                      value={link.type}
                      onChange={(event) =>
                        updateLink(index, {
                          ...link,
                          type: event.target.value as ProjectLink["type"],
                        })
                      }
                    >
                      <option value="website">website</option>
                      <option value="github">github</option>
                      <option value="document">document</option>
                    </select>
                  </div>
                  <input
                    aria-label={`Link-Name ${index + 1}`}
                    value={link.label}
                    onChange={(event) =>
                      updateLink(index, { ...link, label: event.target.value })
                    }
                    maxLength={80}
                    placeholder="Label"
                    required
                  />
                  <input
                    aria-label={`Link-Adresse ${index + 1}`}
                    value={link.href}
                    onChange={(event) =>
                      updateLink(index, { ...link, href: event.target.value })
                    }
                    maxLength={2048}
                    pattern="(https?://|/).+"
                    placeholder="https://… or /path"
                    required
                  />
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      aria-label="Nach oben"
                      onClick={() =>
                        setValue((current) => ({
                          ...current,
                          links: moveItem(current.links, index, -1),
                        }))
                      }
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Nach unten"
                      onClick={() =>
                        setValue((current) => ({
                          ...current,
                          links: moveItem(current.links, index, 1),
                        }))
                      }
                      disabled={index === value.links.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setValue((current) => ({
                          ...current,
                          links: current.links.filter(
                            (_, currentIndex) => currentIndex !== index,
                          ),
                        }))
                      }
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.section} disabled={isSubmitting}>
            <legend>Media</legend>
            <div className={styles.mediaSection}>
              <div>
                <h3>Main image</h3>
                {project && (
                  <img
                    className={styles.currentCover}
                    src={getMediaUrl(project.coverMedia.src)}
                    alt={`Cover of ${project.title}`}
                  />
                )}
                <label className={styles.fileField}>
                  <span>
                    {isNewProject ? "Select main image" : "Replace main image"}
                  </span>
                  <input
                    type="file"
                    accept=".gif,.jpg,.jpeg,.png,.webp,image/gif,image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      handleCoverSelection(event.currentTarget.files)
                    }
                    required={isNewProject}
                  />
                </label>
                {value.coverFile && (
                  <div className={styles.selectedFile}>
                    <span>{value.coverFile.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setValue((current) => ({
                          ...current,
                          coverFile: null,
                        }))
                      }
                    >
                      remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h3>Detail images · max. 10</h3>
                {existingDetailMedia.length > 0 && (
                  <div className={styles.currentMedia}>
                    {visibleDetailMedia.map((media, index) => (
                      <div className={styles.mediaThumbnail} key={media.id}>
                        <img
                          src={getMediaUrl(media.src)}
                          alt={`Detail-image ${index + 1}`}
                        />
                        <button
                          type="button"
                          aria-label={`delete Detail-image ${index + 1}`}
                          title="Delete image"
                          onClick={() =>
                            setValue((current) => ({
                              ...current,
                              removedMediaSources: [
                                ...current.removedMediaSources,
                                media.src,
                              ],
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {value.removedMediaSources.length > 0 && (
                  <div className={styles.pendingDeletion}>
                    <span>
                      {value.removedMediaSources.length} image
                      {value.removedMediaSources.length === 1 ? "" : "s"} marked
                      for deletion
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setValue((current) => ({
                          ...current,
                          removedMediaSources: [],
                        }))
                      }
                    >
                      undo
                    </button>
                  </div>
                )}
                <label className={styles.fileField}>
                  <span>
                    {existingDetailMedia.length > 0
                      ? "Add detail images"
                      : "Select detail images"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".gif,.jpg,.jpeg,.png,.webp,image/gif,image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      handleMediaSelection(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <p className={styles.hint}>
                  JPEG, PNG, WebP or GIF · maximum 5 MB per file
                </p>

                {value.mediaFiles.length > 0 && (
                  <div className={styles.rows}>
                    {value.mediaFiles.map((file, index) => (
                      <div
                        className={styles.reorderRow}
                        key={`${file.name}-${file.lastModified}-${index}`}
                      >
                        <span className={styles.fileName}>{file.name}</span>
                        <button
                          type="button"
                          aria-label="Nach oben"
                          onClick={() =>
                            setValue((current) => ({
                              ...current,
                              mediaFiles: moveItem(
                                current.mediaFiles,
                                index,
                                -1,
                              ),
                            }))
                          }
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="Nach unten"
                          onClick={() =>
                            setValue((current) => ({
                              ...current,
                              mediaFiles: moveItem(
                                current.mediaFiles,
                                index,
                                1,
                              ),
                            }))
                          }
                          disabled={index === value.mediaFiles.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setValue((current) => {
                              const mediaFiles = current.mediaFiles.filter(
                                (_, currentIndex) => currentIndex !== index,
                              );

                              return {
                                ...current,
                                mediaFiles,
                              };
                            })
                          }
                        >
                          remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {project && existingDetailMedia.length > 0 && (
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={value.replaceMedia}
                      onChange={(event) =>
                        setValue((current) => ({
                          ...current,
                          replaceMedia: event.target.checked,
                        }))
                      }
                    />
                    Replace existing detail images instead of adding to them
                  </label>
                )}
              </div>
            </div>
          </fieldset>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.formActions}>
            <button
              className={styles.cancelButton}
              type="button"
              onClick={requestCancel}
              disabled={isSubmitting}
            >
              cancel
            </button>
            <button
              className={styles.secondarySave}
              type="submit"
              data-intent="save"
              disabled={isSubmitting}
            >
              {isSubmitting ? "saving..." : "save"}
            </button>
            {canPublish && (
              <button
                className={styles.publishButton}
                type="submit"
                data-intent="publish"
                disabled={isSubmitting}
              >
                {isSubmitting ? "saving..." : "save + publish"}
              </button>
            )}
          </div>
        </form>
      </section>

      {pendingAction && (
        <ConfirmDialog
          {...EDITOR_CONFIRMATIONS[pendingAction]}
          onConfirm={confirmPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
