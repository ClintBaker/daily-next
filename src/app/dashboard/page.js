'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import { useAuth0 } from '@auth0/auth0-react'
import Modal from '@/components/Modal'
import { ExternalLink, RotateCw } from 'lucide-react'

const initialTodoForm = {
  name: '',
  points: 60,
  description: '',
  hyperlink: '',
}

function toInputDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return date.toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth0()
  const userSub = user?.sub
  const [incompleteTodos, setIncompleteTodos] = useState([])
  const [completedTodos, setCompletedTodos] = useState([])
  const [todoForm, setTodoForm] = useState(initialTodoForm)
  const [isCreateTodoModalOpen, setIsCreateTodoModalOpen] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState(null)
  const [selectedCompletedTodo, setSelectedCompletedTodo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sortedIncompleteTodos = useMemo(
    () =>
      [...incompleteTodos].sort((a, b) => {
        if (a.points === b.points) {
          return new Date(a.createdAt) - new Date(b.createdAt)
        }
        return a.points - b.points
      }),
    [incompleteTodos],
  )

  const sortedCompletedTodos = useMemo(
    () =>
      [...completedTodos].sort(
        (a, b) => new Date(a.completedAt) - new Date(b.completedAt),
      ),
    [completedTodos],
  )

  const activeTodo = useMemo(
    () => (sortedIncompleteTodos.length > 0 ? sortedIncompleteTodos[0] : null),
    [sortedIncompleteTodos],
  )

  const pointsToday = useMemo(
    () =>
      completedTodos.reduce((acc, todo) => acc + Number(todo.points || 0), 0),
    [completedTodos],
  )

  const apiFetch = useCallback(
    (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(userSub ? { 'x-user-id': userSub } : {}),
        },
        cache: 'no-store',
      })
    },
    [userSub],
  )

  const fetchTodos = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const today = new Date()
      const [incompleteRes, completedRes] = await Promise.all([
        apiFetch('/api/todos?status=incomplete'),
        apiFetch(
          `/api/todos?startDate=${today.toISOString()}&endDate=${today.toISOString()}`,
        ),
      ])

      if (!incompleteRes.ok || !completedRes.ok) {
        throw new Error('Failed to load dashboard data.')
      }

      const [incompleteData, completedData] = await Promise.all([
        incompleteRes.json(),
        completedRes.json(),
      ])

      setIncompleteTodos(incompleteData)
      setCompletedTodos(completedData)
    } catch (fetchError) {
      setError('Unable to load todos.')
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => {
    if (isAuthenticated && userSub) {
      fetchTodos()
    }
  }, [isAuthenticated, userSub, fetchTodos])

  const handleCreateTodo = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...todoForm,
        points: Number(todoForm.points),
        hyperlink: todoForm.hyperlink.trim() || null,
      }

      const response = await apiFetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to create todo')
      }

      const created = await response.json()
      setIncompleteTodos((prev) => [...prev, created])
      setTodoForm(initialTodoForm)
      setIsCreateTodoModalOpen(false)
    } catch (saveError) {
      setError('Unable to create todo.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTodo = async () => {
    if (!selectedTodo) return
    setSaving(true)
    setError('')
    try {
      const updates = {
        name: selectedTodo.name,
        points: Number(selectedTodo.points),
        description: selectedTodo.description || '',
        hyperlink: selectedTodo.hyperlink?.trim() || null,
      }

      const response = await apiFetch(`/api/todos/${selectedTodo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update')

      const updated = await response.json()
      setIncompleteTodos((prev) =>
        prev.map((todo) => (todo._id === updated._id ? updated : todo)),
      )
      setSelectedTodo(null)
    } catch (saveError) {
      setError('Unable to update todo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTodo = async () => {
    if (!selectedTodo) return
    setSaving(true)
    setError('')
    try {
      const response = await apiFetch(`/api/todos/${selectedTodo._id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')

      setIncompleteTodos((prev) =>
        prev.filter((todo) => todo._id !== selectedTodo._id),
      )
      setSelectedTodo(null)
    } catch (saveError) {
      setError('Unable to delete todo.')
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteTodo = async () => {
    if (!selectedTodo) return
    setSaving(true)
    setError('')
    try {
      const response = await apiFetch(`/api/todos/${selectedTodo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error('Failed to complete')

      const updated = await response.json()
      setIncompleteTodos((prev) =>
        prev.filter((todo) => todo._id !== updated._id),
      )
      setCompletedTodos((prev) => [...prev, updated])
      setSelectedTodo(null)
    } catch (saveError) {
      setError('Unable to complete todo.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCompletedTodo = async () => {
    if (!selectedCompletedTodo) return
    setSaving(true)
    setError('')
    try {
      const updates = {
        name: selectedCompletedTodo.name,
        points: Number(selectedCompletedTodo.points),
        completedAt: selectedCompletedTodo.completedAt,
      }

      const response = await apiFetch(
        `/api/todos/${selectedCompletedTodo._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        },
      )
      if (!response.ok) throw new Error('Failed to update')

      const updated = await response.json()
      setCompletedTodos((prev) =>
        prev.map((todo) => (todo._id === updated._id ? updated : todo)),
      )
      setSelectedCompletedTodo(null)
    } catch (saveError) {
      setError('Unable to update completed todo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCompletedTodo = async () => {
    if (!selectedCompletedTodo) return
    setSaving(true)
    setError('')
    try {
      const response = await apiFetch(
        `/api/todos/${selectedCompletedTodo._id}`,
        {
          method: 'DELETE',
        },
      )
      if (!response.ok) throw new Error('Failed to delete')

      setCompletedTodos((prev) =>
        prev.filter((todo) => todo._id !== selectedCompletedTodo._id),
      )
      setSelectedCompletedTodo(null)
    } catch (saveError) {
      setError('Unable to delete completed todo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="space-y-6">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              Active todo
            </p>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading active todo...
              </p>
            ) : activeTodo ? (
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTodo({ ...activeTodo })}
                  className="flex-1 text-left"
                  aria-label={`Open active todo ${activeTodo.name}`}
                  title="Open active todo"
                >
                  <span className="block text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
                    {activeTodo.name}
                  </span>
                </button>
                {activeTodo.hyperlink && (
                  <a
                    href={activeTodo.hyperlink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 rounded-md bg-secondary px-2 py-2 text-secondary-foreground hover:bg-secondary/80"
                    aria-label="Open active todo hyperlink"
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active todo right now.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Todos: {incompleteTodos.length}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchTodos}
                  className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                  type="button"
                  aria-label="Refresh dashboard"
                  title="Refresh"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsCreateTodoModalOpen(true)}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  type="button"
                >
                  + Create New Todo
                </button>
              </div>
            </div>
            {loading ? (
              <p className="text-muted-foreground">Loading todos...</p>
            ) : sortedIncompleteTodos.length === 0 ? (
              <p className="text-muted-foreground">No active todos.</p>
            ) : (
              <div className="space-y-2">
                {sortedIncompleteTodos.map((todo, index) => (
                  <button
                    key={todo._id}
                    onClick={() => setSelectedTodo({ ...todo })}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${
                      selectedTodo?._id === todo._id
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-border hover:border-primary/30 hover:bg-primary/5'
                    }`}
                    type="button"
                  >
                    <span className="w-8 text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium text-foreground">
                      {todo.name}
                    </span>
                    {todo.hyperlink && (
                      <a
                        href={todo.hyperlink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
                        aria-label="Open todo hyperlink"
                        title="Open link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                      priority {todo.points}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Completed: {completedTodos.length}
            </h2>
            {loading ? (
              <p className="text-muted-foreground">
                Loading completed todos...
              </p>
            ) : sortedCompletedTodos.length === 0 ? (
              <p className="text-muted-foreground">
                Nothing completed yet today.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedCompletedTodos.map((todo, index) => (
                  <button
                    key={todo._id}
                    onClick={() => setSelectedCompletedTodo({ ...todo })}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${
                      selectedCompletedTodo?._id === todo._id
                        ? 'border-accent bg-accent/20'
                        : 'border-border hover:border-accent hover:bg-accent/10'
                    }`}
                    type="button"
                  >
                    <span className="w-8 text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium text-foreground">
                      {todo.name}
                    </span>
                    {todo.hyperlink && (
                      <a
                        href={todo.hyperlink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
                        aria-label="Open completed todo hyperlink"
                        title="Open link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <span className="rounded-md bg-accent/20 px-2 py-1 text-xs font-semibold text-accent-foreground">
                      priority {todo.points}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </section>
      </div>

      <Modal
        isOpen={isCreateTodoModalOpen}
        onClose={() => setIsCreateTodoModalOpen(false)}
        title="Create new todo"
        closeOnBackdropClick={false}
      >
        <form className="space-y-3" onSubmit={handleCreateTodo}>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="name"
            >
              Name
            </label>
            <input
              id="name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
              autoFocus
              value={todoForm.name}
              onChange={(event) =>
                setTodoForm((prev) => ({ ...prev, name: event.target.value }))
              }
              minLength={3}
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="priority"
            >
              Priority
            </label>
            <input
              id="priority"
              type="number"
              min={1}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
              value={todoForm.points}
              onChange={(event) =>
                setTodoForm((prev) => ({ ...prev, points: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
              value={todoForm.description}
              onChange={(event) =>
                setTodoForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="hyperlink"
            >
              Hyperlink (optional)
            </label>
            <input
              id="hyperlink"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
              value={todoForm.hyperlink}
              onChange={(event) =>
                setTodoForm((prev) => ({
                  ...prev,
                  hyperlink: event.target.value,
                }))
              }
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
          >
            {saving ? 'Saving...' : 'Create todo'}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedTodo)}
        onClose={() => setSelectedTodo(null)}
        title="Edit todo"
        closeOnBackdropClick={false}
      >
        {selectedTodo && (
          <div className="space-y-3">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-todo-name"
              >
                Name
              </label>
              <input
                id="edit-todo-name"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedTodo.name}
                onChange={(event) =>
                  setSelectedTodo((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-todo-priority"
              >
                Priority
              </label>
              <input
                id="edit-todo-priority"
                type="number"
                min={1}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedTodo.points}
                onChange={(event) =>
                  setSelectedTodo((prev) => ({
                    ...prev,
                    points: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-todo-description"
              >
                Description
              </label>
              <textarea
                id="edit-todo-description"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedTodo.description || ''}
                onChange={(event) =>
                  setSelectedTodo((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Description"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-todo-hyperlink"
              >
                Hyperlink
              </label>
              <input
                id="edit-todo-hyperlink"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedTodo.hyperlink || ''}
                onChange={(event) =>
                  setSelectedTodo((prev) => ({
                    ...prev,
                    hyperlink: event.target.value,
                  }))
                }
                placeholder="Hyperlink"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                onClick={handleUpdateTodo}
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Update
              </button>
              <button
                onClick={handleDeleteTodo}
                type="button"
                className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </button>
              {selectedTodo.hyperlink ? (
                <a
                  href={selectedTodo.hyperlink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                  aria-label="Open todo hyperlink"
                  title="Open link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>
            <button
              onClick={handleCompleteTodo}
              type="button"
              className="w-full rounded-xl bg-emerald-500 px-4 py-4 text-base font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Complete
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(selectedCompletedTodo)}
        onClose={() => setSelectedCompletedTodo(null)}
        title="Edit completed todo"
        closeOnBackdropClick={false}
      >
        {selectedCompletedTodo && (
          <div className="space-y-3">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-completed-todo-name"
              >
                Name
              </label>
              <input
                id="edit-completed-todo-name"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedCompletedTodo.name}
                onChange={(event) =>
                  setSelectedCompletedTodo((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-completed-todo-priority"
              >
                Priority
              </label>
              <input
                id="edit-completed-todo-priority"
                type="number"
                min={1}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedCompletedTodo.points}
                onChange={(event) =>
                  setSelectedCompletedTodo((prev) => ({
                    ...prev,
                    points: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-completed-todo-date"
              >
                Completed date
              </label>
              <input
                id="edit-completed-todo-date"
                type="date"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={toInputDate(selectedCompletedTodo.completedAt)}
                onChange={(event) =>
                  setSelectedCompletedTodo((prev) => ({
                    ...prev,
                    completedAt: new Date(event.target.value).toISOString(),
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={handleUpdateCompletedTodo}
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Update
              </button>
              <button
                onClick={handleDeleteCompletedTodo}
                type="button"
                className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
