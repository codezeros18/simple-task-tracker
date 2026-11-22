// role="status" is read politely by screen readers; role="alert" interrupts, so it is only for errors
// Solid fills (dark for success, red for errors) so the toast stands out on the white panel
export default function Notice({ type, text, onDismiss }) {
  const isError = type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-3 rounded-xl py-1 pr-1 pl-4 text-sm text-white shadow-lg ${
        isError ? 'bg-danger' : 'bg-ink'
      }`}
    >
      <p className="flex items-center gap-2.5">
        {/* Decorative: the message itself says what happened */}
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${isError ? 'bg-white' : 'bg-done-dot'}`}
        />
        {text}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="min-h-10 shrink-0 rounded-lg px-3 text-white/80 hover:bg-white/15 hover:text-white motion-safe:transition-colors"
      >
        Dismiss
      </button>
    </div>
  )
}
