
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // Added
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
    <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden"> {/* Adjusted padding slightly */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 md:gap-16"> {/* Changed items-center to items-start */}
          {/* Text Content Column */}
          <div className="md:w-1/2 lg:w-[55%] text-center md:text-left"> {/* Slightly more width for text */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-foreground mb-8 leading-tight min-h-[135px] sm:min-h-[180px] lg:min-h-[225px] flex flex-col justify-end"
              >
                {INSPIRING_MESSAGES[currentMessageIndex]}
              </motion.h1>
            </AnimatePresence>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto md:mx-0" // max-w-xl for better readability
            >
              Join a community dedicated to making a difference. Create petitions,
              launch fundraisers, and support causes that shape a better tomorrow.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center md:justify-start items-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground rounded-md text-lg px-8 py-4 btn-glow-primary transform hover:scale-105 transition-transform duration-300 w-full sm:w-auto"
              >
                <Link href="/petitions/create">
                  Create a Petition <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-md text-lg px-8 py-4 btn-glow-accent transform hover:scale-105 transition-transform duration-300 w-full sm:w-auto"
              >
                <Link href="/campaigns/create">
                  Start a Fundraiser <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Image Column */}
          <motion.div 
            className="w-full max-w-md md:max-w-none md:w-1/2 lg:w-[45%] mt-12 md:mt-8" // Changed md:mt-0 to md:mt-8
            initial={{ opacity: 0, scale: 0.85, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, type: "spring", stiffness: 100, damping: 15 }}
          >
            <div className="relative aspect-[4/3] rounded-xl shadow-2xl overflow-hidden border-2 border-primary/20 hover:shadow-primary/30 transition-shadow duration-300 group">
              <Image
                src="/hero-image.png"
                alt="A diverse group of people collaborating for good causes"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                priority
                sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 40vw"
                data-ai-hint="community collaboration"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
