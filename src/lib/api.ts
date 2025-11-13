import axios from 'axios';
import { z } from 'zod';

const API_URL = import.meta.env.VITE_API_URL as string;

export const http = axios.create({
  baseURL: API_URL,
});

// Attach token from auth store if present
http.interceptors.request.use((config) => {
  try {
    const persisted = localStorage.getItem('auth');
    if (persisted) {
      const parsed = JSON.parse(persisted);
      const token: string | null = parsed?.state?.token ?? parsed?.token ?? null;
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});

// Common API response parsers
export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
});

// Accept either `id` or `_id`, and coerce any value to a string
const ServerTodoSchema = z.object({
  id: z.any().optional(),
  _id: z.any().optional(),
  title: z.string(),
  description: z.string().optional().default(''),
  completed: z.boolean(),
  createdAt: z.string().or(z.date()),
}).transform((raw) => ({
  id:
    typeof raw.id === 'string' ? raw.id :
    typeof raw._id === 'string' ? raw._id :
    raw.id != null ? String(raw.id) :
    raw._id != null ? String(raw._id) :
    '',
  title: raw.title,
  description: raw.description ?? '',
  completed: raw.completed,
  createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : raw.createdAt.toISOString(),
}));

export const TodoSchema = ServerTodoSchema; // normalized shape with `id: string`

export const TodosResponseSchema = z.object({
  todos: z.array(ServerTodoSchema),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Todo = z.infer<typeof TodoSchema>;

// API helpers
export const api = {
  // Auth
  signup: async (payload: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const { data } = await http.post('/auth/signup', payload);
    return AuthResponseSchema.parse(data);
  },
  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const { data } = await http.post('/auth/login', payload);
    return AuthResponseSchema.parse(data);
  },
  forgot: async (payload: { email: string }): Promise<{ resetToken: string; expiresAt: string } | { message: string }> => {
    const { data } = await http.post('/auth/forgot', payload);
    return data;
  },
  reset: async (payload: { token: string; password: string }): Promise<AuthResponse> => {
    const { data } = await http.post('/auth/reset', payload);
    return AuthResponseSchema.parse(data);
  },

  // Todos
  listTodos: async (): Promise<Todo[]> => {
    const { data } = await http.get('/todos');
    const parsed = TodosResponseSchema.parse(data);
    return parsed.todos;
  },
  createTodo: async (payload: { title: string; description?: string }): Promise<Todo> => {
    const { data } = await http.post('/todos', payload);
    return TodoSchema.parse(data.todo ?? data);
  },
  updateTodo: async (id: string, payload: Partial<{ title: string; description?: string; completed: boolean }>): Promise<Todo> => {
    const { data } = await http.put(`/todos/${id}`, payload);
    return TodoSchema.parse(data.todo ?? data);
  },
  toggleTodo: async (id: string): Promise<Todo> => {
    const { data } = await http.patch(`/todos/${id}/toggle`);
    return TodoSchema.parse(data.todo ?? data);
  },
  deleteTodo: async (id: string): Promise<void> => {
    await http.delete(`/todos/${id}`);
  },
};