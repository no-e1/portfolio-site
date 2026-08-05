import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "../../api/api-client";
import { getAdminAbout, saveAdminAbout } from "../../api/admin-about.api";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import type { AdminAboutContent } from "../../types/about";
import styles from "./AboutPage.module.css";

type AboutSectionValue = {
  heading: string;
  body: string;
  technologies: string[];
};

type AboutEditorValue = {
  intro: string;
  sections: AboutSectionValue[];
};

const EMPTY_VALUE: AboutEditorValue = {
  intro: "",
  sections: [],
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

function toEditorValue(content: AdminAboutContent): AboutEditorValue {
  return {
    intro: content.intro,
    sections: content.sections.map((section) => ({
      heading: section.heading,
      body: section.body,
      technologies: section.technologies ?? [],
    })),
  };
}

function toApiValue(value: AboutEditorValue): AdminAboutContent {
  return {
    intro: value.intro.trim(),
    sections: value.sections.map((section) => ({
      heading: section.heading.trim(),
      body: section.body.trim(),
      technologies: section.technologies
        .map((technology) => technology.trim())
        .filter(Boolean),
    })),
  };
}

export function AboutPage() {
  const [value, setValue] = useState<AboutEditorValue>(EMPTY_VALUE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadAbout() {
      setIsLoading(true);
      setLoadError(false);

      try {
        const content = await getAdminAbout(abortController.signal);
        setValue(toEditorValue(content));
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

  function updateSection(index: number, section: AboutSectionValue) {
    setValue((current) => ({
      ...current,
      sections: current.sections.map((currentSection, currentIndex) =>
        currentIndex === index ? section : currentSection,
      ),
    }));
    setSaved(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmSave(true);
  }

  async function handleSave() {
    setConfirmSave(false);
    setSaveError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const savedContent = await saveAdminAbout(toApiValue(value));
      setValue(toEditorValue(savedContent));
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "About content could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>About me</h1>
          <p>Manage the protected content shown after user login.</p>
        </div>
      </div>

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
          <label className={styles.field}>
            <span>Intro</span>
            <textarea
              rows={7}
              value={value.intro}
              onChange={(event) => {
                setValue((current) => ({
                  ...current,
                  intro: event.target.value,
                }));
                setSaved(false);
              }}
              maxLength={10000}
              disabled={isSaving}
              required
            />
          </label>

          <div className={styles.sectionsHeader}>
            <h2>Sections</h2>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                setValue((current) => ({
                  ...current,
                  sections: [
                    ...current.sections,
                    { heading: "", body: "", technologies: [] },
                  ],
                }));
                setSaved(false);
              }}
              disabled={isSaving || value.sections.length >= 30}
            >
              add section
            </button>
          </div>

          <div className={styles.sectionList}>
            {value.sections.map((section, sectionIndex) => (
              <fieldset className={styles.sectionCard} key={sectionIndex}>
                <legend>Section {sectionIndex + 1}</legend>

                <div className={styles.sectionActions}>
                  <button
                    type="button"
                    onClick={() =>
                      setValue((current) => ({
                        ...current,
                        sections: moveItem(
                          current.sections,
                          sectionIndex,
                          -1,
                        ),
                      }))
                    }
                    disabled={isSaving || sectionIndex === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setValue((current) => ({
                        ...current,
                        sections: moveItem(
                          current.sections,
                          sectionIndex,
                          1,
                        ),
                      }))
                    }
                    disabled={
                      isSaving || sectionIndex === value.sections.length - 1
                    }
                  >
                    ↓
                  </button>
                  <button
                    className={styles.dangerButton}
                    type="button"
                    onClick={() => {
                      setValue((current) => ({
                        ...current,
                        sections: current.sections.filter(
                          (_, index) => index !== sectionIndex,
                        ),
                      }));
                      setSaved(false);
                    }}
                    disabled={isSaving}
                  >
                    remove section
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
                    disabled={isSaving}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Body</span>
                  <textarea
                    rows={7}
                    value={section.body}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        ...section,
                        body: event.target.value,
                      })
                    }
                    maxLength={50000}
                    disabled={isSaving}
                    required
                  />
                </label>

                <div className={styles.technologiesHeader}>
                  <div>
                    <h3>Technologies</h3>
                    <p>Optional</p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() =>
                      updateSection(sectionIndex, {
                        ...section,
                        technologies: [...section.technologies, ""],
                      })
                    }
                    disabled={
                      isSaving || section.technologies.length >= 100
                    }
                  >
                    add technology
                  </button>
                </div>

                {section.technologies.length === 0 && (
                  <p className={styles.empty}>No technologies added.</p>
                )}

                <div className={styles.technologyList}>
                  {section.technologies.map((technology, technologyIndex) => (
                    <div
                      className={styles.technologyRow}
                      key={technologyIndex}
                    >
                      <input
                        aria-label={`Technology ${technologyIndex + 1}`}
                        value={technology}
                        onChange={(event) =>
                          updateSection(sectionIndex, {
                            ...section,
                            technologies: section.technologies.map(
                              (currentTechnology, index) =>
                                index === technologyIndex
                                  ? event.target.value
                                  : currentTechnology,
                            ),
                          })
                        }
                        maxLength={100}
                        disabled={isSaving}
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateSection(sectionIndex, {
                            ...section,
                            technologies: moveItem(
                              section.technologies,
                              technologyIndex,
                              -1,
                            ),
                          })
                        }
                        disabled={isSaving || technologyIndex === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSection(sectionIndex, {
                            ...section,
                            technologies: moveItem(
                              section.technologies,
                              technologyIndex,
                              1,
                            ),
                          })
                        }
                        disabled={
                          isSaving ||
                          technologyIndex === section.technologies.length - 1
                        }
                      >
                        ↓
                      </button>
                      <button
                        className={styles.dangerButton}
                        type="button"
                        onClick={() =>
                          updateSection(sectionIndex, {
                            ...section,
                            technologies: section.technologies.filter(
                              (_, index) => index !== technologyIndex,
                            ),
                          })
                        }
                        disabled={isSaving}
                      >
                        remove
                      </button>
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {saveError && (
            <p className={styles.error} role="alert">
              {saveError}
            </p>
          )}
          {saved && (
            <p className={styles.success} role="status">
              About content was saved.
            </p>
          )}

          <div className={styles.formActions}>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "saving..." : "save about content"}
            </button>
          </div>
        </form>
      )}

      {confirmSave && (
        <ConfirmDialog
          title="Save about content?"
          message="The protected About page will use this content immediately."
          confirmLabel="save content"
          onConfirm={() => void handleSave()}
          onCancel={() => setConfirmSave(false)}
        />
      )}
    </section>
  );
}
