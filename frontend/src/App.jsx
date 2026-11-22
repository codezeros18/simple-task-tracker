import { useEffect, useRef, useState } from 'react'
import { API_URL, describeError } from './api/tasks.js'
import Notice from './components/Notice.jsx'
import TaskColumn from './components/TaskColumn.jsx'
import TaskForm from './components/TaskForm.jsx'
import { NOTICE_MAX, NOTICE_MS, STATUSES } from './constants.js'
import { useTasks } from './hooks/useTasks.js'

const [TODO, IN_PROGRESS, DONE] = STATUSES

export default function App() {
  const { tasks, loadState, loadError, pendingIds, reload, createTask, updateTask, deleteTask } =
    useTasks()
  const [notices, setNotices] = useState([]) // [{ id, type: "success" | "error", text }], oldest first
  const [dialog, setDialog] = useState(null) // null (closed) | { status } to add | { task } to edit
  const retryRef = useRef(null)
  const nextNoticeId = useRef(0)
  const openerRef = useRef(null) // the button that opened the dialog, so focus can go back to it

  useEffect(() => {
    if (loadState === 'error') retryRef.current?.focus()
  }, [loadState])

  const removeNotice = (id) => setNotices((prev) => prev.filter((item) => item.id !== id))

  // New notices stack below the older ones (at most NOTICE_MAX). Each success fades on its own
  // timer; errors stay until dismissed.
  function notify(type, text) {
    const id = nextNoticeId.current++
    setNotices((prev) => [...prev, { id, type, text }].slice(-NOTICE_MAX))
    if (type === 'success') setTimeout(() => removeNotice(id), NOTICE_MS)
  }

  const showError = (error) => notify('error', describeError(error))

  // A 422 about a field the user just sent is shown next to that field, not in the notice
  const isFieldError = (error, payload) =>
    error.status === 422 && Object.keys(error.fieldErrors).some((field) => field in payload)

  // Errors are shown inside the dialog (the form decides how); on success it closes itself
  async function handleCreate(payload) {
    await createTask(payload)
    notify('success', 'Task added')
  }

  async function handleEdit(id, patch) {
    try {
      await updateTask(id, patch)
      notify('success', 'Task saved')
    } catch (error) {
      // Deleted somewhere else: useTasks already dropped it from the board, so close and say so
      if (error.status === 404) showError(error)
      else throw error
    }
  }

  // Status changes from a card. Resolves to true when the update was saved.
  async function handleUpdate(id, patch) {
    try {
      await updateTask(id, patch)
      notify('success', `Moved to ${patch.status}`)
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
      notify('success', 'Task deleted')
      return true
    } catch (error) {
      showError(error)
      return error.status === 404
    }
  }

  const count = (status) => tasks.filter((task) => task.status === status).length

  function openDialog(next) {
    openerRef.current = document.activeElement
    setDialog(next)
  }

  function closeDialog() {
    setDialog(null)
    openerRef.current?.focus()
  }

  return (
    // Padding (not margin) around the panel: a child's top margin would collapse into this wrapper
    <div className="min-h-screen bg-page text-ink md:py-6">
      <div className="mx-auto max-w-6xl border-y border-line bg-surface shadow-sm md:rounded-2xl md:border-x">
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-5 md:px-6">
          <h1 className="text-xl font-medium text-ink">Simple Task Tracker</h1>
          <div className="flex items-center gap-4">
            {loadState === 'ready' && (
              <p className="hidden text-sm text-muted sm:block">
                {count(TODO)} to do · {count(IN_PROGRESS)} in progress · {count(DONE)} done
              </p>
            )}
            <button
              type="button"
              onClick={() => openDialog({ status: TODO })}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-accent pr-5 pl-4 text-sm font-medium text-white shadow-sm hover:bg-accent-hover hover:shadow-md active:bg-accent-hover motion-safe:transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
                <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
              </svg>
              New task
            </button>
          </div>
        </header>

        {/* Floats over the page (top right), so the board never shifts when a notice appears */}
        {notices.length > 0 && !dialog && (
          <div className="pointer-events-none fixed top-3 right-3 left-3 z-50 flex flex-col gap-2 sm:left-auto sm:w-96">
            {notices.map((item) => (
              <div key={item.id} className="pointer-events-auto">
                <Notice type={item.type} text={item.text} onDismiss={() => removeNotice(item.id)} />
              </div>
            ))}
          </div>
        )}

        <main aria-busy={loadState === 'loading'} className="p-4 md:p-6">
          {loadState === 'loading' && <p className="sr-only">Loading tasks…</p>}

          {loadState === 'error' && (
            <div className="rounded-xl border border-line p-8 text-center">
              {loadError?.status === 0 ? (
                <>
                  <p className="font-medium">Can't reach the server.</p>
                  <p className="mt-1 text-sm text-muted">
                    Make sure the backend is running on {API_URL}.
                  </p>
                </>
              ) : (
                <p className="font-medium">{describeError(loadError)}</p>
              )}
              <button
                type="button"
                ref={retryRef}
                onClick={reload}
                className="mt-4 h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover motion-safe:transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {loadState !== 'error' && (
            <div className="grid items-start gap-6 md:grid-cols-3">
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
                  onEdit={(task) => openDialog({ task })}
                  onAdd={(status) => openDialog({ status })}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {dialog && (
        <TaskForm
          task={dialog.task}
          initialStatus={dialog.status}
          onSubmit={dialog.task ? (patch) => handleEdit(dialog.task.id, patch) : handleCreate}
          onClose={closeDialog}
        />
      )}
    </div>
  )
}
