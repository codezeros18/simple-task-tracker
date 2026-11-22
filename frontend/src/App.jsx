import { useTasks } from './hooks/useTasks.js'

export default function App() {
  const { tasks, loadState } = useTasks()

  return (
    <main className="min-h-screen bg-page p-6 text-ink">
      <h1 className="text-2xl font-semibold">Simple Task Tracker</h1>
      <p>
        loadState: {loadState} · tasks: {tasks.length}
      </p>
    </main>
  )
}
