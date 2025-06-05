
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createCheckoutSession } from '@/actions/stripe-actions';
import { getImageGenerationCredits } from '@/actions/user-credits';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, CreditCard, AlertCircle, ShoppingBag } from 'lucide-react';

// IMPORTANT: Replace these with your actual Price IDs from your Stripe Dashboard
// You should store these in .env variables as shown in the .env example.
const PRICE_ID_15_CREDITS = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_15_CREDITS || 'price_placeholder_15_credits';
const PRICE_ID_25_CREDITS = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_25_CREDITS || 'price_placeholder_25_credits';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: string; // e.g., "₹35"
  priceId: string;
  description: string;
  features: string[];
  icon: React.ElementType;
}

const creditPackages: CreditPackage[] = [
  {
    id: 'pkg1',
    name: 'Starter Pack',
    credits: 15,
    price: '₹35',
    priceId: PRICE_ID_15_CREDITS,
    description: 'A boost for your creative needs.',
    features: ['15 AI Image Credits', 'Perfect for small projects', 'One-time purchase'],
    icon: Sparkles,
  },
  {
    id: 'pkg2',
    name: 'Creator Pack',
    credits: 25,
    price: '₹50',
    priceId: PRICE_ID_25_CREDITS,
    description: 'Unleash your creativity with more power.',
    features: ['25 AI Image Credits', 'Best value for frequent users', 'One-time purchase'],
    icon: ShoppingBag,
  },
];

export default function BuyCreditsPage() {
  const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [currentCredits, setCurrentCredits] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null); // Store priceId being processed

  useEffect(() => {
    if (!isUserLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/buy-credits');
      return;
    }

    const fetchCredits = async () => {
      setIsLoadingCredits(true);
      try {
        const credits = await getImageGenerationCredits();
        setCurrentCredits(credits);
      } catch (error) {
        console.error('Failed to fetch current credits:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch your current credit balance.',
        });
      } finally {
        setIsLoadingCredits(false);
      }
    };

    fetchCredits();
  }, [isSignedIn, isUserLoaded, router, toast]);

  const handleBuyCredits = async (priceId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to purchase credits.' });
      return;
    }
    if (priceId.includes('placeholder')) {
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'Stripe Price ID is not configured. Please contact support.',
        });
        return;
    }

    setIsProcessingPayment(priceId);
    try {
      const response = await createCheckoutSession(priceId);
      if (response.error) {
        toast({ variant: 'destructive', title: 'Payment Error', description: response.error });
      } else if (response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        toast({ variant: 'destructive', title: 'Payment Error', description: 'Could not initiate payment. Please try again.' });
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsProcessingPayment(null);
    }
  };
  
  if (!isUserLoaded || isLoadingCredits) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-12 px-4"
    >
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Buy More Image Credits</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Need more creative power? Top up your AI image generation credits and keep your ideas flowing.
        </p>
        {currentCredits !== null && (
          <div className="mt-6 text-xl font-semibold flex items-center justify-center">
            <CreditCard className="h-6 w-6 mr-2 text-accent" />
            Your Current Balance: <span className="text-accent mx-1">{currentCredits}</span> credits
          </div>
        )}
      </header>

      {/* Placeholder: Visually appealing UI for credit packages will be implemented in the next step */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {creditPackages.map((pkg) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 * creditPackages.indexOf(pkg) }}
          >
            <Card className="flex flex-col h-full overflow-hidden shadow-xl hover:shadow-primary/30 transition-shadow duration-300 border-2 border-transparent hover:border-primary">
              <CardHeader className="bg-gradient-to-br from-primary to-accent p-6">
                <div className="flex items-center gap-3">
                    <pkg.icon className="h-10 w-10 text-primary-foreground" />
                    <div>
                        <CardTitle className="text-3xl font-bold text-primary-foreground">{pkg.name}</CardTitle>
                        <CardDescription className="text-primary-foreground/80">{pkg.description}</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <div className="text-center mb-6">
                    <span className="text-5xl font-extrabold text-foreground">{pkg.price}</span>
                    <span className="text-2xl text-muted-foreground"> / {pkg.credits} Credits</span>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-accent flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 bg-secondary/30">
                <Button
                  onClick={() => handleBuyCredits(pkg.priceId)}
                  disabled={isProcessingPayment !== null || pkg.priceId.includes('placeholder')}
                  size="lg"
                  className="w-full bg-primary text-primary-foreground btn-glow-primary text-lg"
                >
                  {isProcessingPayment === pkg.priceId ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingBag className="mr-2 h-5 w-5" />
                  )}
                  {isProcessingPayment === pkg.priceId ? 'Processing...' : `Buy ${pkg.credits} Credits`}
                </Button>
              </CardFooter>
                 {pkg.priceId.includes('placeholder') && (
                    <div className="p-3 text-xs text-center text-destructive bg-destructive/10">
                        <AlertCircle size={14} className="inline mr-1" /> Developer Note: Stripe Price ID for this package is not configured.
                    </div>
                )}
            </Card>
          </motion.div>
        ))}
      </div>
       <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Payments are securely processed by Stripe. Credits are added to your account immediately after successful payment.</p>
          <p>All purchases are final and non-refundable.</p>
        </div>
    </motion.div>
  );
}
