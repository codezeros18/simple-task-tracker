import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/tasks.js'

// All task state lives here. After every successful request the list is updated
// from the server's response (no refetch, no optimistic update).
export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loadState, setLoadState] = useState('loading') // "loading" | "ready" | "error"
  const [pendingIds, setPendingIds] = useState(() => new Set())
  const [loadError, setLoadError] = useState(null)

  // State is only set once the request settles, and only if nobody cancelled it meanwhile
  const load = useCallback(
    (isCancelled = () => false) =>
      api.listTasks().then(
        (data) => {
          if (isCancelled()) return
          setTasks(data)
          setLoadState('ready')
        },
        (error) => {
          if (isCancelled()) return
          setLoadError(error)
          setLoadState('error')
        },
      ),
    [],
  )

  useEffect(() => {
    // StrictMode runs effects twice in development; the flag makes the first run's result ignored
    let ignore = false
    load(() => ignore)
    return () => {
      ignore = true
    }
  }, [load])

  // A new Set every time, so React sees a new value and re-renders
  const setPending = useCallback((id, isPending) => {
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (isPending) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const createTask = useCallback(async (payload) => {
    const created = await api.createTask(payload)
    setTasks((prev) => [created, ...prev])
    return created
  }, [])

  const updateTask = useCallback(
    async (id, patch) => {
      setPending(id, true)
      try {
        const updated = await api.updateTask(id, patch)
        setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)))
        return updated
      } catch (error) {
        // Deleted somewhere else: drop it here too, then let the caller show a notice
        if (error.status === 404) setTasks((prev) => prev.filter((task) => task.id !== id))
        throw error
      } finally {
        setPending(id, false)
      }
    },
    [setPending],
  )

  const deleteTask = useCallback(
    async (id) => {
      setPending(id, true)
      try {
        await api.deleteTask(id)
        setTasks((prev) => prev.filter((task) => task.id !== id))
      } catch (error) {
        // 404 means it is already gone, so the end result is the same
        if (error.status === 404) setTasks((prev) => prev.filter((task) => task.id !== id))
        throw error
      } finally {
        setPending(id, false)
      }
    },
    [setPending],
  )

  // The first load starts in "loading" already; only a retry has to switch back to it
  const reload = useCallback(() => {
    setLoadState('loading')
    return load()
  }, [load])

  return { tasks, loadState, loadError, pendingIds, reload, createTask, updateTask, deleteTask }
}
