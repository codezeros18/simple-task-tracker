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
  onDelete,
}) {
  const headingRef = useRef(null)
  const headingId = `column-${status.toLowerCase().replaceAll(' ', '-')}`
  const emptyText =
    isBoardEmpty && status === TODO ? 'No tasks yet. Add your first one above.' : EMPTY_TEXT[status]

  async function handleDelete(id) {
    const removed = await onDelete(id)
    // The deleted card took the focused button with it, so move focus to the column heading
    if (removed) headingRef.current?.focus()
  }

  return (
    <section aria-labelledby={headingId} className="min-h-40 rounded-lg bg-line/40 p-3">
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="text-xs font-semibold tracking-wide text-muted uppercase"
      >
        {status}
        {!loading && ` (${tasks.length})`}
      </h2>

      {loading && (
        <ul aria-hidden="true" className="mt-3 flex flex-col gap-3">
          {Array.from({ length: SKELETON_CARDS }, (_, index) => (
            <li
              key={index}
              className="h-24 rounded-lg border border-line bg-surface motion-safe:animate-pulse"
            />
          ))}
        </ul>
      )}

      {!loading && tasks.length === 0 && <p className="mt-3 text-sm text-muted">{emptyText}</p>}

      {!loading && tasks.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                busy={pendingIds.has(task.id)}
                onUpdate={onUpdate}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
