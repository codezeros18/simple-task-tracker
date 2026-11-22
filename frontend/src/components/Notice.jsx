// role="status" is read politely by screen readers; role="alert" interrupts, so it is only for errors
export default function Notice({ type, text, onDismiss }) {
  const isError = type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${
        isError ? 'border-danger bg-surface text-danger' : 'border-line bg-surface text-ink'
      }`}
    >
      <p>{text}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="min-h-10 shrink-0 rounded-md px-2 text-muted transition-colors hover:text-ink"
      >
        Dismiss
      </button>
    </div>
  )
}
