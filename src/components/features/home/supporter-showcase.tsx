'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockSupporters } from '@/lib/mock-data';
import { Heart, TrendingUp } from 'lucide-react';

export function SupporterShowcase() {
  const totalSupporters = 15087; // Example data
  const milestonesReached = 3; // Example data

  const duplicatedSupporters = [...mockSupporters, ...mockSupporters]; // For continuous scroll effect

  return (
    <section className="py-16 md:py-24 mt-16 md:mt-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 flex items-center justify-center">
            <Heart className="mr-3 h-10 w-10 text-primary" />
            Our Amazing Supporters
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every signature, every share, every donation fuels change. See the collective power of our community.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="bg-card p-8 rounded-lg shadow-lg"
          >
            <h3 className="text-2xl font-semibold text-primary mb-4 flex items-center">
              <TrendingUp className="mr-2 h-6 w-6" />
              Campaign Milestones
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Supporters:</span>
                <span className="text-2xl font-bold text-accent">{totalSupporters.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Milestones Reached:</span>
                <span className="text-2xl font-bold text-accent">{milestonesReached}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Campaigns Funded:</span>
                <span className="text-2xl font-bold text-accent">120+</span>
              </div>
               <div className="flex justify-between items-center">
                <span className="text-lg">Lives Impacted:</span>
                <span className="text-2xl font-bold text-accent">50,000+</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="h-64 overflow-hidden relative bg-card p-4 rounded-lg shadow-lg"
            aria-label="Scrolling list of supporters"
          >
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]">
              <motion.div
                className="flex flex-col space-y-2"
                animate={{ y: ['0%', '-50%'] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                {duplicatedSupporters.map((supporter) => (
                  <div key={supporter.id} className="flex items-center p-2 bg-secondary rounded-md shadow-sm">
                    <Avatar className="h-10 w-10 mr-3 border-2 border-primary">
                      <AvatarImage src={supporter.avatarUrl} alt={supporter.name} data-ai-hint="person avatar" />
                      <AvatarFallback>{supporter.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{supporter.name}</p>
                      <p className="text-xs text-muted-foreground">{supporter.contribution}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
