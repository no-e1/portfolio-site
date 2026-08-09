import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createAdminHobbySection,
  deleteAdminHobbySection,
  getAdminHobbies,
  getAdminHobbyImage,
  reorderAdminHobbySections,
  saveAdminHobbyPage,
  updateAdminHobbySection,
} from "../../api/admin-hobbies.api";
import { ApiError } from "../../api/api-client";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import type { AdminHobbySection } from "../../types/hobby";
import styles from "./HobbiesPage.module.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type EditorSection = {
  key: string;
  id: number | null;
  title: string;
  description: string;
  tags: string;
  imageFile: File | null;
  imageOriginalName: string | null;
};

type DeleteTarget = {
  section: EditorSection;
};

let nextDraftId = 0;

function createDraftSection(): EditorSection {
  nextDraftId += 1;

  return {
    key: `draft-${nextDraftId}`,
    id: null,
    title: "",
    description: "",
    tags: "",
    imageFile: null,
    imageOriginalName: null,
  };
}

function toEditorSection(section: AdminHobbySection): EditorSection {
  return {
    key: `saved-${section.id}`,
    id: section.id,
    title: section.title,
    description: section.description,
    tags: section.tags.join(", "),
    imageFile: null,
    imageOriginalName: section.imageOriginalName,
  };
}

function parseTags(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
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

type HobbyImagePreviewProps = {
  sectionId: number | null;
  imageFile: File | null;
  title: string;
};

function HobbyImagePreview({
  sectionId,
  imageFile,
  title,
}: HobbyImagePreviewProps) {
  const [remoteImage, setRemoteImage] = useState<{
    sectionId: number;
    url: string | null;
    hasError: boolean;
  } | null>(null);
  const localImageUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (localImageUrl) {
        URL.revokeObjectURL(localImageUrl);
      }
    };
  }, [localImageUrl]);

  useEffect(() => {
    if (sectionId === null) {
      return;
    }

    const abortController = new AbortController();
    let objectUrl: string | null = null;

    getAdminHobbyImage(sectionId, abortController.signal)
      .then((image) => {
        objectUrl = URL.createObjectURL(image);
        setRemoteImage({ sectionId, url: objectUrl, hasError: false });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setRemoteImage({ sectionId, url: null, hasError: true });
      });

    return () => {
      abortController.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sectionId]);

  const currentRemoteImage =
    remoteImage?.sectionId === sectionId ? remoteImage : null;
  const imageUrl = localImageUrl ?? currentRemoteImage?.url ?? null;

  if (!localImageUrl && currentRemoteImage?.hasError) {
    return <p className={styles.imageStatus}>Image could not be loaded.</p>;
  }

  if (!imageUrl) {
    return <p className={styles.imageStatus}>Select an image.</p>;
  }

  return <img src={imageUrl} alt={title || "Hobby preview"} />;
}

export function HobbiesPage() {
  const [introduction, setIntroduction] = useState("");
  const [sections, setSections] = useState<EditorSection[]>([]);
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

    async function loadHobbies() {
      setIsLoading(true);
      setLoadError(false);

      try {
        const content = await getAdminHobbies(abortController.signal);
        setIntroduction(content.introduction);
        setSections(content.sections.map(toEditorSection));
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

    void loadHobbies();
    return () => abortController.abort();
  }, [requestVersion]);

  function markChanged() {
    setSaved(false);
    setActionError(null);
  }

  function updateSection(key: string, changes: Partial<EditorSection>) {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.key === key ? { ...section, ...changes } : section,
      ),
    );
    markChanged();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missingImage = sections.some(
      (section) => section.id === null && section.imageFile === null,
    );

    if (missingImage) {
      setActionError("Every new hobby requires an image.");
      return;
    }

    setConfirmSave(true);
  }

  async function handleSave() {
    setConfirmSave(false);
    setActionError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      await saveAdminHobbyPage(introduction);
      const savedSections: AdminHobbySection[] = [];

      for (const section of sections) {
        const payload = {
          title: section.title,
          description: section.description,
          tags: parseTags(section.tags),
          image: section.imageFile ?? undefined,
        };

        savedSections.push(
          section.id === null
            ? await createAdminHobbySection(payload)
            : await updateAdminHobbySection(section.id, payload),
        );
      }

      const content = await reorderAdminHobbySections(
        savedSections.map((section) => section.id),
      );
      setIntroduction(content.introduction);
      setSections(content.sections.map(toEditorSection));
      setSaved(true);
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Hobby content could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const section = deleteTarget.section;
    setDeleteTarget(null);
    setActionError(null);
    setSaved(false);
    setIsDeleting(true);

    try {
      if (section.id !== null) {
        await deleteAdminHobbySection(section.id);
      }

      setSections((currentSections) =>
        currentSections.filter(
          (currentSection) => currentSection.key !== section.key,
        ),
      );
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "The hobby section could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Hobbies</h1>
        </div>
        <button
          className={styles.addButton}
          type="button"
          onClick={() => {
            setSections((currentSections) => [
              ...currentSections,
              createDraftSection(),
            ]);
            markChanged();
          }}
          disabled={isBusy || sections.length >= 100}
        >
          add hobby
        </button>
      </div>

      {isLoading && <p className={styles.status}>Content is loading...</p>}

      {loadError && (
        <div className={styles.status}>
          <p role="alert">Hobby content could not be loaded.</p>
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
          <label className={styles.introductionField}>
            <span>Introduction</span>
            <textarea
              rows={4}
              value={introduction}
              onChange={(event) => {
                setIntroduction(event.target.value);
                markChanged();
              }}
              maxLength={5000}
              disabled={isBusy}
            />
          </label>

          {sections.length === 0 && (
            <p className={styles.empty}>No hobby sections added.</p>
          )}

          <div className={styles.sectionList}>
            {sections.map((section, sectionIndex) => (
              <fieldset className={styles.sectionCard} key={section.key}>
                <legend>Hobby {String(sectionIndex + 1).padStart(2, "0")}</legend>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setSections((currentSections) =>
                        moveItem(currentSections, sectionIndex, -1),
                      );
                      markChanged();
                    }}
                    disabled={isBusy || sectionIndex === 0}
                    aria-label={`Move hobby ${sectionIndex + 1} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSections((currentSections) =>
                        moveItem(currentSections, sectionIndex, 1),
                      );
                      markChanged();
                    }}
                    disabled={isBusy || sectionIndex === sections.length - 1}
                    aria-label={`Move hobby ${sectionIndex + 1} down`}
                  >
                    ↓
                  </button>
                  <button
                    className={styles.dangerButton}
                    type="button"
                    onClick={() => setDeleteTarget({ section })}
                    disabled={isBusy}
                  >
                    delete hobby
                  </button>
                </div>

                <div className={styles.sectionEditor}>
                  <div>
                    <div className={styles.imagePreview}>
                      <HobbyImagePreview
                        sectionId={section.id}
                        imageFile={section.imageFile}
                        title={section.title}
                      />
                    </div>
                    <label className={styles.fileField}>
                      <span>{section.id === null ? "Image" : "Replace image"}</span>
                      <input
                        type="file"
                        accept="image/gif,image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const image = event.target.files?.[0] ?? null;

                          if (
                            image &&
                            (!ACCEPTED_IMAGE_TYPES.has(image.type) ||
                              image.size > MAX_IMAGE_SIZE)
                          ) {
                            event.target.value = "";
                            setActionError(
                              "Images must be GIF, JPEG, PNG or WebP and no larger than 5 MB.",
                            );
                            return;
                          }

                          updateSection(section.key, { imageFile: image });
                        }}
                        disabled={isBusy}
                        required={section.id === null}
                      />
                      <small>
                        {section.imageFile?.name ??
                          section.imageOriginalName ??
                          "GIF, JPEG, PNG or WebP, max 5 MB"}
                      </small>
                    </label>
                  </div>

                  <div className={styles.fields}>
                    <label className={styles.field}>
                      <span>Title</span>
                      <input
                        value={section.title}
                        onChange={(event) =>
                          updateSection(section.key, {
                            title: event.target.value,
                          })
                        }
                        maxLength={160}
                        disabled={isBusy}
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Description</span>
                      <textarea
                        rows={6}
                        value={section.description}
                        onChange={(event) =>
                          updateSection(section.key, {
                            description: event.target.value,
                          })
                        }
                        maxLength={50000}
                        disabled={isBusy}
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Tags</span>
                      <input
                        value={section.tags}
                        onChange={(event) =>
                          updateSection(section.key, {
                            tags: event.target.value,
                          })
                        }
                        placeholder="C++, ESP32, PowerShell"
                        disabled={isBusy}
                      />
                      <small>Separate tags with commas.</small>
                    </label>
                  </div>
                </div>
              </fieldset>
            ))}
          </div>

          {actionError && (
            <p className={styles.error} role="alert">
              {actionError}
            </p>
          )}
          {saved && (
            <p className={styles.success} role="status">
              Hobby content was saved.
            </p>
          )}

          <div className={styles.formActions}>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isBusy}
            >
              {isSaving ? "saving..." : "save hobby content"}
            </button>
          </div>
        </form>
      )}

      {confirmSave && (
        <ConfirmDialog
          title="Save hobby content?"
          message="The protected hobby page will use this content and order immediately."
          confirmLabel="save content"
          onConfirm={() => void handleSave()}
          onCancel={() => setConfirmSave(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete hobby section?"
          message={`${deleteTarget.section.title || "This hobby"} and its private image will be permanently deleted.`}
          confirmLabel="delete hobby"
          tone="danger"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}
