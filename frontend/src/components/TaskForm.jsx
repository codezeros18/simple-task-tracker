import { useRef, useState } from 'react'
import { DESC_MAX, STATUSES, TITLE_COUNTER_FROM, TITLE_MAX } from '../constants.js'

const FIELDS = ['title', 'description', 'status']

export default function TaskForm({ onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState(STATUSES[0])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef(null)

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
      await onCreate({ title, description, status })
      setTitle('')
      setDescription('')
      setStatus(STATUSES[0])
      titleRef.current.focus()
    } catch (error) {
      // 422 from the server: show its messages under the matching fields. Inputs are kept as typed.
      const fieldErrors = Object.entries(error.fieldErrors ?? {})
      setErrors(Object.fromEntries(fieldErrors.filter(([field]) => FIELDS.includes(field))))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'min-h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink aria-invalid:border-danger'

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="flex-1">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            ref={titleRef}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              // The old message no longer applies once the user edits the title
              setErrors((prev) => ({ ...prev, title: undefined }))
            }}
            maxLength={TITLE_MAX}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'title-error' : undefined}
            className={`${inputClass} mt-1 border-field`}
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

        <div className="md:w-44">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <div className="select-wrap mt-1">
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-invalid={errors.status ? true : undefined}
              aria-describedby={errors.status ? 'status-error' : undefined}
              className={`${inputClass} border-field`}
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

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white motion-safe:transition-colors disabled:opacity-60 md:mt-6"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
            <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
          </svg>
          {submitting ? 'Adding…' : 'Add task'}
        </button>
      </div>

      <div className="mt-3">
        <label htmlFor="description" className="text-sm font-medium">
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={DESC_MAX}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className={`${inputClass} mt-1 border-field`}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-danger">
            {errors.description}
          </p>
        )}
      </div>
    </form>
  )
}
