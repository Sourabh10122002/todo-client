import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Todo } from '../lib/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Plus, LogOut, Edit3, Trash2, Save, X, Search, Copy, CopyCheck, Calendar } from 'lucide-react';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});
type CreateData = z.infer<typeof createSchema>;

export default function Todos() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: api.listTodos,
    enabled: !!token,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateData>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (data: CreateData) => api.createTodo(data),
    onSuccess: (todo) => {
      queryClient.setQueryData<Todo[]>(['todos'], (prev) => [todo, ...(prev ?? [])]);
      reset();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.toggleTodo(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<Todo[]>(['todos'], (prev) => (prev ?? []).map(t => t.id === updated.id ? updated : t));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTodo(id),
    onSuccess: (_,_id) => {
      const id = _id as string;
      queryClient.setQueryData<Todo[]>(['todos'], (prev) => (prev ?? []).filter(t => t.id !== id));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title?: string; description?: string }) =>
      api.updateTodo(id, { title, description }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Todo[]>(['todos'], (prev) => (prev ?? []).map(t => t.id === updated.id ? updated : t));
      setEditingId(null);
      navigate('/todos');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description?: string }) =>
      api.createTodo({ title, description }),
    onSuccess: (todo) => {
      queryClient.setQueryData<Todo[]>(['todos'], (prev) => [todo, ...(prev ?? [])]);
    },
  });

  const filtered = useMemo(() => {
    const byFilter = todos.filter((t) =>
      filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed
    );
    if (!search.trim()) return byFilter;
    const q = search.toLowerCase();
    return byFilter.filter((t) =>
      t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
    );
  }, [todos, filter, search]);

  return (
    <div className="container-narrow py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand/10 grid place-items-center">
            <CheckmarkIcon />
          </div>
          <h1 className="text-2xl font-bold">Todo List</h1>
        </div>
        <Link
          to="#"
          onClick={(e) => { e.preventDefault(); logout(); }}
          className="btn btn-muted"
        >
          <LogOut className="h-4 w-4" /> Logout
        </Link>
      </header>

      <section className="mt-6 card p-4">
        <form
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          onSubmit={handleSubmit((d) => createMutation.mutate(d))}
        >
          <div className="md:col-span-1">
            <input className="input" placeholder="Title" {...register('title')} />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div className="md:col-span-1">
            <input className="input" placeholder="Description (optional)" {...register('description')} />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="btn btn-primary md:col-span-1">
            <Plus className="h-4 w-4" /> Add Todo
          </button>
        </form>
      </section>

      <section className="mt-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="card p-2 inline-flex items-center gap-1">
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setFilter('all')}
          >All</button>
          <button
            className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setFilter('active')}
          >Active</button>
          <button
            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setFilter('completed')}
          >Completed</button>
        </div>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search todos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="mt-6">
        {isLoading ? (
          <div className="card p-6 grid place-items-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-6 text-center text-gray-600">No todos yet</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((t) => (
              <li key={t.id} className="card p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                  checked={t.completed}
                  onChange={() => toggleMutation.mutate(t.id)}
                />
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`chip ${t.completed ? 'chip-success' : 'chip-muted'}`}>{t.completed ? 'Completed' : 'Active'}</span>
                    <span className="chip chip-muted">
                      <Calendar className="h-3.5 w-3.5 mr-1" /> {formatTimeAgo(t.createdAt)}
                    </span>
                  </div>
                  {editingId === t.id ? (
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        className="input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                      />
                      <input
                        className="input"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                  ) : (
                    <>
                      <div className={`font-semibold ${t.completed ? 'text-gray-400 line-through' : ''}`}>{t.title}</div>
                      {t.description && (
                        <div className={`text-sm ${t.completed ? 'text-gray-300 line-through' : 'text-gray-600'}`}>{t.description}</div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingId === t.id ? (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => updateMutation.mutate({ id: t.id, title: editTitle, description: editDescription })}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="h-4 w-4" /> Save
                      </button>
                      <button className="btn btn-muted" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-muted"
                        onClick={() => { setEditingId(t.id); setEditTitle(t.title); setEditDescription(t.description ?? ''); }}
                      >
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        className="btn btn-muted"
                        onClick={async () => {
                          const text = `${t.title}${t.description ? ' — ' + t.description : ''}`;
                          try {
                            await navigator.clipboard.writeText(text);
                            setCopiedId(t.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          } catch {}
                        }}
                      >
                        {copiedId === t.id ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedId === t.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        className="btn btn-muted"
                        onClick={() => duplicateMutation.mutate({ title: t.title, description: t.description ?? '' })}
                        disabled={duplicateMutation.isPending}
                      >
                        <Plus className="h-4 w-4" /> Duplicate
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteMutation.mutate(t.id)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CheckmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand">
      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}