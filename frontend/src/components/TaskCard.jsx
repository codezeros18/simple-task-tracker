import { useEffect, useRef, useState } from 'react'
import { DESC_MAX, STATUSES, TITLE_MAX } from '../constants.js'

const [TODO, IN_PROGRESS, DONE] = STATUSES
const BADGE_CLASS = {
  [TODO]: 'bg-todo-bg text-todo-ink',
  [IN_PROGRESS]: 'bg-progress-bg text-progress-ink',
  [DONE]: 'bg-done-bg text-done-ink',
}

// Browser locale and time zone; the server always sends UTC
const updatedFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const buttonClass =
  'inline-flex min-h-10 items-center gap-1 rounded-md px-3 text-sm font-medium motion-safe:transition-colors disabled:opacity-60'
const fieldClass =
  'min-h-10 w-full rounded-md border border-field bg-surface px-3 py-2 text-sm text-ink aria-invalid:border-danger'

export default function TaskCard({ task, busy, onUpdate, onDelete }) {
  const [mode, setMode] = useState('view') // "view" | "edit" | "confirmDelete"
  const [draft, setDraft] = useState({ title: '', description: '' })
  const [error, setError] = useState(null)
  const editButtonRef = useRef(null)
  const deleteButtonRef = useRef(null)
  const previousMode = useRef(mode)
  const errorId = `task-${task.id}-error`

  // Back in view mode, return focus to the button that opened edit / delete
  useEffect(() => {
    if (mode === 'view' && previousMode.current === 'edit') editButtonRef.current?.focus()
    if (mode === 'view' && previousMode.current === 'confirmDelete') deleteButtonRef.current?.focus()
    previousMode.current = mode
  }, [mode])

  // Resolves to true on success. Validation errors from the server are shown inside the card.
  async function save(patch) {
    setError(null)
    try {
      return await onUpdate(task.id, patch)
    } catch (saveError) {
      setError(Object.values(saveError.fieldErrors)[0] ?? saveError.message)
      return false
    }
  }

  function startEdit() {
    setDraft({ title: task.title, description: task.description })
    setError(null)
    setMode('edit')
  }

  function cancel() {
    setError(null)
    setMode('view')
  }

  async function submitEdit(event) {
    event.preventDefault()
    if (!draft.title.trim()) {
      setError('Title is required.')
      return
    }
    if (await save(draft)) setMode('view')
  }

  async function confirmDelete() {
    await onDelete(task.id)
    // Only visible if the delete failed and the card is still on screen
    setMode('view')
  }

  const cancelOnEscape = (event) => event.key === 'Escape' && cancel()

  return (
    <article
      aria-busy={busy}
      className={`rounded-lg border border-line bg-surface p-3 shadow-sm ${busy ? 'opacity-60' : ''}`}
    >
      {mode === 'edit' ? (
        <form onSubmit={submitEdit} onKeyDown={cancelOnEscape} noValidate className="flex flex-col gap-2">
          <label htmlFor={`task-${task.id}-title`} className="text-xs font-medium text-muted">
            Title
          </label>
          <input
            id={`task-${task.id}-title`}
            autoFocus
            value={draft.title}
            maxLength={TITLE_MAX}
            onChange={(event) => {
              setDraft({ ...draft, title: event.target.value })
              setError(null)
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={fieldClass}
          />
          <label htmlFor={`task-${task.id}-description`} className="text-xs font-medium text-muted">
            Description
          </label>
          <textarea
            id={`task-${task.id}-description`}
            rows={2}
            value={draft.description}
            maxLength={DESC_MAX}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            className={fieldClass}
          />
          {error && (
            <p id={errorId} className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={`${buttonClass} bg-accent text-white`}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={cancel}
              className={`${buttonClass} border border-field text-ink`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium break-words">{task.title}</h3>
            {/* Colour is never the only signal: the badge always shows the status text */}
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASS[task.status]}`}
            >
              {task.status}
            </span>
          </div>

          {task.description && (
            <p className="mt-1 text-sm break-words whitespace-pre-line text-muted">
              {task.description}
            </p>
          )}

          <p className="mt-2 text-xs text-muted">
            Updated{' '}
            <time dateTime={task.updated_at}>{updatedFormat.format(new Date(task.updated_at))}</time>
          </p>

          {error && (
            <p id={errorId} className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor={`task-${task.id}-status`} className="sr-only">
              Change status of {task.title}
            </label>
            {/* Controlled by task.status: on failure the list is unchanged, so the select snaps back */}
            <span className="select-wrap">
              <select
                id={`task-${task.id}-status`}
                value={task.status}
                disabled={busy}
                onChange={(event) => save({ status: event.target.value })}
                className="min-h-10 rounded-md border border-field bg-surface pl-3 text-sm text-ink"
              >
                {STATUSES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </span>

            {mode === 'view' ? (
              <>
                <button
                  type="button"
                  ref={editButtonRef}
                  disabled={busy}
                  onClick={startEdit}
                  aria-label={`Edit ${task.title}`}
                  className={`${buttonClass} text-ink hover:bg-line`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
                    <path d="M13.6 2.6a2 2 0 0 1 2.8 0l1 1a2 2 0 0 1 0 2.8l-9.5 9.5a1 1 0 0 1-.46.26l-3.7 1a1 1 0 0 1-1.23-1.23l1-3.7a1 1 0 0 1 .26-.46l9.83-9.17Z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  ref={deleteButtonRef}
                  disabled={busy}
                  onClick={() => setMode('confirmDelete')}
                  aria-label={`Delete ${task.title}`}
                  className={`${buttonClass} text-danger hover:bg-danger/10`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
                    <path d="M8 2h4a1 1 0 0 1 1 1v1h3a1 1 0 1 1 0 2h-1l-.8 10.1A2 2 0 0 1 12.2 18H7.8a2 2 0 0 1-2-1.9L5 6H4a1 1 0 0 1 0-2h3V3a1 1 0 0 1 1-1Z" />
                  </svg>
                  Delete
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2" onKeyDown={cancelOnEscape}>
                <span className="text-sm">Delete?</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={confirmDelete}
                  className={`${buttonClass} bg-danger text-white`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  disabled={busy}
                  autoFocus
                  onClick={cancel}
                  className={`${buttonClass} border border-field text-ink`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </article>
  )
}
