"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { INSPIRING_MESSAGES } from "@/lib/constants";
import { ChevronRight } from "lucide-react";

export function HeroSection() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMessageIndex(
        (prevIndex) => (prevIndex + 1) % INSPIRING_MESSAGES.length
      );
    }, 15000); // Change message every 15 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="py-20 md:py-32 text-center bg-gradient-to-br from-background to-secondary rounded-lg shadow-xl overflow-hidden">
      <div className="container mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-foreground mb-8 leading-tight"
          >
            {INSPIRING_MESSAGES[currentMessageIndex]}
          </motion.h1>
        </AnimatePresence>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
        >
          Join a community dedicated to making a difference. Create petitions,
          launch fundraisers, and support causes that shape a better tomorrow.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6"
        >
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground rounded-md text-lg px-8 py-4 btn-glow-primary transform hover:scale-105 transition-transform duration-300"
          >
            <Link href="/petitions/create">
              Create a Petition <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-md text-lg px-8 py-4 btn-glow-accent transform hover:scale-105 transition-transform duration-300"
          >
            <Link href="/campaigns/create">
              Start a Fundraiser <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
