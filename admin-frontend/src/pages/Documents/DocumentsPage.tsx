import { useEffect, useState } from "react";
import {
  deletePrivateDocument,
  getPrivateDocumentFile,
  getPrivateDocuments,
  uploadPrivateDocument,
} from "../../api/admin-private-documents.api";
import { ApiError } from "../../api/api-client";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import { PrivateDocumentUploader } from "../../components/Documents/PrivateDocumentUploader";
import type { PrivateDocument } from "../../types/private-document";
import styles from "./DocumentsPage.module.css";

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<PrivateDocument[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [pendingDelete, setPendingDelete] =
    useState<PrivateDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadDocuments() {
      setIsLoading(true);
      setLoadError(null);

      try {
        setDocuments(await getPrivateDocuments(abortController.signal));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError("Private documents could not be loaded.");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();
    return () => abortController.abort();
  }, [requestVersion]);

  async function handleUpload(title: string, document: File) {
    const uploadedDocument = await uploadPrivateDocument(title, document);
    setDocuments((currentDocuments) => [
      uploadedDocument,
      ...currentDocuments,
    ]);
    setShowUploader(false);
  }

  async function handleOpen(document: PrivateDocument) {
    const previewWindow = window.open("about:blank", "_blank");
    setActionError(null);
    setOpeningId(document.id);

    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = document.title;
      previewWindow.document.body.textContent = "PDF is loading...";
    }

    try {
      const pdf = await getPrivateDocumentFile(document.id);
      const pdfUrl = URL.createObjectURL(pdf);

      if (previewWindow) {
        previewWindow.location.replace(pdfUrl);
      } else {
        const link = window.document.createElement("a");
        link.href = pdfUrl;
        link.download = document.originalName;
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
    } catch (error) {
      previewWindow?.close();
      setActionError(
        error instanceof ApiError
          ? error.message
          : `${document.title} could not be opened.`,
      );
    } finally {
      setOpeningId(null);
    }
  }

  async function handleDelete(document: PrivateDocument) {
    setActionError(null);
    setDeletingId(document.id);

    try {
      await deletePrivateDocument(document.id);
      setDocuments((currentDocuments) =>
        currentDocuments.filter(
          (currentDocument) => currentDocument.id !== document.id,
        ),
      );
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : `${document.title} could not be deleted.`,
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Documents</h1>
          <p>{documents.length} private documents</p>
        </div>
        <button
          className={styles.addButton}
          type="button"
          onClick={() => setShowUploader(true)}
        >
          add document
        </button>
      </div>

      {actionError && (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      )}

      {isLoading && <p className={styles.status}>Documents are loading...</p>}

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

      {!isLoading && !loadError && documents.length === 0 && (
        <p className={styles.empty}>No private documents uploaded yet.</p>
      )}

      {!loadError && documents.length > 0 && (
        <div className={styles.documentList}>
          {documents.map((document) => {
            const isOpening = openingId === document.id;
            const isDeleting = deletingId === document.id;

            return (
              <article className={styles.documentCard} key={document.id}>
                <div className={styles.documentDetails}>
                  <h2>{document.title}</h2>
                  <p className={styles.fileName}>{document.originalName}</p>
                  <p className={styles.metadata}>
                    <span>{formatFileSize(document.size)}</span>
                    <span>{dateFormatter.format(new Date(document.createdAt))}</span>
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() => void handleOpen(document)}
                    disabled={isOpening || isDeleting}
                  >
                    {isOpening ? "opening..." : "open PDF"}
                  </button>
                  <button
                    className={styles.deleteButton}
                    type="button"
                    onClick={() => setPendingDelete(document)}
                    disabled={isOpening || isDeleting}
                  >
                    {isDeleting ? "deleting..." : "delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showUploader && (
        <PrivateDocumentUploader
          onUpload={handleUpload}
          onCancel={() => setShowUploader(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete private document?"
          message={`${pendingDelete.title} and its PDF file will be permanently deleted.`}
          confirmLabel="delete document"
          tone="danger"
          onConfirm={() => {
            const document = pendingDelete;
            setPendingDelete(null);
            void handleDelete(document);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}
