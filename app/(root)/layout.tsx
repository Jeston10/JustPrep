import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import SettingsMenu from '@/components/SettingsMenu';
import { FiHome, FiUser } from 'react-icons/fi';
import DynamicQuote from '@/components/DynamicQuote';
import AIChatbot from '@/components/AIChatbot';

const PUBLIC_ROUTES = ['/sign-in', '/sign-up'];

const Rootlayout = async ({children}: {children:ReactNode}) => {
  const headersList =await headers();
  const currentPath = headersList.get("x-next-url") || "/";

  // Skip auth check for public pages
  if (!PUBLIC_ROUTES.includes(currentPath)) {
    const isUserAuthenticated = await isAuthenticated();

    if(!isUserAuthenticated) {
      redirect('/sign-in');
    }
  }

  // Restore to simple layout
  return (
    <div className="root-layout">
      <nav className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="logo" height={32} width={38}/>
            <h2 className="text-primary-100">JustPrep</h2>
          </Link>
          <DynamicQuote />
        </div>
        <div className="flex gap-2 items-center">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-primary-100 px-4 py-2 rounded-full hover:bg-primary-200/20 transition"
            aria-label="Home"
          >
            <FiHome className="text-xl" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 font-bold text-primary-100 px-4 py-2 rounded-full hover:bg-primary-200/20 transition"
            aria-label="Profile"
          >
            <FiUser className="text-xl" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <SettingsMenu />
        </div>
      </nav>
      {children}
      <footer className="mt-16 py-8 border-t border-primary-200/30 text-center text-light-400 text-sm flex flex-col items-center gap-1">
        <span>&copy; {new Date().getFullYear()} JustPrep™. All rights reserved.</span>
        <span>Contact: <a href="mailto:sjestonsingh@gmail.com" className="underline hover:text-primary-100">sjestonsingh@gmail.com</a></span>
        <span>Created by <b>S.Jeston Singh</b></span>
      </footer>
      <AIChatbot />
    </div>
  );
}

export default Rootlayout;
