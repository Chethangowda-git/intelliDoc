import { User } from '../models/User.js';

export async function authRoutes(fastify) {
  // Register
  fastify.post('/api/auth/register', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password)
      return reply.status(400).send({ error: 'Email and password required' });

    if (password.length < 6)
      return reply.status(400).send({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email });
    if (existing)
      return reply.status(409).send({ error: 'Email already in use' });

    const user = new User({ email, password });
    await user.save();

    const token = fastify.jwt.sign({ userId: user._id, email: user.email });
    return reply.status(201).send({ token, user: { id: user._id, email: user.email } });
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password)
      return reply.status(400).send({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user)
      return reply.status(401).send({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid)
      return reply.status(401).send({ error: 'Invalid credentials' });

    const token = fastify.jwt.sign({ userId: user._id, email: user.email });
    return reply.send({ token, user: { id: user._id, email: user.email } });
  });
}