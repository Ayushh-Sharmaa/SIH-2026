'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#EFE9E1] px-4">
      <div className="size-10 animate-spin rounded-full border-4 border-[#72383D] border-t-transparent" />
      <p className="text-sm font-semibold text-[#6F645B]">Redirecting to sign-in…</p>
    </div>
  );
}
