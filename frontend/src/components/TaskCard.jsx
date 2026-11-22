import { useEffect, useRef, useState } from 'react'
import { STATUSES } from '../constants.js'

const [TODO, IN_PROGRESS, DONE] = STATUSES
// The status select doubles as the badge. Colour is never the only signal: it always shows
// the status in words.
const CHIP_CLASS = {
  [TODO]: 'bg-todo-bg text-todo-ink',
  [IN_PROGRESS]: 'bg-progress-bg text-progress-ink',
  [DONE]: 'bg-done-bg text-done-ink',
}

// Browser locale and time zone; the server always sends UTC.
// The card shows the short date; the full dates open in a small popover on click / tap.
const shortFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const fullFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// 40px touch target on phones, 32px from md up
const iconButtonClass =
  'inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-page motion-safe:transition-colors disabled:opacity-60 md:size-8'

export default function TaskCard({ task, busy, onUpdate, onEdit, onDelete }) {
  const [mode, setMode] = useState('view') // "view" | "confirmDelete"
  const [error, setError] = useState(null)
  const [showDates, setShowDates] = useState(false)
  const datesRef = useRef(null)
  const deleteButtonRef = useRef(null)
  const deleteDialogRef = useRef(null)
  const previousMode = useRef(mode)
  const errorId = `task-${task.id}-error`

  // Back in view mode, return focus to the delete button that opened the confirmation
  useEffect(() => {
    if (mode === 'view' && previousMode.current === 'confirmDelete') deleteButtonRef.current?.focus()
    previousMode.current = mode
  }, [mode])

  // Dates popover: close on Esc or on a press outside of it
  useEffect(() => {
    if (!showDates) return
    const closeOutside = (event) => {
      if (!datesRef.current.contains(event.target)) setShowDates(false)
    }
    const closeOnEscape = (event) => event.key === 'Escape' && setShowDates(false)
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showDates])

  // The confirmation is a native <dialog>: dimmed backdrop, Esc to close, focus kept inside.
  // StrictMode runs effects twice in development, so only open it if it is not open yet.
  useEffect(() => {
    if (mode === 'confirmDelete' && !deleteDialogRef.current.open) deleteDialogRef.current.showModal()
  }, [mode])

  // Status changes only. Editing title / description happens in the dialog (see App).
  // Validation errors from the server are shown inside the card.
  async function save(patch) {
    setError(null)
    try {
      return await onUpdate(task.id, patch)
    } catch (saveError) {
      setError(Object.values(saveError.fieldErrors)[0] ?? saveError.message)
      return false
    }
  }

  function cancel() {
    setError(null)
    setMode('view')
  }

  async function confirmDelete() {
    await onDelete(task.id)
    // Only visible if the delete failed and the card is still on screen
    setMode('view')
  }

  return (
    <article
      aria-busy={busy}
      className={`group space-y-2.5 rounded-xl border border-line bg-surface p-4 shadow-xs hover:border-field hover:shadow-md motion-safe:transition-colors ${busy ? 'opacity-60' : ''}`}
    >
      <h3 className="text-[15px] leading-snug font-medium break-words text-ink">{task.title}</h3>

      {task.description && (
        <p className="text-sm break-words whitespace-pre-line text-muted">{task.description}</p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}

      {/* Footer: status pill + date on the left, actions on the right */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-dashed border-line pt-3">
        <div className="flex flex-wrap items-center gap-x-3">
          <label htmlFor={`task-${task.id}-status`} className="sr-only">
            Change status of {task.title}
          </label>
          {/* Controlled by task.status: on failure the list is unchanged, so the select snaps back */}
          <span className={`select-wrap rounded-full ${CHIP_CLASS[task.status]}`}>
            <span
              aria-hidden="true"
              className="glyph pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              data-status={task.status}
            />
            <select
              id={`task-${task.id}-status`}
              value={task.status}
              disabled={busy}
              onChange={(event) => save({ status: event.target.value })}
              className="h-10 rounded-full bg-transparent pr-8 pl-8 text-xs font-medium text-inherit md:h-8"
            >
              {STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </span>

          <div ref={datesRef} className="relative">
            <button
              type="button"
              onClick={() => setShowDates((open) => !open)}
              aria-expanded={showDates}
              aria-controls={`task-${task.id}-dates`}
              aria-label={`Last updated ${fullFormat.format(new Date(task.updated_at))}`}
              title={showDates ? undefined : 'Show full dates'}
              className="inline-flex min-h-10 items-center rounded-md text-xs text-muted hover:text-ink motion-safe:transition-colors md:min-h-8"
            >
              <time dateTime={task.updated_at}>{shortFormat.format(new Date(task.updated_at))}</time>
            </button>

            {/* Floats above the date, so the card layout never shifts */}
            {showDates && (
              <div
                id={`task-${task.id}-dates`}
                className="absolute bottom-full left-0 z-20 mb-2 w-max rounded-xl border border-line bg-surface p-3 shadow-lg"
              >
                <dl className="space-y-2 text-xs">
                  <div>
                    <dt className="text-muted">Created</dt>
                    <dd className="mt-0.5 text-sm font-medium text-ink tabular-nums">
                      <time dateTime={task.created_at}>
                        {fullFormat.format(new Date(task.created_at))}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Last updated</dt>
                    <dd className="mt-0.5 text-sm font-medium text-ink tabular-nums">
                      <time dateTime={task.updated_at}>
                        {fullFormat.format(new Date(task.updated_at))}
                      </time>
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>

        {mode === 'view' && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => onEdit(task)}
              aria-label={`Edit ${task.title}`}
              className={`${iconButtonClass} hover:text-ink`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
                <path d="M13.6 2.6a2 2 0 0 1 2.8 0l1 1a2 2 0 0 1 0 2.8l-9.5 9.5a1 1 0 0 1-.46.26l-3.7 1a1 1 0 0 1-1.23-1.23l1-3.7a1 1 0 0 1 .26-.46l9.83-9.17Z" />
              </svg>
            </button>
            <button
              type="button"
              ref={deleteButtonRef}
              disabled={busy}
              onClick={() => setMode('confirmDelete')}
              aria-label={`Delete ${task.title}`}
              className={`${iconButtonClass} hover:text-danger`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
                <path d="M8 2h4a1 1 0 0 1 1 1v1h3a1 1 0 1 1 0 2h-1l-.8 10.1A2 2 0 0 1 12.2 18H7.8a2 2 0 0 1-2-1.9L5 6H4a1 1 0 0 1 0-2h3V3a1 1 0 0 1 1-1Z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {mode === 'confirmDelete' && (
        <dialog
          ref={deleteDialogRef}
          onClose={cancel}
          aria-labelledby={`task-${task.id}-delete-heading`}
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-surface p-0 text-ink antialiased shadow-xl backdrop:bg-ink/40"
        >
          <div className="px-6 pt-6 pb-5">
            <h2
              id={`task-${task.id}-delete-heading`}
              className="text-lg leading-none font-semibold tracking-tight"
            >
              Delete task?
            </h2>
            <p className="mt-3 text-sm break-words text-muted">
              “{task.title}” will be removed permanently.
            </p>
          </div>
          <div className="flex justify-end gap-3 rounded-b-2xl border-t border-line bg-page px-6 py-4">
            <button
              type="button"
              disabled={busy}
              autoFocus
              onClick={() => deleteDialogRef.current.close()}
              className="min-h-10 min-w-24 rounded-lg border border-field bg-surface px-4 text-sm font-medium text-ink hover:bg-column motion-safe:transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={confirmDelete}
              className="min-h-10 min-w-24 rounded-lg bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 motion-safe:transition-colors disabled:opacity-60"
            >
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </dialog>
      )}
    </article>
  )
}
