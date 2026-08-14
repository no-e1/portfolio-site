import { useEffect, useState } from "react";
import {
  downloadAllDocuments,
  downloadDocument,
  getDocumentForViewing,
  getDocuments,
  type ProtectedDocument,
} from "../../api/docs.api";
import { ApiError } from "../../api/api-client";
import { clearAuthSession, getAccessToken } from "../../auth/auth-session";
import styles from "./DocumentsContent.module.css";

type DocumentsContentProps = {
  onUnauthorized: () => void;
};

const CERTIFICATE_TYPES: ProtectedDocument["type"][] = [
  "gibbCertificate",
  "bwdCertificate",
  "secondarySchoolCertificate",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function saveBlob(blob: Blob, fileName: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}

export function DocumentsContent({
  onUnauthorized,
}: DocumentsContentProps) {
  const [documents, setDocuments] = useState<ProtectedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      onUnauthorized();
      return;
    }

    const authenticatedAccessToken = accessToken;
    const abortController = new AbortController();

    async function loadDocuments() {
      setIsLoading(true);
      setLoadError(null);

      try {
        setDocuments(
          await getDocuments(
            authenticatedAccessToken,
            abortController.signal,
          ),
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          onUnauthorized();
          return;
        }

        setLoadError("Die Dokumente konnten nicht geladen werden.");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();
    return () => abortController.abort();
  }, [onUnauthorized, requestVersion]);

  function getCurrentAccessToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      onUnauthorized();
      return null;
    }

    return accessToken;
  }

  function handleActionError(error: unknown, fallbackMessage: string): void {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      onUnauthorized();
      return;
    }

    setActionError(
      error instanceof ApiError ? error.message : fallbackMessage,
    );
  }

  async function handleView(document: ProtectedDocument) {
    const accessToken = getCurrentAccessToken();

    if (!accessToken) {
      return;
    }

    const previewWindow = window.open("about:blank", "_blank");
    setActionError(null);
    setBusyAction(`view-${document.id}`);

    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = document.title;
      previewWindow.document.body.textContent = "PDF wird geladen...";
    }

    try {
      const pdf = await getDocumentForViewing(document, accessToken);
      const pdfUrl = URL.createObjectURL(pdf);

      if (previewWindow) {
        previewWindow.location.replace(pdfUrl);
      } else {
        saveBlob(pdf, document.originalName);
        URL.revokeObjectURL(pdfUrl);
      }

      if (previewWindow) {
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 10 * 60_000);
      }
    } catch (error) {
      previewWindow?.close();
      handleActionError(error, `${document.title} konnte nicht geöffnet werden.`);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownload(document: ProtectedDocument) {
    const accessToken = getCurrentAccessToken();

    if (!accessToken) {
      return;
    }

    setActionError(null);
    setBusyAction(`download-${document.id}`);

    try {
      saveBlob(
        await downloadDocument(document, accessToken),
        document.originalName,
      );
    } catch (error) {
      handleActionError(
        error,
        `${document.title} konnte nicht heruntergeladen werden.`,
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownloadAll() {
    const accessToken = getCurrentAccessToken();

    if (!accessToken) {
      return;
    }

    setActionError(null);
    setBusyAction("download-all");

    try {
      saveBlob(
        await downloadAllDocuments(accessToken),
        "documents-noel-kohn.zip",
      );
    } catch (error) {
      handleActionError(
        error,
        "Die Dokumente konnten nicht heruntergeladen werden.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function renderDocumentList(items: ProtectedDocument[]) {
    return (
      <div className={styles.documentList}>
        {items.map((document) => {
          const isViewing = busyAction === `view-${document.id}`;
          const isDownloading = busyAction === `download-${document.id}`;

          return (
            <article className={styles.documentCard} key={document.id}>
              <div className={styles.pdfBadge} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M6.75 2.75h7l4.5 4.5v14H6.75z" />
                  <path d="M13.75 2.75v4.5h4.5" />
                </svg>
                <span>PDF</span>
              </div>

              <div className={styles.documentDetails}>
                <h3>{document.title}</h3>
                <p>{document.originalName}</p>
                <div className={styles.metadata}>
                  <span>{formatFileSize(document.size)}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => void handleView(document)}
                  disabled={busyAction !== null}
                >
                  {isViewing ? "wird geöffnet..." : "öffnen"}
                </button>
                <button
                  className={styles.downloadButton}
                  type="button"
                  onClick={() => void handleDownload(document)}
                  disabled={busyAction !== null}
                  aria-label={`${document.title} herunterladen`}
                  title="PDF herunterladen"
                >
                  {isDownloading ? (
                    <span className={styles.loadingDots} aria-hidden="true">
                      ...
                    </span>
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12 3v12" />
                      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
                      <path d="M5 20h14" />
                    </svg>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  if (isLoading) {
    return <p className={styles.status}>Dokumente werden geladen...</p>;
  }

  if (loadError) {
    return (
      <div className={styles.status}>
        <p role="alert">{loadError}</p>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => setRequestVersion((version) => version + 1)}
        >
          erneut versuchen
        </button>
      </div>
    );
  }

  const certificateDocuments = CERTIFICATE_TYPES.flatMap((type) =>
    documents.filter((document) => document.type === type),
  );
  const curriculumVitaeDocuments = documents.filter(
    (document) => document.type === "curriculumVitae",
  );
  const competenceRecords = documents
    .filter((document) => document.type === "uekCompetenceRecord")
    .sort((first, second) => first.id - second.id);
  const firstDocumentGroup = curriculumVitaeDocuments.length > 0
    ? "curriculumVitae"
    : certificateDocuments.length > 0
      ? "certificates"
      : competenceRecords.length > 0
        ? "competenceRecords"
        : null;

  function renderGroupHeader(
    title: string,
    group: "curriculumVitae" | "certificates" | "competenceRecords",
  ) {
    return (
      <div className={styles.documentGroupHeader}>
        <h2>{title}</h2>
        {firstDocumentGroup === group && (
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => void handleDownloadAll()}
            disabled={busyAction !== null}
          >
            {busyAction === "download-all"
              ? "ZIP wird erstellt..."
              : "alle herunterladen"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.content}>
      {actionError && (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      )}

      {documents.length === 0 ? (
        <p className={styles.empty}>Keine Dokumente vorhanden.</p>
      ) : (
        <div className={styles.documentGroups}>
          {curriculumVitaeDocuments.length > 0 && (
            <section className={styles.documentGroup}>
              {renderGroupHeader("Lebenslauf", "curriculumVitae")}
              {renderDocumentList(curriculumVitaeDocuments)}
            </section>
          )}

          {certificateDocuments.length > 0 && (
            <section className={styles.documentGroup}>
              {renderGroupHeader("Zeugnisse", "certificates")}
              {renderDocumentList(certificateDocuments)}
            </section>
          )}

          {competenceRecords.length > 0 && (
            <section className={styles.documentGroup}>
              {renderGroupHeader("UEK-Kompetenznachweise", "competenceRecords")}
              {renderDocumentList(competenceRecords)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
