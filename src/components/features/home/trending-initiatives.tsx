'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { InitiativeCard } from '@/components/shared/initiative-card';
import { mockPetitions, mockCampaigns } from '@/lib/mock-data';
import type { Petition, Campaign } from '@/types';
import { InitiativeType } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flame } from 'lucide-react';

export function TrendingInitiatives() {
  const [activeTab, setActiveTab] = useState<'petitions' | 'campaigns'>('petitions');

  // Get top 3 trending items (mocked)
  const trendingPetitions = mockPetitions.slice(0, 3);
  const trendingCampaigns = mockCampaigns.slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-16 md:py-24 bg-secondary rounded-lg mt-16 md:mt-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 flex items-center justify-center">
            <Flame className="mr-3 h-10 w-10 text-primary" />
            Trending Initiatives
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Discover petitions and campaigns gaining momentum and making waves. Your support can amplify their impact!
          </p>
        </motion.div>

        <Tabs defaultValue="petitions" className="w-full" onValueChange={(value) => setActiveTab(value as 'petitions' | 'campaigns')}>
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto mb-8">
            <TabsTrigger value="petitions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Petitions</TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Campaigns</TabsTrigger>
          </TabsList>
          <TabsContent value="petitions">
            <motion.div
              key="petitions"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {trendingPetitions.map((petition) => (
                <motion.div key={petition.id} variants={itemVariants}>
                  <InitiativeCard item={petition} type={InitiativeType.Petition} />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
          <TabsContent value="campaigns">
            <motion.div
              key="campaigns"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {trendingCampaigns.map((campaign) => (
                <motion.div key={campaign.id} variants={itemVariants}>
                  <InitiativeCard item={campaign} type={InitiativeType.Campaign} />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
