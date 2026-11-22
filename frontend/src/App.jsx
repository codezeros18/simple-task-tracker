import { useEffect, useRef, useState } from 'react'
import { API_URL } from './api/tasks.js'
import Notice from './components/Notice.jsx'
import TaskColumn from './components/TaskColumn.jsx'
import TaskForm from './components/TaskForm.jsx'
import { NOTICE_MS, STATUSES } from './constants.js'
import { useTasks } from './hooks/useTasks.js'

const [TODO, IN_PROGRESS, DONE] = STATUSES

function errorText(error) {
  if (error.status === 503) return 'Database unavailable. Try again in a moment.'
  if (error.status === 404) return 'This task no longer exists'
  return error.message
}

export default function App() {
  const { tasks, loadState, loadError, pendingIds, reload, createTask, updateTask, deleteTask } =
    useTasks()
  const [notice, setNotice] = useState(null) // { type: "success" | "error", text } | null
  const retryRef = useRef(null)

  // Success messages fade on their own; errors stay until dismissed or replaced
  useEffect(() => {
    if (notice?.type !== 'success') return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (loadState === 'error') retryRef.current?.focus()
  }, [loadState])

  const showError = (error) => setNotice({ type: 'error', text: errorText(error) })

  // A 422 about a field the user just sent is shown next to that field, not in the notice
  const isFieldError = (error, payload) =>
    error.status === 422 && Object.keys(error.fieldErrors).some((field) => field in payload)

  async function handleCreate(payload) {
    try {
      await createTask(payload)
      setNotice({ type: 'success', text: 'Task added' })
    } catch (error) {
      if (!isFieldError(error, payload)) showError(error)
      throw error
    }
  }

  // Resolves to true when the update was saved
  async function handleUpdate(id, patch) {
    try {
      await updateTask(id, patch)
      return true
    } catch (error) {
      if (isFieldError(error, patch)) throw error
      showError(error)
      return false
    }
  }

  // Resolves to true when the task is gone from the board (deleted now, or already deleted elsewhere)
  async function handleDelete(id) {
    try {
      await deleteTask(id)
      return true
    } catch (error) {
      showError(error)
      return error.status === 404
    }
  }

  const count = (status) => tasks.filter((task) => task.status === status).length

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold">Simple Task Tracker</h1>
          {loadState === 'ready' && (
            <p className="text-sm text-muted">
              {count(TODO)} to do · {count(IN_PROGRESS)} in progress · {count(DONE)} done
            </p>
          )}
        </header>

        <TaskForm onCreate={handleCreate} />

        {notice && (
          <Notice type={notice.type} text={notice.text} onDismiss={() => setNotice(null)} />
        )}

        <main aria-busy={loadState === 'loading'}>
          {loadState === 'loading' && <p className="sr-only">Loading tasks…</p>}

          {loadState === 'error' && (
            <div className="rounded-lg border border-line bg-surface p-6 text-center">
              {loadError?.status === 0 ? (
                <>
                  <p className="font-medium">Can't reach the server.</p>
                  <p className="mt-1 text-sm text-muted">
                    Make sure the backend is running on {API_URL}.
                  </p>
                </>
              ) : (
                <p className="font-medium">{errorText(loadError)}</p>
              )}
              <button
                type="button"
                ref={retryRef}
                onClick={reload}
                className="mt-4 min-h-10 rounded-md bg-accent px-4 text-sm font-medium text-white motion-safe:transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {loadState !== 'error' && (
            <div className="grid gap-4 md:grid-cols-3">
              {STATUSES.map((status) => (
                <TaskColumn
                  key={status}
                  status={status}
                  loading={loadState === 'loading'}
                  tasks={tasks.filter((task) => task.status === status)}
                  isBoardEmpty={tasks.length === 0}
                  pendingIds={pendingIds}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
