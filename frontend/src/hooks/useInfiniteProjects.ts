import { useCallback, useEffect, useRef, useState } from "react";
import { getProjectsPage } from "../api/projects.api";
import type { Project } from "../types/project";

export function useInfiniteProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [offset, setOffset] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProjects() {
      setIsLoading(true);
      setError(null);

      try {
        const page = await getProjectsPage(offset, abortController.signal);

        setProjects((currentProjects) => [
          ...currentProjects,
          ...page.items,
        ]);
        setNextOffset(page.nextOffset);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return;
        }

        setError("Projekte konnten nicht geladen werden.");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => abortController.abort();
  }, [offset, requestVersion]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || isLoading || nextOffset === null || error) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setIsLoading(true);
          setOffset(nextOffset);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [error, isLoading, nextOffset]);

  const retry = useCallback(() => {
    setRequestVersion((currentVersion) => currentVersion + 1);
  }, []);

  return {
    projects,
    loadMoreRef,
    isLoading,
    error,
    hasMore: nextOffset !== null,
    retry,
  };
}
