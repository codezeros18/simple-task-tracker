import { useEffect, useRef, useState } from 'react'
import { describeError } from '../api/tasks.js'
import Notice from './Notice.jsx'
import { DESC_MAX, STATUSES, TITLE_COUNTER_FROM, TITLE_MAX } from '../constants.js'

const FIELDS = ['title', 'description', 'status']

// 44px fields with 15px text: easy to hit on a phone and comfortable to read
const inputClass =
  'min-h-11 w-full rounded-lg border border-field bg-surface px-3 py-2.5 text-[15px] leading-snug text-ink aria-invalid:border-danger'
const labelClass = 'block text-sm font-medium text-ink'

// One dialog for both "add" (no task) and "edit" (task given). Rendered only while open, so every
// open starts from fresh values. The native <dialog> gives us the dimmed backdrop, Esc to close
// and a focus trap for free.
export default function TaskForm({ task, initialStatus, onSubmit, onClose }) {
  const isEdit = task !== undefined
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState(initialStatus)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const dialogRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    // StrictMode runs effects twice in development; opening an already open dialog would throw
    if (!dialogRef.current.open) dialogRef.current.showModal()
    // autoFocus puts the caret at the start of an existing title; when editing, start typing at its end
    const input = titleRef.current
    input.setSelectionRange(input.value.length, input.value.length)
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    // Same rule as the server: spaces only counts as empty
    if (!title.trim()) {
      setErrors({ title: 'Title is required.' })
      titleRef.current.focus()
      return
    }

    setSubmitting(true)
    setErrors({})
    try {
      // Edit only sends title and description; the status is changed from the card
      await onSubmit(isEdit ? { title, description } : { title, description, status })
      dialogRef.current.close()
    } catch (error) {
      // 422 about a field: show it under that field. Anything else (server down, 503): the same toast
      // as everywhere else, rendered inside the dialog because anything outside it sits behind the
      // dialog's backdrop. Either way the inputs stay as typed.
      const fieldErrors = Object.fromEntries(
        Object.entries(error.fieldErrors ?? {}).filter(([field]) => FIELDS.includes(field)),
      )
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { form: describeError(error) })
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="add-task-heading"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-ink antialiased shadow-xl backdrop:bg-ink/40"
    >
      <form onSubmit={handleSubmit} noValidate>
        <h2
          id="add-task-heading"
          className="border-b border-line px-6 py-5 text-lg leading-none font-semibold tracking-tight"
        >
          {isEdit ? 'Edit task' : 'Add task'}
        </h2>

        <div className="flex flex-col gap-5 px-6 py-6">
          <div>
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <input
              id="title"
              ref={titleRef}
              autoFocus
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                // The old message no longer applies once the user edits the title
                setErrors((prev) => ({ ...prev, title: undefined }))
              }}
              maxLength={TITLE_MAX}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? 'title-error' : undefined}
              className={`${inputClass} mt-2`}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-danger">
                {errors.title}
              </p>
            )}
            {title.length > TITLE_COUNTER_FROM && (
              <p className="mt-1 text-xs text-muted">
                {title.length}/{TITLE_MAX}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={DESC_MAX}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={errors.description ? 'description-error' : undefined}
              className={`${inputClass} mt-2 resize-none`}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-sm text-danger">
                {errors.description}
              </p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="status" className={labelClass}>
                Status
              </label>
              <div className="select-wrap mt-2 text-muted">
                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  aria-invalid={errors.status ? true : undefined}
                  aria-describedby={errors.status ? 'status-error' : undefined}
                  className={inputClass}
                >
                  {STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </div>
              {errors.status && (
                <p id="status-error" className="mt-1 text-sm text-danger">
                  {errors.status}
                </p>
              )}
            </div>
          )}

        </div>

        <div className="flex justify-end gap-3 rounded-b-2xl border-t border-line bg-page px-6 py-4">
          <button
            type="button"
            onClick={() => dialogRef.current.close()}
            className="min-h-10 min-w-24 rounded-lg border border-field bg-surface px-4 text-sm font-medium text-ink hover:bg-column motion-safe:transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 min-w-24 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover motion-safe:transition-colors disabled:opacity-60"
          >
            {submitting ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save' : 'Add task'}
          </button>
        </div>
      </form>

      {errors.form && (
        <div className="fixed top-3 right-3 left-3 z-50 sm:left-auto sm:w-96">
          <Notice
            type="error"
            text={errors.form}
            onDismiss={() => setErrors((prev) => ({ ...prev, form: undefined }))}
          />
        </div>
      )}
    </dialog>
  )
}
