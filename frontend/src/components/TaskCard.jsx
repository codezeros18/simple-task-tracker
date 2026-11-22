import { useState } from 'react'
import { STATUSES } from '../constants.js'

const [TODO, IN_PROGRESS, DONE] = STATUSES
const BADGE_CLASS = {
  [TODO]: 'bg-todo-bg text-todo-ink',
  [IN_PROGRESS]: 'bg-progress-bg text-progress-ink',
  [DONE]: 'bg-done-bg text-done-ink',
}

const buttonClass =
  'inline-flex min-h-10 items-center gap-1 rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-60'

export default function TaskCard({ task, busy, onUpdate, onDelete }) {
  const [mode, setMode] = useState('view') // "view" | "confirmDelete"
  const selectId = `status-${task.id}`

  async function confirmDelete() {
    await onDelete(task.id)
    // Only visible if the delete failed and the card is still on screen
    setMode('view')
  }

  return (
    <article
      aria-busy={busy}
      className={`rounded-lg border border-line bg-surface p-3 shadow-sm ${busy ? 'opacity-60' : ''}`}
    >
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
        <p className="mt-1 text-sm break-words whitespace-pre-line text-muted">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          Change status of {task.title}
        </label>
        {/* Controlled by task.status: on failure the list is unchanged, so the select snaps back */}
        <select
          id={selectId}
          value={task.status}
          disabled={busy}
          onChange={(event) => onUpdate(task.id, { status: event.target.value })}
          className="min-h-10 rounded-md border border-field bg-surface px-2 text-sm text-ink"
        >
          {STATUSES.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>

        {mode === 'view' ? (
          <button
            type="button"
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
        ) : (
          <div
            className="flex items-center gap-2"
            onKeyDown={(event) => event.key === 'Escape' && setMode('view')}
          >
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
              onClick={() => setMode('view')}
              className={`${buttonClass} border border-field text-ink`}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
