import { useEffect, useRef, useState } from 'react'
import { API_URL } from './api/tasks.js'
import Notice from './components/Notice.jsx'
import TaskColumn from './components/TaskColumn.jsx'
import TaskForm from './components/TaskForm.jsx'
import { NOTICE_MS, STATUSES } from './constants.js'
import { useTasks } from './hooks/useTasks.js'

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

  async function handleCreate(payload) {
    try {
      await createTask(payload)
      setNotice({ type: 'success', text: 'Task added' })
    } catch (error) {
      // Field errors are shown by the form itself; anything else goes to the notice
      const isFieldError =
        error.status === 422 && Object.keys(error.fieldErrors).some((field) => field in payload)
      if (!isFieldError) showError(error)
      throw error
    }
  }

  async function handleUpdate(id, patch) {
    try {
      await updateTask(id, patch)
    } catch (error) {
      showError(error)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id)
    } catch (error) {
      showError(error)
    }
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-6">
        <header>
          <h1 className="text-2xl font-semibold">Simple Task Tracker</h1>
        </header>

        <TaskForm onCreate={handleCreate} />

        {notice && (
          <Notice type={notice.type} text={notice.text} onDismiss={() => setNotice(null)} />
        )}

        <main aria-busy={loadState === 'loading'}>
          {loadState === 'loading' && <p className="text-sm text-muted">Loading tasks…</p>}

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
                className="mt-4 min-h-10 rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {loadState === 'ready' && (
            <div className="grid gap-4 md:grid-cols-3">
              {STATUSES.map((status) => (
                <TaskColumn
                  key={status}
                  status={status}
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
