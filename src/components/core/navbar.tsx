
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "@/components/core/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/petitions", label: "Petitions" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/profile", label: "Profile", requiresAuth: true },
];

export function Navbar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const navbarElement = document.getElementById("main-navbar");
    if (navbarElement) {
      setNavbarHeight(navbarElement.offsetHeight);
    }
  }, []);

  useEffect(() => {
    // Close sheet on navigation
    if (isSheetOpen) {
      setIsSheetOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);


  const NavLinkItems = () => (
    <>
      {navLinks.map((link) => {
        const isActive = isMounted && pathname === link.href;
        if (link.requiresAuth) {
          return (
            <SignedIn key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "text-lg hover:text-primary transition-colors",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-foreground"
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
              "text-lg hover:text-primary transition-colors",
              isActive
                ? "text-primary font-semibold"
                : "text-foreground"
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
        <Button
          asChild
          variant="ghost"
          className="hover:bg-accent hover:text-accent-foreground btn-glow-accent"
        >
          <Link href="/sign-in">Login</Link>
        </Button>
        <Button
          asChild
          className="bg-primary text-primary-foreground btn-glow-primary"
        >
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </SignedOut>
    </>
  );

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-md shadow-md"
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Logo />

        {isMounted ? (
            isMobile ? (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full max-w-xs bg-background p-6"
                >
                  <div className="flex flex-col items-start space-y-6">
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="self-end">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
                      </Button>
                    </SheetClose>
                    <Logo />
                    <nav className="flex flex-col space-y-4 w-full">
                      <NavLinkItems />
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <nav className="flex items-center space-x-6">
                <NavLinkItems />
              </nav>
            )
        ) : (
          // Consistent placeholder for SSR & pre-mount to avoid layout shifts.
          // This placeholder is for the navigation area.
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="h-5 w-16 bg-muted rounded animate-pulse hidden sm:block"></div>
            <div className="h-5 w-16 bg-muted rounded animate-pulse hidden sm:block"></div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse hidden sm:block"></div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse sm:hidden"></div> {/* Placeholder for mobile menu icon */}
          </div>
        )}
      </div>
    </header>
  );
}
