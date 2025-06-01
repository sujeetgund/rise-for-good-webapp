'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { InitiativeCard } from '@/components/shared/initiative-card';
import { FilterControls } from '@/components/shared/filter-controls';
import { mockCampaigns } from '@/lib/mock-data';
import type { Campaign } from '@/types';
import { InitiativeType } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function CampaignsPage() {
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFilteredCampaigns(mockCampaigns);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleFilterChange = (filters: Record<string, string>) => {
    setIsLoading(true);
    // Mock filtering logic
    let tempCampaigns = mockCampaigns;
     if (filters.searchTerm) {
      tempCampaigns = tempCampaigns.filter(c => 
        c.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    if (filters.category) {
      tempCampaigns = tempCampaigns.filter(c => c.category === filters.category);
    }
    if (filters.location) {
      tempCampaigns = tempCampaigns.filter(c => c.location === filters.location || c.location === "Global" || filters.location === "Global");
    }
    // Add sorting for recency/popularity if needed
    
    setTimeout(() => { // Simulate API delay
      setFilteredCampaigns(tempCampaigns);
      setIsLoading(false);
    }, 300);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };
  
  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-6 bg-card rounded-lg shadow"
      >
        <div>
          <h1 className="text-4xl font-bold text-primary">Browse Campaigns</h1>
          <p className="text-muted-foreground mt-2">Support verified causes and help fund important initiatives.</p>
        </div>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 btn-glow-accent">
          <Link href="/campaigns/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Start New Campaign
          </Link>
        </Button>
      </motion.div>

      <FilterControls type={InitiativeType.Campaign} onFilterChange={handleFilterChange} />

      {isLoading ? (
         <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" animate="visible">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div key={`skeleton-camp-${index}`} variants={itemVariants} className="bg-card p-6 rounded-lg shadow-md animate-pulse">
              <div className="h-48 bg-muted rounded mb-4"></div>
              <div className="h-6 w-3/4 bg-muted rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-muted rounded mb-4"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
            </motion.div>
          ))}
        </motion.div>
      ) : filteredCampaigns.length > 0 ? (
        <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" animate="visible">
          {filteredCampaigns.map((campaign) => (
            <motion.div key={campaign.id} variants={itemVariants}>
              <InitiativeCard item={campaign} type={InitiativeType.Campaign} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground text-xl py-12"
        >
          No campaigns found matching your criteria. Try adjusting your filters.
        </motion.p>
      )}
    </div>
  );
}
