import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/actions/auth.action';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const Rootlayout = async ({ children }: { children: ReactNode }) => {
  const headersList = await headers();

  const currentPath = headersList.get('x-invoke-path') || headersList.get('x-next-url') || ''; // fallback
  const isUserAuthenticated = await isAuthenticated();

  const publicRoutes = ['/sign-in', '/sign-up'];
  const isPublic = publicRoutes.some(route => currentPath.includes(route));

  if (!isUserAuthenticated && !isPublic) {
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
