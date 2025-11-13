import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function Forgot() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const mutation = useMutation({
    mutationFn: async (data: FormData) => api.forgot(data),
  });

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>Forgot Password</h2>
      <p>Enter your email to request a reset token.</p>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div>
          <label>Email</label>
          <input type="email" {...register('email')} />
          {errors.email && <small style={{ color: 'red' }}>{errors.email.message}</small>}
        </div>
        <button type="submit" disabled={mutation.isPending}>Request reset</button>
      </form>
      {mutation.data && 'resetToken' in mutation.data && (
        <div style={{ marginTop: 20 }}>
          <p>Reset Token (for testing):</p>
          <code>{mutation.data.resetToken}</code>
          <p>
            Use it on the <Link to="/reset">Reset Password</Link> page.
          </p>
        </div>
      )}
      <p style={{ marginTop: 20 }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}