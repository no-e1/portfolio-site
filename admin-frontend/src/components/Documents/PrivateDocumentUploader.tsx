import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/api-client";
import {
  PRIVATE_DOCUMENT_TYPES,
  PRIVATE_DOCUMENT_TYPE_LABELS,
  type PrivateDocumentType,
} from "../../types/private-document";
import styles from "./PrivateDocumentUploader.module.css";

type PrivateDocumentUploaderProps = {
  unavailableTypes: PrivateDocumentType[];
  onUpload: (
    type: PrivateDocumentType,
    title: string,
    document: File,
  ) => Promise<void>;
  onCancel: () => void;
};

const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024;

export function PrivateDocumentUploader({
  unavailableTypes,
  onUpload,
  onCancel,
}: PrivateDocumentUploaderProps) {
  const [type, setType] = useState<PrivateDocumentType>(
    () =>
      PRIVATE_DOCUMENT_TYPES.find(
        (documentType) => !unavailableTypes.includes(documentType),
      ) ?? "uekCompetenceRecord",
  );
  const [title, setTitle] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!document) {
      setError("Select a PDF document.");
      return;
    }

    if (document.size > MAX_PDF_FILE_SIZE) {
      setError("The PDF must not exceed 10 MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      await onUpload(type, normalizedTitle, document);
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : "The private document could not be uploaded.",
      );
      setIsUploading(false);
    }
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !isUploading) {
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="private-document-upload-title"
      >
        <div className={styles.heading}>
          <h2 id="private-document-upload-title">Add private document</h2>
          <p>The heading is stored in MariaDB and shown on the portfolio.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Document type</span>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as PrivateDocumentType)
              }
              disabled={isUploading}
              autoFocus
              required
            >
              {PRIVATE_DOCUMENT_TYPES.map((documentType) => (
                <option
                  value={documentType}
                  disabled={unavailableTypes.includes(documentType)}
                  key={documentType}
                >
                  {PRIVATE_DOCUMENT_TYPE_LABELS[documentType]}
                  {unavailableTypes.includes(documentType)
                    ? " (already uploaded)"
                    : ""}
                </option>
              ))}
            </select>
            <small>
              Certificates can only be uploaded once. UEK competence records
              are unlimited.
            </small>
          </label>

          <label className={styles.field}>
            <span>Heading</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              disabled={isUploading}
              required
            />
          </label>

          <label className={styles.field}>
            <span>PDF document</span>
            <input
              className={styles.fileInput}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                setDocument(event.target.files?.[0] ?? null);
                setError(null);
              }}
              disabled={isUploading}
              required
            />
            <small>PDF only, max 10 MB.</small>
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              type="button"
              onClick={onCancel}
              disabled={isUploading}
            >
              cancel
            </button>
            <button
              className={styles.uploadButton}
              type="submit"
              disabled={isUploading}
            >
              {isUploading ? "uploading..." : "upload document"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
