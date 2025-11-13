import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { Link, useNavigate } from 'react-router-dom';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});
type FormData = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await signup(data.name, data.email, data.password);
    },
    onSuccess: () => navigate('/todos'),
  });

  return (
    <div className="container-narrow min-h-screen flex items-center">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted">Join and start organizing your todos</p>
        </div>

        <div className="card">
          <form className="p-6 space-y-4" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="input" type="text" placeholder="Your name" {...register('name')} />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
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

            <button className="btn btn-primary text-center w-full" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating account…' : 'Create account'}
            </button>
            {mutation.isError && (
              <p className="text-sm text-red-600">Signup failed. Please try again.</p>
            )}
          </form>
        </div>

        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link className="text-brand hover:underline" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}