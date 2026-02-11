'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import { cadenceLabel, getRecurringStatus } from '@/lib/recurring'
import { useAuth0 } from '@auth0/auth0-react'
import Modal from '@/components/Modal'
import { ExternalLink, RotateCw } from 'lucide-react'

const initialProcessForm = {
  name: '',
  description: '',
  cadence: 7,
  points: 10,
  hyperlink: '',
}

function toEditableProcess(item) {
  return {
    _id: item._id,
    name: item.name || '',
    description: item.description || '',
    cadence: Number(item.cadence || 1),
    points: Number(item.points || 1),
    lastComplete: item.lastComplete || new Date().toISOString(),
    hyperlink: item.hyperlink || '',
  }
}

function toInputDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return date.toISOString().slice(0, 10)
}

function toDisplayDate(value) {
  return new Date(value).toLocaleDateString()
}

export default function RecurringPage() {
  const { user, isAuthenticated } = useAuth0()
  const userSub = user?.sub
  const [processes, setProcesses] = useState([])
  const [processForm, setProcessForm] = useState(initialProcessForm)
  const [selectedProcess, setSelectedProcess] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const processRows = useMemo(() => {
    return [...processes]
      .map((item) => ({ ...item, ...getRecurringStatus(item) }))
      .sort((a, b) => a.dueIn - b.dueIn)
  }, [processes])

  const snapshot = useMemo(() => {
    const overdue = processRows.filter(
      (item) => item.status === 'Overdue',
    ).length
    const dueTomorrow = processRows.filter((item) => item.dueIn <= 1).length
    const dueThisWeek = processRows.filter((item) => item.dueIn <= 7).length
    return {
      total: processRows.length,
      overdue,
      dueTomorrow,
      dueThisWeek,
    }
  }, [processRows])

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

  const fetchProcesses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/processes')
      if (!response.ok) throw new Error('Failed to fetch recurring items')
      const data = await response.json()
      setProcesses(data)
    } catch (fetchError) {
      setError('Unable to load recurring items.')
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => {
    if (isAuthenticated && userSub) {
      fetchProcesses()
    }
  }, [isAuthenticated, userSub, fetchProcesses])

  const createProcess = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        ...processForm,
        cadence: Number(processForm.cadence),
        points: Number(processForm.points),
        hyperlink: processForm.hyperlink.trim() || null,
      }

      const response = await apiFetch('/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Failed to create')

      const created = await response.json()
      setProcesses((prev) => [...prev, created])
      setProcessForm(initialProcessForm)
      setIsCreateModalOpen(false)
      setNotice('Recurring item created.')
    } catch (saveError) {
      setError('Unable to create recurring item.')
    } finally {
      setSaving(false)
    }
  }

  const updateProcess = async () => {
    if (!selectedProcess) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        name: selectedProcess.name,
        description: selectedProcess.description || '',
        cadence: Number(selectedProcess.cadence),
        points: Number(selectedProcess.points),
        lastComplete: selectedProcess.lastComplete,
        hyperlink: selectedProcess.hyperlink?.trim() || null,
      }
      const response = await apiFetch(`/api/processes/${selectedProcess._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Failed to update')

      const updated = await response.json()
      setProcesses((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item)),
      )
      setSelectedProcess(null)
      setNotice('Changes saved.')
    } catch (saveError) {
      setError('Unable to update recurring item.')
    } finally {
      setSaving(false)
    }
  }

  const snoozeProcess = async () => {
    if (!selectedProcess) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await apiFetch(`/api/processes/${selectedProcess._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastComplete: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error('Failed to snooze')

      const updated = await response.json()
      setProcesses((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item)),
      )
      setSelectedProcess(null)
      setNotice('Recurring item snoozed.')
    } catch (saveError) {
      setError('Unable to snooze recurring item.')
    } finally {
      setSaving(false)
    }
  }

  const addToTodos = async () => {
    if (!selectedProcess) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const createTodoResponse = await apiFetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedProcess.name,
          points: Number(selectedProcess.points),
          description: selectedProcess.description || '',
          hyperlink: selectedProcess.hyperlink || null,
        }),
      })
      if (!createTodoResponse.ok) throw new Error('Failed to create todo')

      const markReviewedResponse = await apiFetch(
        `/api/processes/${selectedProcess._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastComplete: new Date().toISOString() }),
        },
      )
      if (!markReviewedResponse.ok) throw new Error('Failed to mark reviewed')

      const updated = await markReviewedResponse.json()
      setProcesses((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item)),
      )
      setSelectedProcess(null)
      setNotice('Added to todos and marked as reviewed.')
    } catch (saveError) {
      setError('Unable to add recurring item to todos.')
    } finally {
      setSaving(false)
    }
  }

  const deleteProcess = async () => {
    if (!selectedProcess) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await apiFetch(`/api/processes/${selectedProcess._id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')

      setProcesses((prev) =>
        prev.filter((item) => item._id !== selectedProcess._id),
      )
      setSelectedProcess(null)
      setNotice('Recurring item deleted.')
    } catch (saveError) {
      setError('Unable to delete recurring item.')
    } finally {
      setSaving(false)
    }
  }

  const selectForEditing = (item) => {
    setSelectedProcess(toEditableProcess(item))
    setError('')
    setNotice('')
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="space-y-6">
          <div className="rounded-lg border border-border/70 bg-card px-3 py-2 shadow-sm">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Snapshot
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-1">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-secondary-foreground">
                  {snapshot.total}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-semibold text-destructive">
                  {snapshot.overdue}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1">
                <span className="text-muted-foreground">Tomorrow</span>
                <span className="font-semibold text-primary">
                  {snapshot.dueTomorrow}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2 py-1">
                <span className="text-muted-foreground">This week</span>
                <span className="font-semibold text-accent-foreground">
                  {snapshot.dueThisWeek}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Recurring items
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchProcesses}
                  className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                  type="button"
                  aria-label="Refresh recurring items"
                  title="Refresh"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  type="button"
                >
                  + Create recurring
                </button>
              </div>
            </div>
            {loading ? (
              <p className="text-muted-foreground">
                Loading recurring items...
              </p>
            ) : processRows.length === 0 ? (
              <p className="text-muted-foreground">No recurring items yet.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {processRows.map((item, index) => (
                    <button
                      key={item._id}
                      onClick={() => selectForEditing(item)}
                      className={`w-full rounded-xl border p-3 text-left ${
                        selectedProcess?._id === item._id
                          ? 'border-primary/40 bg-primary/10'
                          : item.status === 'Overdue'
                            ? 'border-destructive/40 bg-destructive/10'
                            : 'border-border bg-card'
                      }`}
                      type="button"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">
                          {index + 1}. {item.name}
                        </p>
                        <div className="flex items-center gap-1">
                          {item.hyperlink && (
                            <a
                              href={item.hyperlink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
                              aria-label="Open recurring hyperlink"
                              title="Open link"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              item.status === 'Overdue'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-accent/20 text-accent-foreground'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">
                        {item.description || '-'}
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <p>Cadence: {cadenceLabel(item.cadence)}</p>
                        <p>Priority: {item.points}</p>
                        <p>Due in: {item.dueIn}</p>
                        <p>Last: {toDisplayDate(item.lastComplete)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
                  <div className="min-w-[860px]">
                    <div className="grid grid-cols-[52px_160px_1fr_120px_120px_130px_90px_90px] border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <div className="border-r border-border px-2 py-2">
                        Num
                      </div>
                      <div className="border-r border-border px-2 py-2">
                        Name
                      </div>
                      <div className="border-r border-border px-2 py-2">
                        Description
                      </div>
                      <div className="border-r border-border px-2 py-2">
                        Status
                      </div>
                      <div className="border-r border-border px-2 py-2">
                        Cadence
                      </div>
                      <div className="border-r border-border px-2 py-2">
                        Last review
                      </div>
                      <div className="border-r border-border px-2 py-2">
                        Priority
                      </div>
                      <div className="px-2 py-2">Due in</div>
                    </div>
                    {processRows.map((item, index) => {
                      const isOverdue = item.status === 'Overdue'
                      const isSelected = selectedProcess?._id === item._id

                      return (
                        <button
                          key={item._id}
                          onClick={() => selectForEditing(item)}
                          className={`grid w-full grid-cols-[52px_160px_1fr_120px_120px_130px_90px_90px] border-b text-left text-sm ${
                            isSelected
                              ? 'border-primary/30 bg-primary/10'
                              : isOverdue
                                ? 'border-destructive/30 bg-destructive/10 hover:bg-destructive/10'
                                : 'border-border bg-card hover:bg-muted/40'
                          }`}
                          type="button"
                        >
                          <div
                            className={`truncate border-r px-2 py-2 text-muted-foreground ${
                              isOverdue
                                ? 'border-destructive/30'
                                : 'border-border'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div
                            className={`truncate border-r px-2 py-2 font-medium ${
                              isOverdue
                                ? 'border-destructive/30 text-foreground'
                                : 'border-border text-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{item.name}</span>
                              {item.hyperlink && (
                                <a
                                  href={item.hyperlink}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                  className="shrink-0 rounded bg-secondary px-2 py-1 text-[11px] font-semibold text-secondary-foreground hover:bg-secondary/80"
                                  aria-label="Open recurring hyperlink"
                                  title="Open link"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                          <div
                            className={`truncate border-r px-2 py-2 ${
                              isOverdue
                                ? 'border-destructive/30 text-foreground'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            {item.description || '-'}
                          </div>
                          <div
                            className={`border-r px-2 py-2 ${
                              isOverdue
                                ? 'border-destructive/30'
                                : 'border-border'
                            }`}
                          >
                            <span
                              className={`rounded px-2 py-1 text-xs font-semibold ${
                                isOverdue
                                  ? 'bg-destructive/20 text-destructive'
                                  : 'bg-accent/20 text-accent-foreground'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div
                            className={`truncate border-r px-2 py-2 ${
                              isOverdue
                                ? 'border-destructive/30 text-foreground'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            {cadenceLabel(item.cadence)}
                          </div>
                          <div
                            className={`truncate border-r px-2 py-2 ${
                              isOverdue
                                ? 'border-destructive/30 text-foreground'
                                : 'border-border text-muted-foreground'
                            }`}
                          >
                            {toDisplayDate(item.lastComplete)}
                          </div>
                          <div
                            className={`border-r px-2 py-2 font-medium ${
                              isOverdue
                                ? 'border-destructive/30 text-foreground'
                                : 'border-border text-foreground'
                            }`}
                          >
                            {item.points}
                          </div>
                          <div
                            className={`px-2 py-2 font-medium ${isOverdue ? 'text-foreground' : 'text-foreground'}`}
                          >
                            {item.dueIn}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              {notice}
            </p>
          )}
        </section>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create recurring item"
        closeOnBackdropClick={false}
      >
        <form className="space-y-3" onSubmit={createProcess}>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="create-name"
            >
              Name
            </label>
            <input
              id="create-name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
              placeholder="Name"
              value={processForm.name}
              onChange={(event) =>
                setProcessForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              required
              minLength={3}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="create-description"
            >
              Description
            </label>
            <textarea
              id="create-description"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
              placeholder="Description"
              value={processForm.description}
              onChange={(event) =>
                setProcessForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="create-cadence"
              >
                Cadence (days)
              </label>
              <input
                id="create-cadence"
                type="number"
                min={1}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                placeholder="Cadence (days)"
                value={processForm.cadence}
                onChange={(event) =>
                  setProcessForm((prev) => ({
                    ...prev,
                    cadence: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="create-points"
              >
                Priority
              </label>
              <input
                id="create-points"
                type="number"
                min={1}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                placeholder="Priority"
                value={processForm.points}
                onChange={(event) =>
                  setProcessForm((prev) => ({
                    ...prev,
                    points: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-foreground"
              htmlFor="create-hyperlink"
            >
              Hyperlink (optional)
            </label>
            <input
              id="create-hyperlink"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
              placeholder="Hyperlink (optional)"
              value={processForm.hyperlink}
              onChange={(event) =>
                setProcessForm((prev) => ({
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
            {saving ? 'Saving...' : 'Create recurring item'}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedProcess)}
        onClose={() => setSelectedProcess(null)}
        title="Edit recurring item"
        closeOnBackdropClick={false}
      >
        {selectedProcess && (
          <div className="space-y-3">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-name"
              >
                Name
              </label>
              <input
                id="edit-name"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedProcess.name}
                onChange={(event) =>
                  setSelectedProcess((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-description"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedProcess.description || ''}
                onChange={(event) =>
                  setSelectedProcess((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-foreground"
                  htmlFor="edit-cadence"
                >
                  Cadence (days)
                </label>
                <input
                  id="edit-cadence"
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                  value={selectedProcess.cadence}
                  onChange={(event) =>
                    setSelectedProcess((prev) => ({
                      ...prev,
                      cadence: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-foreground"
                  htmlFor="edit-points"
                >
                  Priority
                </label>
                <input
                  id="edit-points"
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                  value={selectedProcess.points}
                  onChange={(event) =>
                    setSelectedProcess((prev) => ({
                      ...prev,
                      points: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-lastComplete"
              >
                Last complete
              </label>
              <input
                id="edit-lastComplete"
                type="date"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={toInputDate(selectedProcess.lastComplete)}
                onChange={(event) =>
                  setSelectedProcess((prev) => ({
                    ...prev,
                    lastComplete: new Date(event.target.value).toISOString(),
                  }))
                }
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="edit-hyperlink"
              >
                Hyperlink
              </label>
              <input
                id="edit-hyperlink"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-ring"
                value={selectedProcess.hyperlink || ''}
                onChange={(event) =>
                  setSelectedProcess((prev) => ({
                    ...prev,
                    hyperlink: event.target.value,
                  }))
                }
                placeholder="Hyperlink"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={updateProcess}
                className="rounded-lg bg-lime-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-lime-400"
              >
                Update
              </button>
              <button
                type="button"
                onClick={addToTodos}
                className="rounded-lg bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
              >
                Add to todos
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={snoozeProcess}
                className={`rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 ${
                  selectedProcess.hyperlink ? '' : 'sm:col-span-2'
                }`}
              >
                Snooze
              </button>
              {selectedProcess.hyperlink && (
                <a
                  href={selectedProcess.hyperlink}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg bg-zinc-500 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-400"
                  aria-label="Open recurring hyperlink"
                  title="Open link"
                >
                  <span className="inline-flex items-center justify-center">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={deleteProcess}
              className="w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Delete recurring item
            </button>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
