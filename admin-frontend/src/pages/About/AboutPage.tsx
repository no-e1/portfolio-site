import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "../../api/api-client";
import {
  createAdminAbout,
  deleteAdminAbout,
  deleteAdminAboutBulletPoint,
  deleteAdminAboutSection,
  deleteAdminAboutTechnology,
  deleteAdminAboutTechnologyGroup,
  getAdminAbout,
  updateAdminAbout,
} from "../../api/admin-about.api";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import type {
  AdminAboutBulletPoint,
  AdminAboutContent,
  AdminAboutSection,
  AdminAboutTechnology,
  AdminAboutTechnologyGroup,
  SaveAdminAboutContent,
} from "../../types/about";
import styles from "./AboutPage.module.css";

type DeleteTarget =
  | { kind: "about" }
  | { kind: "section"; sectionIndex: number; section: AdminAboutSection }
  | {
      kind: "bulletPoint";
      sectionIndex: number;
      bulletPointIndex: number;
      section: AdminAboutSection;
      bulletPoint: AdminAboutBulletPoint;
    }
  | {
      kind: "technologyGroup";
      technologyGroupIndex: number;
      technologyGroup: AdminAboutTechnologyGroup;
    }
  | {
      kind: "technology";
      technologyGroupIndex: number;
      technologyIndex: number;
      technology: AdminAboutTechnology;
    };

const EMPTY_VALUE: AdminAboutContent = {
  id: null,
  sections: [],
  technologyGroups: [],
};

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

function toApiValue(value: AdminAboutContent): SaveAdminAboutContent {
  return {
    sections: value.sections.map((section) => ({
      heading: section.heading.trim(),
      body: section.body.trim(),
      bulletPoints: section.bulletPoints.map((bulletPoint) => ({
        heading: bulletPoint.heading.trim(),
        body: bulletPoint.body.trim(),
      })),
    })),
    technologyGroups: value.technologyGroups.map((technologyGroup) => ({
      heading: technologyGroup.heading.trim(),
      technologies: technologyGroup.technologies.map((technology) => ({
        name: technology.name.trim(),
        context: technology.context.trim(),
        description: technology.description.trim(),
      })),
    })),
  };
}

function getDeleteDialog(target: DeleteTarget): {
  title: string;
  message: string;
  confirmLabel: string;
} {
  switch (target.kind) {
    case "about":
      return {
        title: "Delete all About content?",
        message:
          "All About sections, bullet points and technologies will be permanently deleted.",
        confirmLabel: "delete all content",
      };
    case "section":
      return {
        title: "Delete section?",
        message: `${target.section.heading || "This section"} and all its bullet points will be permanently deleted.`,
        confirmLabel: "delete section",
      };
    case "bulletPoint":
      return {
        title: "Delete bullet point?",
        message: `${target.bulletPoint.heading || "This bullet point"} will be permanently deleted.`,
        confirmLabel: "delete bullet point",
      };
    case "technologyGroup":
      return {
        title: "Delete technology group?",
        message: `${target.technologyGroup.heading || "This technology group"} and all its technologies will be permanently deleted.`,
        confirmLabel: "delete group",
      };
    case "technology":
      return {
        title: "Delete technology?",
        message: `${target.technology.name || "This technology"} will be permanently deleted.`,
        confirmLabel: "delete technology",
      };
  }
}

export function AboutPage() {
  const [value, setValue] = useState<AdminAboutContent>(EMPTY_VALUE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const isBusy = isSaving || isDeleting;

  useEffect(() => {
    const abortController = new AbortController();

    async function loadAbout() {
      setIsLoading(true);
      setLoadError(false);

      try {
        setValue(await getAdminAbout(abortController.signal));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError(true);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadAbout();
    return () => abortController.abort();
  }, [requestVersion]);

  function markChanged() {
    setSaved(false);
    setActionError(null);
  }

  function updateSection(index: number, section: AdminAboutSection) {
    setValue((current) => ({
      ...current,
      sections: current.sections.map((currentSection, currentIndex) =>
        currentIndex === index ? section : currentSection,
      ),
    }));
    markChanged();
  }

  function updateTechnologyGroup(
    index: number,
    technologyGroup: AdminAboutTechnologyGroup,
  ) {
    setValue((current) => ({
      ...current,
      technologyGroups: current.technologyGroups.map(
        (currentTechnologyGroup, currentIndex) =>
          currentIndex === index ? technologyGroup : currentTechnologyGroup,
      ),
    }));
    markChanged();
  }

  function updateTechnology(
    technologyGroupIndex: number,
    technologyIndex: number,
    technology: AdminAboutTechnology,
  ) {
    setValue((current) => ({
      ...current,
      technologyGroups: current.technologyGroups.map(
        (technologyGroup, currentTechnologyGroupIndex) =>
          currentTechnologyGroupIndex === technologyGroupIndex
            ? {
                ...technologyGroup,
                technologies: technologyGroup.technologies.map(
                  (currentTechnology, currentTechnologyIndex) =>
                    currentTechnologyIndex === technologyIndex
                      ? technology
                      : currentTechnology,
                ),
              }
            : technologyGroup,
      ),
    }));
    markChanged();
  }

  function moveTechnologyToGroup(
    sourceGroupIndex: number,
    technologyIndex: number,
    targetGroupIndex: number,
  ) {
    if (sourceGroupIndex === targetGroupIndex) {
      return;
    }

    setValue((current) => {
      const technology =
        current.technologyGroups[sourceGroupIndex]?.technologies[
          technologyIndex
        ];

      if (!technology || !current.technologyGroups[targetGroupIndex]) {
        return current;
      }

      return {
        ...current,
        technologyGroups: current.technologyGroups.map(
          (technologyGroup, groupIndex) => {
            if (groupIndex === sourceGroupIndex) {
              return {
                ...technologyGroup,
                technologies: technologyGroup.technologies.filter(
                  (_, index) => index !== technologyIndex,
                ),
              };
            }

            if (groupIndex === targetGroupIndex) {
              return {
                ...technologyGroup,
                technologies: [...technologyGroup.technologies, technology],
              };
            }

            return technologyGroup;
          },
        ),
      };
    });
    markChanged();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmSave(true);
  }

  async function handleSave() {
    setConfirmSave(false);
    setActionError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const payload = toApiValue(value);
      const savedContent =
        value.id === null
          ? await createAdminAbout(payload)
          : await updateAdminAbout(payload);
      setValue(savedContent);
      setSaved(true);
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "About content could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    setDeleteTarget(null);
    setActionError(null);
    setSaved(false);
    setIsDeleting(true);

    try {
      switch (target.kind) {
        case "about":
          if (value.id !== null) {
            await deleteAdminAbout();
          }
          setValue(EMPTY_VALUE);
          break;
        case "section":
          if (target.section.id !== undefined) {
            await deleteAdminAboutSection(target.section.id);
          }
          setValue((current) => ({
            ...current,
            sections: current.sections.filter(
              (_, index) => index !== target.sectionIndex,
            ),
          }));
          break;
        case "bulletPoint":
          if (
            target.section.id !== undefined &&
            target.bulletPoint.id !== undefined
          ) {
            await deleteAdminAboutBulletPoint(
              target.section.id,
              target.bulletPoint.id,
            );
          }
          setValue((current) => ({
            ...current,
            sections: current.sections.map((section, sectionIndex) =>
              sectionIndex === target.sectionIndex
                ? {
                    ...section,
                    bulletPoints: section.bulletPoints.filter(
                      (_, bulletPointIndex) =>
                        bulletPointIndex !== target.bulletPointIndex,
                    ),
                  }
                : section,
            ),
          }));
          break;
        case "technologyGroup":
          if (target.technologyGroup.id !== undefined) {
            await deleteAdminAboutTechnologyGroup(target.technologyGroup.id);
          }
          setValue((current) => ({
            ...current,
            technologyGroups: current.technologyGroups.filter(
              (_, index) => index !== target.technologyGroupIndex,
            ),
          }));
          break;
        case "technology":
          if (target.technology.id !== undefined) {
            await deleteAdminAboutTechnology(target.technology.id);
          }
          setValue((current) => ({
            ...current,
            technologyGroups: current.technologyGroups.map(
              (technologyGroup, technologyGroupIndex) =>
                technologyGroupIndex === target.technologyGroupIndex
                  ? {
                      ...technologyGroup,
                      technologies: technologyGroup.technologies.filter(
                        (_, index) => index !== target.technologyIndex,
                      ),
                    }
                  : technologyGroup,
            ),
          }));
          break;
      }
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "The selected About content could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const deleteDialog = deleteTarget ? getDeleteDialog(deleteTarget) : null;
  const technologyCount = value.technologyGroups.reduce(
    (count, technologyGroup) => count + technologyGroup.technologies.length,
    0,
  );

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>About me</h1>
          <p>Manage profile sections, bullet points and technologies.</p>
        </div>
      </header>

      {isLoading && <p className={styles.status}>Content is loading...</p>}

      {loadError && (
        <div className={styles.status}>
          <p role="alert">About content could not be loaded.</p>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => setRequestVersion((version) => version + 1)}
          >
            try again
          </button>
        </div>
      )}

      {!isLoading && !loadError && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.editorHeader}>
            <div>
              <h2>Sections</h2>
              <p>Each section can contain up to three bullet points.</p>
            </div>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                setValue((current) => ({
                  ...current,
                  sections: [
                    ...current.sections,
                    { heading: "", body: "", bulletPoints: [] },
                  ],
                }));
                markChanged();
              }}
              disabled={isBusy || value.sections.length >= 30}
            >
              add section
            </button>
          </div>

          {value.sections.length === 0 && (
            <p className={styles.empty}>No sections added.</p>
          )}

          <div className={styles.sectionList}>
            {value.sections.map((section, sectionIndex) => (
              <fieldset className={styles.sectionCard} key={section.id ?? sectionIndex}>
                <legend>Section {sectionIndex + 1}</legend>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue((current) => ({
                        ...current,
                        sections: moveItem(current.sections, sectionIndex, -1),
                      }));
                      markChanged();
                    }}
                    disabled={isBusy || sectionIndex === 0}
                    aria-label={`Move section ${sectionIndex + 1} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue((current) => ({
                        ...current,
                        sections: moveItem(current.sections, sectionIndex, 1),
                      }));
                      markChanged();
                    }}
                    disabled={
                      isBusy || sectionIndex === value.sections.length - 1
                    }
                    aria-label={`Move section ${sectionIndex + 1} down`}
                  >
                    ↓
                  </button>
                  <button
                    className={styles.dangerButton}
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        kind: "section",
                        sectionIndex,
                        section,
                      })
                    }
                    disabled={isBusy}
                  >
                    delete section
                  </button>
                </div>

                <label className={styles.field}>
                  <span>Heading</span>
                  <input
                    value={section.heading}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        ...section,
                        heading: event.target.value,
                      })
                    }
                    maxLength={160}
                    disabled={isBusy}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Body</span>
                  <textarea
                    rows={6}
                    value={section.body}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        ...section,
                        body: event.target.value,
                      })
                    }
                    maxLength={50000}
                    disabled={isBusy}
                    required
                  />
                </label>

                <div className={styles.nestedHeader}>
                  <div>
                    <h3>Bullet points</h3>
                    <p>{section.bulletPoints.length} of 3</p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() =>
                      updateSection(sectionIndex, {
                        ...section,
                        bulletPoints: [
                          ...section.bulletPoints,
                          { heading: "", body: "" },
                        ],
                      })
                    }
                    disabled={isBusy || section.bulletPoints.length >= 3}
                  >
                    add bullet point
                  </button>
                </div>

                {section.bulletPoints.length === 0 && (
                  <p className={styles.empty}>No bullet points added.</p>
                )}

                <div className={styles.bulletPointList}>
                  {section.bulletPoints.map((bulletPoint, bulletPointIndex) => (
                    <fieldset
                      className={styles.nestedCard}
                      key={bulletPoint.id ?? bulletPointIndex}
                    >
                      <legend>Bullet point {bulletPointIndex + 1}</legend>
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          onClick={() =>
                            updateSection(sectionIndex, {
                              ...section,
                              bulletPoints: moveItem(
                                section.bulletPoints,
                                bulletPointIndex,
                                -1,
                              ),
                            })
                          }
                          disabled={isBusy || bulletPointIndex === 0}
                          aria-label={`Move bullet point ${bulletPointIndex + 1} up`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSection(sectionIndex, {
                              ...section,
                              bulletPoints: moveItem(
                                section.bulletPoints,
                                bulletPointIndex,
                                1,
                              ),
                            })
                          }
                          disabled={
                            isBusy ||
                            bulletPointIndex === section.bulletPoints.length - 1
                          }
                          aria-label={`Move bullet point ${bulletPointIndex + 1} down`}
                        >
                          ↓
                        </button>
                        <button
                          className={styles.dangerButton}
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "bulletPoint",
                              sectionIndex,
                              bulletPointIndex,
                              section,
                              bulletPoint,
                            })
                          }
                          disabled={isBusy}
                        >
                          delete
                        </button>
                      </div>

                      <label className={styles.field}>
                        <span>Heading</span>
                        <input
                          value={bulletPoint.heading}
                          onChange={(event) =>
                            updateSection(sectionIndex, {
                              ...section,
                              bulletPoints: section.bulletPoints.map(
                                (currentBulletPoint, index) =>
                                  index === bulletPointIndex
                                    ? {
                                        ...currentBulletPoint,
                                        heading: event.target.value,
                                      }
                                    : currentBulletPoint,
                              ),
                            })
                          }
                          maxLength={160}
                          disabled={isBusy}
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span>Content</span>
                        <textarea
                          rows={4}
                          value={bulletPoint.body}
                          onChange={(event) =>
                            updateSection(sectionIndex, {
                              ...section,
                              bulletPoints: section.bulletPoints.map(
                                (currentBulletPoint, index) =>
                                  index === bulletPointIndex
                                    ? {
                                        ...currentBulletPoint,
                                        body: event.target.value,
                                      }
                                    : currentBulletPoint,
                              ),
                            })
                          }
                          maxLength={10000}
                          disabled={isBusy}
                          required
                        />
                      </label>
                    </fieldset>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <div className={styles.editorHeader}>
            <div>
              <h2>Skills / technologies</h2>
              <p>Group related technologies under an editable subheading.</p>
            </div>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                setValue((current) => ({
                  ...current,
                  technologyGroups: [
                    ...current.technologyGroups,
                    { heading: "", technologies: [] },
                  ],
                }));
                markChanged();
              }}
              disabled={isBusy || value.technologyGroups.length >= 30}
            >
              add group
            </button>
          </div>

          {value.technologyGroups.length === 0 && (
            <p className={styles.empty}>No technology groups added.</p>
          )}

          <div className={styles.technologyGroupList}>
            {value.technologyGroups.map(
              (technologyGroup, technologyGroupIndex) => (
                <fieldset
                  className={styles.technologyGroupCard}
                  key={technologyGroup.id ?? technologyGroupIndex}
                >
                <legend>
                  Group {String(technologyGroupIndex + 1).padStart(2, "0")}
                </legend>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue((current) => ({
                        ...current,
                        technologyGroups: moveItem(
                          current.technologyGroups,
                          technologyGroupIndex,
                          -1,
                        ),
                      }));
                      markChanged();
                    }}
                    disabled={isBusy || technologyGroupIndex === 0}
                    aria-label={`Move technology group ${technologyGroupIndex + 1} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue((current) => ({
                        ...current,
                        technologyGroups: moveItem(
                          current.technologyGroups,
                          technologyGroupIndex,
                          1,
                        ),
                      }));
                      markChanged();
                    }}
                    disabled={
                      isBusy ||
                      technologyGroupIndex === value.technologyGroups.length - 1
                    }
                    aria-label={`Move technology group ${technologyGroupIndex + 1} down`}
                  >
                    ↓
                  </button>
                  <button
                    className={styles.dangerButton}
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        kind: "technologyGroup",
                        technologyGroupIndex,
                        technologyGroup,
                      })
                    }
                    disabled={isBusy}
                  >
                    delete group
                  </button>
                </div>

                <label className={styles.field}>
                  <span>Subheading</span>
                  <input
                    value={technologyGroup.heading}
                    onChange={(event) =>
                      updateTechnologyGroup(technologyGroupIndex, {
                        ...technologyGroup,
                        heading: event.target.value,
                      })
                    }
                    maxLength={160}
                    placeholder="Frontend / Web"
                    disabled={isBusy}
                    required
                  />
                </label>

                <div className={styles.nestedHeader}>
                  <div>
                    <h3>Technologies</h3>
                    <p>{technologyGroup.technologies.length} in this group</p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() =>
                      updateTechnologyGroup(technologyGroupIndex, {
                        ...technologyGroup,
                        technologies: [
                          ...technologyGroup.technologies,
                          { name: "", context: "", description: "" },
                        ],
                      })
                    }
                    disabled={isBusy || technologyCount >= 100}
                  >
                    add technology
                  </button>
                </div>

                {technologyGroup.technologies.length === 0 && (
                  <p className={styles.empty}>No technologies in this group.</p>
                )}

                <div className={styles.technologyList}>
                  {technologyGroup.technologies.map(
                    (technology, technologyIndex) => (
                      <fieldset
                        className={styles.technologyCard}
                        key={technology.id ?? technologyIndex}
                      >
                        <legend>
                          Technology{" "}
                          {String(technologyIndex + 1).padStart(2, "0")}
                        </legend>

                        <div className={styles.cardActions}>
                          <button
                            type="button"
                            onClick={() =>
                              updateTechnologyGroup(technologyGroupIndex, {
                                ...technologyGroup,
                                technologies: moveItem(
                                  technologyGroup.technologies,
                                  technologyIndex,
                                  -1,
                                ),
                              })
                            }
                            disabled={isBusy || technologyIndex === 0}
                            aria-label={`Move technology ${technologyIndex + 1} up`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateTechnologyGroup(technologyGroupIndex, {
                                ...technologyGroup,
                                technologies: moveItem(
                                  technologyGroup.technologies,
                                  technologyIndex,
                                  1,
                                ),
                              })
                            }
                            disabled={
                              isBusy ||
                              technologyIndex ===
                                technologyGroup.technologies.length - 1
                            }
                            aria-label={`Move technology ${technologyIndex + 1} down`}
                          >
                            ↓
                          </button>
                          <button
                            className={styles.dangerButton}
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                kind: "technology",
                                technologyGroupIndex,
                                technologyIndex,
                                technology,
                              })
                            }
                            disabled={isBusy}
                          >
                            delete technology
                          </button>
                        </div>

                        <div className={styles.technologyFields}>
                          <label className={styles.field}>
                            <span>Name</span>
                            <input
                              value={technology.name}
                              onChange={(event) =>
                                updateTechnology(
                                  technologyGroupIndex,
                                  technologyIndex,
                                  { ...technology, name: event.target.value },
                                )
                              }
                              maxLength={160}
                              disabled={isBusy}
                              required
                            />
                          </label>

                          <label className={styles.field}>
                            <span>Context</span>
                            <input
                              value={technology.context}
                              onChange={(event) =>
                                updateTechnology(
                                  technologyGroupIndex,
                                  technologyIndex,
                                  {
                                    ...technology,
                                    context: event.target.value,
                                  },
                                )
                              }
                              maxLength={160}
                              placeholder="2026 · Frontend"
                              disabled={isBusy}
                              required
                            />
                          </label>

                          <label className={styles.field}>
                            <span>Group</span>
                            <select
                              value={technologyGroupIndex}
                              onChange={(event) =>
                                moveTechnologyToGroup(
                                  technologyGroupIndex,
                                  technologyIndex,
                                  Number(event.target.value),
                                )
                              }
                              disabled={
                                isBusy || value.technologyGroups.length < 2
                              }
                            >
                              {value.technologyGroups.map(
                                (groupOption, groupOptionIndex) => (
                                  <option
                                    key={groupOption.id ?? groupOptionIndex}
                                    value={groupOptionIndex}
                                  >
                                    {groupOption.heading ||
                                      `Group ${groupOptionIndex + 1}`}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        </div>

                        <label className={styles.field}>
                          <span>Description</span>
                          <textarea
                            rows={5}
                            value={technology.description}
                            onChange={(event) =>
                              updateTechnology(
                                technologyGroupIndex,
                                technologyIndex,
                                {
                                  ...technology,
                                  description: event.target.value,
                                },
                              )
                            }
                            maxLength={50000}
                            disabled={isBusy}
                            required
                          />
                        </label>
                      </fieldset>
                    ),
                  )}
                </div>
                </fieldset>
              ),
            )}
          </div>

          {actionError && (
            <p className={styles.error} role="alert">
              {actionError}
            </p>
          )}
          {saved && (
            <p className={styles.success} role="status">
              About content was saved.
            </p>
          )}

          <div className={styles.formActions}>
            {value.id !== null && (
              <button
                className={styles.dangerButton}
                type="button"
                onClick={() => setDeleteTarget({ kind: "about" })}
                disabled={isBusy}
              >
                delete all content
              </button>
            )}
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isBusy}
            >
              {isSaving ? "saving..." : "save about content"}
            </button>
          </div>
        </form>
      )}

      {confirmSave && (
        <ConfirmDialog
          title="Save About content?"
          message="The protected About page will use this content immediately."
          confirmLabel="save content"
          onConfirm={() => void handleSave()}
          onCancel={() => setConfirmSave(false)}
        />
      )}

      {deleteTarget && deleteDialog && (
        <ConfirmDialog
          title={deleteDialog.title}
          message={deleteDialog.message}
          confirmLabel={deleteDialog.confirmLabel}
          tone="danger"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}
