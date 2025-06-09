
import Link from 'next/link';
import Image from 'next/image';
import type { Initiative, Petition, Campaign } from '@/types';
import { InitiativeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Target, DollarSign, Edit3 } from 'lucide-react';

interface InitiativeCardProps {
  item: Initiative;
  type: InitiativeType;
}

const getInitials = (title: string, count = 3): string => {
  if (!title) return '';
  return title
    .split(/\s+/) // Split by any whitespace
    .slice(0, count)
    .map((word) => word[0]?.toUpperCase())
    .filter(initial => !!initial) // Remove undefined if word is empty
    .join('');
};


export function InitiativeCard({ item, type }: InitiativeCardProps) {
  const isPetition = type === InitiativeType.Petition;
  const petition = isPetition ? (item as Petition) : null;
  const campaign = !isPetition ? (item as Campaign) : null;

  const detailUrl = `/${type}s/${item.id}`;

  const progressValue = petition
    ? petition.goal > 0 ? (petition.supporters / petition.goal) * 100 : 0
    : campaign
    ? campaign.goalAmount > 0 ? (campaign.raisedAmount / campaign.goalAmount) * 100 : 0
    : 0;

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-xl transition-shadow duration-300 hover:border-primary/50">
      <CardHeader className="p-0">
        <Link href={detailUrl} className="block group relative">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={600}
              height={160} // Consistent with h-40
              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={type === InitiativeType.Petition ? "petition protest" : "charity fundraiser"}
            />
          ) : (
            <div className="w-full h-40 bg-secondary flex items-center justify-center text-4xl font-bold text-primary-foreground group-hover:bg-secondary/90 transition-colors">
              {getInitials(item.title)}
            </div>
          )}
          <Badge variant="secondary" className="absolute top-2 right-2 shadow-md bg-card/80 backdrop-blur-sm">
            {item.category}
          </Badge>
        </Link>
        <div className="p-4 pb-2">
          <CardTitle className="text-xl font-bold leading-tight hover:text-primary transition-colors">
            <Link href={detailUrl}>{item.title}</Link>
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-1">
            {item.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-2 flex flex-col justify-between">
        <div> {/* Wrapper for top content (author, stats) */}
          <div className="flex items-center text-muted-foreground text-sm mb-2">
            {isPetition ? <Edit3 className="mr-2 h-4 w-4 text-primary" /> : <Users className="mr-2 h-4 w-4 text-primary" />}
            <span>{isPetition ? `By: ${petition?.author.username}` : `Organizer: ${campaign?.organizer.username}`}</span>
          </div>

          {isPetition && petition && (
            <div className="space-y-1 text-sm mb-3">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-accent flex-shrink-0" />
                <span className="font-semibold">{petition.supporters.toLocaleString()}</span>
                <span className="ml-1 text-muted-foreground">/ {petition.goal.toLocaleString()} goal</span>
              </div>
            </div>
          )}
          {campaign && (
            <div className="space-y-1 text-sm mb-3">
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-accent flex-shrink-0" />
                <span className="font-semibold">${campaign.raisedAmount.toLocaleString()}</span>
                <span className="ml-1 text-muted-foreground">/ ${campaign.goalAmount.toLocaleString()} goal</span>
              </div>
            </div>
          )}
        </div>

        { (petition || campaign) &&
          <div> {/* Wrapper for progress bar, pushed to bottom by justify-between */}
            <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% progress`} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{progressValue.toFixed(0)}% Reached</p>
          </div>
        }
      </CardContent>
      <CardFooter className="p-4 pt-2">
        <Button asChild className="w-full bg-primary text-primary-foreground btn-glow-primary">
          <Link href={detailUrl}>{isPetition ? 'View Petition' : 'Support Campaign'}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
