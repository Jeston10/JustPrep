import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

const Rootlayout = async ({ children }: { children: ReactNode }) => {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || ''; // fallback to empty if missing

  const isUserAuthenticated = await isAuthenticated();

  // Skip auth redirect on public routes
  const publicRoutes = ['/sign-in', '/sign-up']; // add more as needed
  if (!isUserAuthenticated && !publicRoutes.includes(pathname)) {
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
