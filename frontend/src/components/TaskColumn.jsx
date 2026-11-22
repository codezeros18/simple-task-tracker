import { useRef } from 'react'
import { SKELETON_CARDS, STATUSES } from '../constants.js'
import TaskCard from './TaskCard.jsx'

const [TODO, IN_PROGRESS, DONE] = STATUSES
const EMPTY_TEXT = {
  [TODO]: 'Nothing to do',
  [IN_PROGRESS]: 'Nothing in progress',
  [DONE]: 'Nothing done yet',
}

export default function TaskColumn({
  status,
  tasks,
  loading,
  isBoardEmpty,
  pendingIds,
  onUpdate,
  onEdit,
  onDelete,
  onAdd,
}) {
  const headingRef = useRef(null)
  const headingId = `column-${status.toLowerCase().replaceAll(' ', '-')}`
  const emptyText =
    isBoardEmpty && status === TODO
      ? 'No tasks yet. Click Add task to create your first one.'
      : EMPTY_TEXT[status]

  async function handleDelete(id) {
    const removed = await onDelete(id)
    // The deleted card took the focused button with it, so move focus to the column heading
    if (removed) headingRef.current?.focus()
  }

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="mb-3 flex items-center gap-2.5 rounded-md text-base font-medium tracking-tight text-ink"
      >
        {/* Decorative: the title always names the status in words */}
        <span aria-hidden="true" className="glyph" data-status={status} />
        {status}
        {!loading && (
          <span className="rounded-md bg-column px-1.5 py-0.5 text-xs font-medium text-muted tabular-nums">
            {tasks.length}
          </span>
        )}
      </h2>

      <div className="flex min-h-48 flex-col gap-2.5 rounded-2xl border border-line bg-column p-2.5">
        {loading && (
          <ul aria-hidden="true" className="flex flex-col gap-2.5">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <li key={index} className="h-28 rounded-xl bg-surface motion-safe:animate-pulse" />
            ))}
          </ul>
        )}

        {!loading && tasks.length === 0 && (
          <p className="flex flex-1 items-center justify-center px-2 text-center text-sm text-muted">
            {emptyText}
          </p>
        )}

        {!loading && tasks.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  busy={pendingIds.has(task.id)}
                  onUpdate={onUpdate}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}

        {!loading && (
          <button
            type="button"
            onClick={() => onAdd(status)}
            aria-label={`Add task to ${status}`}
            className="mt-auto inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-field/60 text-sm text-muted hover:border-field hover:bg-surface hover:text-ink motion-safe:transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
              <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
            </svg>
            Add task
          </button>
        )}
      </div>
    </section>
  )
}
