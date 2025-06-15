import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const Rootlayout = async ({ children }: { children: ReactNode }) => {
  const referer = (await headers()).get('referer') || '';

  // If user is not authenticated and NOT already on /sign-in
  const isUserAuthenticated = await isAuthenticated();

  const isSignInPage = referer.includes('/sign-in'); // basic check

  if (!isUserAuthenticated && !isSignInPage) {
    redirect('/sign-in');
  }

  return (
    <div className="root-layout">
      <nav>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">JustPrep</h2>
        </Link>
      </nav>
      {children}
    </div>
  );
};

export default Rootlayout;
