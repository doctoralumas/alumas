import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return NextResponse.json({ error: 'Sistem hatası: JWT anahtarı eksik' }, { status: 500 });

  // NextAuth ID'sini custom_id olarak gömüyoruz.
  const token = jwt.sign(
    {
      role: 'authenticated',
      custom_id: u.id,
      email: u.email
    },
    secret,
    { expiresIn: '1h' }
  );

  return NextResponse.json({ token });
}
