import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});
type FormData = z.infer<typeof schema>;

export default function Reset() {
  const [params] = useSearchParams();
  const presetToken = params.get('token') ?? '';
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  if (presetToken) setValue('token', presetToken);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => api.reset(data),
    onSuccess: (res) => {
      setAuth(res.user, res.token);
      navigate('/todos');
    },
  });

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div>
          <label>Reset Token</label>
          <input type="text" {...register('token')} />
          {errors.token && <small style={{ color: 'red' }}>{errors.token.message}</small>}
        </div>
        <div>
          <label>New Password</label>
          <input type="password" {...register('password')} />
          {errors.password && <small style={{ color: 'red' }}>{errors.password.message}</small>}
        </div>
        <button type="submit" disabled={mutation.isPending}>Reset Password</button>
        {mutation.isError && <p style={{ color: 'red' }}>Reset failed</p>}
      </form>
      <p style={{ marginTop: 20 }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}