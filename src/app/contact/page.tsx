
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Mail, MessageSquare, Info, Linkedin, Twitter, Facebook } from 'lucide-react';
import Image from 'next/image'; // Import next/image

export default function ContactPage() {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-12 px-4"
    >
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Get in Touch</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We&apos;re here to listen and help. Explore the ways you can connect with RiseForGood.
        </p>
      </header>

      <div className="mt-12 flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-xl" // Control card width
        >
          <Card className="shadow-xl border-border/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6">
              <CardTitle className="text-2xl flex items-center text-foreground">
                <Info className="mr-3 h-7 w-7 text-accent" />
                Connect With RiseForGood
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                We&apos;re here to help and listen. Find the best way to reach us below.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8 text-foreground">
              <div className="flex items-start space-x-4">
                <Mail className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">General Inquiries</h3>
                  <p className="text-muted-foreground">For general questions or information.</p>
                  <a href="mailto:info@riseforgood.org" className="text-accent hover:underline">info@riseforgood.org</a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MessageSquare className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Support</h3>
                  <p className="text-muted-foreground">Need help with the platform?</p>
                  <a href="mailto:support@riseforgood.org" className="text-accent hover:underline">support@riseforgood.org</a>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <Button variant="outline" size="icon" className="group btn-glow-accent hover:border-accent" asChild>
                    <a href="https://twitter.com/riseforgood" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                      <Twitter className="h-5 w-5 text-accent group-hover:text-accent-foreground" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" className="group btn-glow-accent hover:border-accent" asChild>
                    <a href="https://facebook.com/riseforgood" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                      <Facebook className="h-5 w-5 text-accent group-hover:text-accent-foreground" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" className="group btn-glow-accent hover:border-accent" asChild>
                    <a href="https://linkedin.com/company/riseforgood" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                      <Linkedin className="h-5 w-5 text-accent group-hover:text-accent-foreground" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="mt-8 text-center">
                <Image 
                  src="/contact-page-image.png" 
                  alt="Our Community Hub" 
                  width={420}
                  height={280}
                  className="rounded-lg shadow-md mx-auto object-cover" 
                />
                <p className="text-sm text-muted-foreground mt-3">Join the movement for a better world.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
