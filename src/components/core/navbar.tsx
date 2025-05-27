'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/petitions', label: 'Petitions' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/profile', label: 'Profile', requiresAuth: true },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
          RiseForGood
        </Link>
        
        <div className="flex items-center space-x-6">
          {navLinks.map((link) => {
            if (link.requiresAuth) {
              return (
                <SignedIn key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'text-lg hover:text-primary transition-colors',
                      pathname === link.href ? 'text-primary font-semibold' : 'text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                </SignedIn>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-lg hover:text-primary transition-colors',
                  pathname === link.href ? 'text-primary font-semibold' : 'text-foreground'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Button asChild variant="ghost" className="hover:bg-accent hover:text-accent-foreground btn-glow-accent">
              <Link href="/sign-in">Login</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground btn-glow-primary">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
