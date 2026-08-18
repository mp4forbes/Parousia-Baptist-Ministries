import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function MinistriesIndexPage() {
  redirect('/ministries/women');
}
