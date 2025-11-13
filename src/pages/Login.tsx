import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { Link, useNavigate } from 'react-router-dom';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const setLogin = useAuthStore((s) => s.login);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await setLogin(data.email, data.password);
    },
    onSuccess: () => {
      navigate('/todos');
    }
  });

  return (
    <div className="container-narrow min-h-screen flex items-center">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted">Sign in to continue to your todos</p>
        </div>

        <div className="card">
          <div className="space-y-4">
            <form className="p-6 space-y-4" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input className="input" type="email" placeholder="you@example.com" {...register('email')} />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input className="input" type="password" placeholder="••••••••" {...register('password')} />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <button className="btn text-center btn-primary w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Signing in…' : 'Sign in'}
              </button>
              {mutation.isError && (
                <p className="text-sm text-red-600">Login failed. Please check your credentials.</p>
              )}
            </form>
          </div>
        </div>

        <p className="mt-4 text-center text-sm">
          <Link className="text-brand hover:underline" to="/signup">Create account</Link>
          <span className="text-muted"> · </span>
          <Link className="text-brand hover:underline" to="/forgot">Forgot password</Link>
        </p>
      </div>
    </div>
  );
}