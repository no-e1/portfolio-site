import { Fragment, useEffect, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  setAdminUserActive,
  updateAdminUser,
} from "../../api/admin-users.api";
import { ConfirmDialog } from "../../components/ConfirmDialog/ConfirmDialog";
import {
  UserEditor,
  type UserEditorMode,
} from "../../components/Users/UserEditor";
import type { ManagedUser, UserEditorValue } from "../../types/user";
import styles from "./UsersPage.module.css";

type EditorState = {
  mode: UserEditorMode;
  user: ManagedUser | null;
};

function sortUsers(users: ManagedUser[]): ManagedUser[] {
  return [...users].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() -
        new Date(second.createdAt).getTime() || first.id - second.id,
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingStatusUser, setPendingStatusUser] =
    useState<ManagedUser | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] =
    useState<ManagedUser | null>(null);
  const [openActionsUserId, setOpenActionsUserId] = useState<number | null>(
    null,
  );
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadUsers() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const loadedUsers = await getAdminUsers(abortController.signal);
        setUsers(sortUsers(loadedUsers));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError("Users could not be loaded.");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();
    return () => abortController.abort();
  }, [requestVersion]);

  function replaceUser(savedUser: ManagedUser) {
    setUsers((currentUsers) =>
      sortUsers([
        ...currentUsers.filter((user) => user.id !== savedUser.id),
        savedUser,
      ]),
    );
  }

  async function handleSave(value: UserEditorValue) {
    let savedUser: ManagedUser;

    if (editor?.mode === "create") {
      if (value.username === undefined || value.password === undefined) {
        return;
      }

      savedUser = await createAdminUser(value.username, value.password);
    } else {
      if (!editor?.user) {
        return;
      }

      savedUser = await updateAdminUser(editor.user.id, value);
    }

    replaceUser(savedUser);
    setEditor(null);
  }

  async function handleStatusChange(user: ManagedUser) {
    setActionError(null);
    setBusyUserId(user.id);

    try {
      replaceUser(await setAdminUserActive(user.id, !user.isActive));
    } catch {
      setActionError(
        `${user.username} could not be ${user.isActive ? "deactivated" : "activated"}.`,
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDelete(user: ManagedUser) {
    setActionError(null);
    setBusyUserId(user.id);

    try {
      await deleteAdminUser(user.id);
      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== user.id),
      );
    } catch {
      setActionError(`${user.username} could not be deleted.`);
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Users</h1>
          <p>{users.length} registered users</p>
        </div>
        <button
          className={styles.addButton}
          type="button"
          onClick={() => setEditor({ mode: "create", user: null })}
        >
          add user
        </button>
      </div>

      {actionError && (
        <p className={styles.error} role="alert">
          {actionError}
        </p>
      )}

      {isLoading && <p className={styles.status}>Users are loading...</p>}

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

      {!isLoading && !loadError && users.length === 0 && (
        <p className={styles.empty}>No users have been created yet.</p>
      )}

      {!loadError && users.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Active</th>
                <th className={styles.loginCount} scope="col">
                  Logins
                </th>
                <th scope="col">Created</th>
                <th scope="col">Updated</th>
                <th className={styles.actionsHeading} scope="col">
                  <span className={styles.visuallyHidden}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isBusy = busyUserId === user.id;

                const actionsAreOpen = openActionsUserId === user.id;

                return (
                  <Fragment key={user.id}>
                    <tr>
                      <td className={styles.username} data-label="Username">
                        {user.username}
                      </td>
                      <td data-label="Active">
                        <span
                          className={`${styles.statusBadge} ${
                            user.isActive ? styles.active : styles.inactive
                          }`}
                        >
                          {user.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className={styles.loginCount} data-label="Logins">
                        {user.loginCount}
                      </td>
                      <td className={styles.date} data-label="Created">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className={styles.date} data-label="Updated">
                        {formatDate(user.updatedAt)}
                      </td>
                      <td className={styles.menuCell}>
                        <button
                          className={styles.menuButton}
                          type="button"
                          aria-label={`Actions for ${user.username}`}
                          aria-expanded={actionsAreOpen}
                          aria-controls={`user-actions-${user.id}`}
                          onClick={() =>
                            setOpenActionsUserId((currentId) =>
                              currentId === user.id ? null : user.id,
                            )
                          }
                          disabled={isBusy}
                        >
                          <span aria-hidden="true">⋯</span>
                        </button>
                      </td>
                    </tr>
                    {actionsAreOpen && (
                      <tr className={styles.actionsRow}>
                        <td colSpan={6}>
                          <div
                            id={`user-actions-${user.id}`}
                            className={styles.rowActions}
                          >
                            <span className={styles.actionsLabel}>
                              Actions for {user.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionsUserId(null);
                                setEditor({ mode: "username", user });
                              }}
                              disabled={isBusy}
                            >
                              change username
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionsUserId(null);
                                setEditor({ mode: "password", user });
                              }}
                              disabled={isBusy}
                            >
                              change password
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionsUserId(null);
                                setPendingStatusUser(user);
                              }}
                              disabled={isBusy}
                            >
                              {isBusy
                                ? "working..."
                                : user.isActive
                                  ? "deactivate"
                                  : "activate"}
                            </button>
                            <button
                              className={styles.deleteButton}
                              type="button"
                              onClick={() => {
                                setOpenActionsUserId(null);
                                setPendingDeleteUser(user);
                              }}
                              disabled={isBusy}
                            >
                              delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editor && (
        <UserEditor
          key={`${editor.mode}-${editor.user?.id ?? "new"}`}
          mode={editor.mode}
          user={editor.user}
          onCancel={() => setEditor(null)}
          onSave={handleSave}
        />
      )}

      {pendingStatusUser && (
        <ConfirmDialog
          title={
            pendingStatusUser.isActive ? "Deactivate user?" : "Activate user?"
          }
          message={
            pendingStatusUser.isActive
              ? `${pendingStatusUser.username} will no longer be able to log in.`
              : `${pendingStatusUser.username} will be able to log in again.`
          }
          confirmLabel={pendingStatusUser.isActive ? "deactivate" : "activate"}
          tone={pendingStatusUser.isActive ? "danger" : "default"}
          onConfirm={() => {
            const user = pendingStatusUser;
            setPendingStatusUser(null);
            void handleStatusChange(user);
          }}
          onCancel={() => setPendingStatusUser(null)}
        />
      )}

      {pendingDeleteUser && (
        <ConfirmDialog
          title="Delete user?"
          message={`${pendingDeleteUser.username} will be permanently deleted.`}
          confirmLabel="delete user"
          tone="danger"
          onConfirm={() => {
            const user = pendingDeleteUser;
            setPendingDeleteUser(null);
            void handleDelete(user);
          }}
          onCancel={() => setPendingDeleteUser(null)}
        />
      )}
    </section>
  );
}
