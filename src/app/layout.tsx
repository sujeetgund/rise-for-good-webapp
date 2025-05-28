import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google'; // Corrected import, Geist is default export
import './globals.css';
import { Navbar } from '@/components/core/navbar';
import { Footer } from '@/components/core/footer';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({ // Corrected instantiation
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RiseForGood - Ignite Change',
  description: 'A platform for social activism. Create and support petitions, start and donate to fundraisers for causes that matter.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined, // Let Clerk auto-detect based on system or use path specific themes
        variables: {
          colorPrimary: '#E63946', // RiseForGood Primary Red
          colorBackground: '#1D232A', // A slightly off-black for Clerk components if needed
          colorText: '#F1FAEE',
          colorInputBackground: '#2A303C',
          colorInputText: '#F1FAEE',
        },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground btn-glow-primary',
          card: 'bg-card border-border shadow-lg',
          headerTitle: 'text-foreground font-bold',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'border-border hover:bg-secondary',
          dividerLine: 'bg-border',
          formFieldLabel: 'text-foreground',
          formFieldInput: 'bg-input border-border text-foreground focus:ring-ring focus:border-ring',
          footerActionLink: 'text-primary hover:text-primary/80',
        }
      }}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
          <Navbar />
          <main className="flex-grow container mx-auto px-4">
            {children}
          </main>
          <Footer />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
