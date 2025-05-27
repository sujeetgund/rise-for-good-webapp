import { HeroSection } from '@/components/features/home/hero-section';
import { TrendingInitiatives } from '@/components/features/home/trending-initiatives';
import { SupporterShowcase } from '@/components/features/home/supporter-showcase';

export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-24">
      <HeroSection />
      <TrendingInitiatives />
      <SupporterShowcase />
    </div>
  );
}
