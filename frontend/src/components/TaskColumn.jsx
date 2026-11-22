import { STATUSES } from '../constants.js'
import TaskCard from './TaskCard.jsx'

const [TODO, IN_PROGRESS, DONE] = STATUSES
const EMPTY_TEXT = {
  [TODO]: 'Nothing to do',
  [IN_PROGRESS]: 'Nothing in progress',
  [DONE]: 'Nothing done yet',
}

export default function TaskColumn({ status, tasks, isBoardEmpty, pendingIds, onUpdate, onDelete }) {
  const headingId = `column-${status.toLowerCase().replaceAll(' ', '-')}`
  const emptyText =
    isBoardEmpty && status === TODO ? 'No tasks yet. Add your first one above.' : EMPTY_TEXT[status]

  return (
    <section aria-labelledby={headingId} className="min-h-40 rounded-lg bg-line/40 p-3">
      <h2 id={headingId} className="text-xs font-semibold tracking-wide text-muted uppercase">
        {status} ({tasks.length})
      </h2>

      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                busy={pendingIds.has(task.id)}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
