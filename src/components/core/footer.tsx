
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-lg font-semibold">RiseForGood</p>
        <p className="text-sm text-muted-foreground mt-2">
          &copy; {new Date().getFullYear()} RiseForGood. All rights reserved.
        </p>
        <div className="mt-4 space-x-4">
          <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
}
