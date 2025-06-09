
'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockSupporters } from '@/lib/mock-data';
import { Heart, TrendingUp, Users, Award, ShieldCheck, HeartHandshake } from 'lucide-react';

export function SupporterShowcase() {
  const totalSupporters = 15087; // Example data
  const milestonesReached = 3; // Example data
  const campaignsFunded = "120+";
  const livesImpacted = "50,000+";


  const duplicatedSupporters = [...mockSupporters]; // For continuous scroll effect

  const statItems = [
    { id: 'supporters', label: 'Total Supporters', value: totalSupporters.toLocaleString(), Icon: Users },
    { id: 'milestones', label: 'Milestones Reached', value: milestonesReached.toLocaleString(), Icon: Award },
    { id: 'funded', label: 'Campaigns Funded', value: campaignsFunded, Icon: ShieldCheck },
    { id: 'impacted', label: 'Lives Impacted', value: livesImpacted, Icon: HeartHandshake },
  ];

  return (
    <section className="py-16 md:py-24 mt-16 md:mt-24 overflow-hidden rounded-lg relative z-0">
      <div className="relative z-1 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 flex flex-col gap-4 md:gap-0 md:flex-row items-center justify-center">
            <Heart className="mr-3 h-10 w-10 text-primary" />
            Our Amazing Supporters
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every signature, every share, every donation fuels change. See the collective power of our community.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-start mb-12"> {/* Changed items-center to items-start for better alignment if cards have different heights */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 rounded-xl shadow-2xl border border-primary/30"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
              <TrendingUp className="mr-3 h-7 w-7 text-primary" />
              Campaign Milestones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {statItems.map(item => (
                <div 
                  key={item.id} 
                  className="bg-card/70 backdrop-blur-sm p-5 rounded-lg shadow-lg text-center transform hover:scale-105 transition-transform duration-300 border border-border/50"
                >
                  <item.Icon className="h-10 w-10 text-accent mx-auto mb-3" />
                  <p className="text-3xl lg:text-4xl font-extrabold text-primary mb-1">{item.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="h-96 md:h-full overflow-hidden relative bg-card p-4 rounded-xl shadow-lg border border-border/50" // Matched rounded-xl and added border
            aria-label="Scrolling list of supporters"
          >
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]">
              <motion.div
                className="flex flex-col space-y-2 p-2" // Added some padding for scroll items
                animate={{ y: ['0%', `-${100 - (100 * 24 / (duplicatedSupporters.length * 3.5))}%`] }} // Adjusted animation for better full scroll feel
                transition={{ duration: duplicatedSupporters.length * 0.8, repeat: Infinity, ease: 'linear' }} // Adjusted duration
              >
                {duplicatedSupporters.map((supporter, index) => (
                  <div key={`${supporter.id}-${index}`} className="flex items-center p-3 bg-secondary rounded-md shadow-sm">
                    <Avatar className="h-10 w-10 mr-3 border-2 border-primary/50">
                      <AvatarImage src={supporter.avatarUrl} alt={supporter.name} data-ai-hint="person avatar" />
                      <AvatarFallback>{supporter.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{supporter.name}</p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>{supporter.contribution}</p>
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
