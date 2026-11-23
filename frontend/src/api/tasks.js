export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status // 0 = the request never got a response (server down, network, CORS)
    this.fieldErrors = fieldErrors // e.g. { title: "String should have at least 1 character" }
  }
}

// The only place in the app that talks HTTP
async function request(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, "Can't reach the server")
  }

  if (response.status === 204) return null

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const detail = data?.detail
    // FastAPI sends a string for 404/503 and a list of {loc, msg} for 422
    if (Array.isArray(detail)) {
      const fieldErrors = Object.fromEntries(detail.map((error) => [error.loc.at(-1), error.msg]))
      throw new ApiError(response.status, detail[0].msg, fieldErrors)
    }
    throw new ApiError(response.status, detail ?? response.statusText)
  }

  return response.json()
}

// User-facing text for a failed request
export function describeError(error) {
  if (error.status === 503) return 'Database unavailable. Try again in a moment.'
  if (error.status === 404) return 'This task no longer exists'
  return error.message
}

export const listTasks = () => request('/tasks')
export const createTask = (payload) => request('/tasks', { method: 'POST', body: payload })
export const updateTask = (id, patch) => request(`/tasks/${id}`, { method: 'PUT', body: patch })
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' })
