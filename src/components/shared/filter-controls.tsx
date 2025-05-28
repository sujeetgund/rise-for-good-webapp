'use client';

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PETITION_CATEGORIES, CAMPAIGN_CATEGORIES, LOCATIONS, POPULARITY_OPTIONS, RECENCY_OPTIONS } from "@/lib/constants";
import { InitiativeType } from "@/types";
import { Search, FilterX } from "lucide-react";

interface FilterControlsProps {
  type: InitiativeType;
  onFilterChange: (filters: Record<string, string>) => void;
  // Add other props like current filter values if needed for controlled component
}

export function FilterControls({ type, onFilterChange }: FilterControlsProps) {
  const categories = type === InitiativeType.Petition ? PETITION_CATEGORIES : CAMPAIGN_CATEGORIES;

  // Placeholder for actual filter state and logic
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const filters: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (value && typeof value === 'string') {
        filters[key] = value;
      }
    });
    onFilterChange(filters);
  };
  
  const clearFilters = () => {
    // TODO: Reset form fields and call onFilterChange with empty filters
    const form = document.getElementById('filter-form') as HTMLFormElement;
    if (form) {
      form.reset();
    }
    onFilterChange({});
  }

  return (
    <form id="filter-form" onSubmit={handleSearch} className="mb-8 p-6 bg-card rounded-lg shadow-md space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Input
          name="searchTerm"
          type="search"
          placeholder={`Search ${type}s...`}
          className="text-base"
          aria-label={`Search ${type}s`}
        />
        <Select name="category">
          <SelectTrigger className="text-base">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="">All Categories</SelectItem> */}
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="location">
          <SelectTrigger className="text-base">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="">All Locations</SelectItem> */}
            {LOCATIONS.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="recency">
          <SelectTrigger className="text-base">
            <SelectValue placeholder="Sort by Recency" />
          </SelectTrigger>
          <SelectContent>
            {RECENCY_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="popularity">
          <SelectTrigger className="text-base">
            <SelectValue placeholder="Sort by Popularity" />
          </SelectTrigger>
          <SelectContent>
            {POPULARITY_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={clearFilters} className="text-base btn-glow-accent hover:border-accent">
          <FilterX className="mr-2 h-4 w-4" /> Clear Filters
        </Button>
        <Button type="submit" className="bg-primary text-primary-foreground text-base btn-glow-primary">
          <Search className="mr-2 h-4 w-4" /> Apply Filters
        </Button>
      </div>
    </form>
  );
}
