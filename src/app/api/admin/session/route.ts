import { checkAdminAuth } from '@/lib/actions';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authed = await checkAdminAuth();
  return NextResponse.json({ authed });
}
