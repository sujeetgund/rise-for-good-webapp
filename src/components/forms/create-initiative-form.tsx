
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PETITION_CATEGORIES, CAMPAIGN_CATEGORIES } from "@/lib/constants";
import { InitiativeType } from "@/types";
import {
  moderateCampaignContent,
  ModerateCampaignContentOutput,
} from "@/ai/flows/moderate-campaign-content";
import {
  generateInitiativeImage,
  GenerateInitiativeImageOutput,
} from "@/ai/flows/generate-initiative-image-flow";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Sparkles, ImagePlus, AlertCircle, LinkIcon, Wand2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchemaBase = z.object({
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters." })
    .max(100),
  description: z
    .string()
    .min(20, { message: "Description must be at least 20 characters." })
    .max(2000),
  category: z.string().min(1, { message: "Please select a category." }),
  imageUrl: z
    .string()
    .url({ message: "Please enter a valid image URL or ensure AI image is generated." })
    .optional()
    .or(z.literal("")), // Allow empty string if no image
  contentWarning: z.string().optional(),
});

const petitionSchema = formSchemaBase.extend({
  goal: z.coerce
    .number()
    .min(10, { message: "Goal must be at least 10 supporters." }),
});

const campaignSchema = formSchemaBase.extend({
  goalAmount: z.coerce
    .number()
    .min(10, { message: "Goal amount must be at least $10." }),
});

interface CreateInitiativeFormProps {
  type: InitiativeType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (
    data: any,
    moderationResult?: ModerateCampaignContentOutput
  ) => Promise<void>;
}

export function CreateInitiativeForm({
  type,
  onSubmit,
}: CreateInitiativeFormProps) {
  const { toast } = useToast();
  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] =
    useState<ModerateCampaignContentOutput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [imageInputMode, setImageInputMode] = useState<'manual' | 'ai'>('manual');
  const [manualImageUrlInput, setManualImageUrlInput] = useState("");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isProcessingManualUrl, setIsProcessingManualUrl] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);


  const currentSchema =
    type === InitiativeType.Petition ? petitionSchema : campaignSchema;
  const categories =
    type === InitiativeType.Petition
      ? PETITION_CATEGORIES
      : CAMPAIGN_CATEGORIES;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      imageUrl: "", // Default to empty, will be populated by manual or AI
      contentWarning: "",
      ...(type === InitiativeType.Petition
        ? { goal: 100 }
        : { goalAmount: 1000 }),
    },
  });

  // Effect to clear imageUrl if mode changes and no valid image is set for the new mode
  useEffect(() => {
    if (imageInputMode === 'manual' && !manualImageUrlInput.startsWith('http')) {
        // If switching to manual and input is not a valid URL (or AI image was set), clear it
        // unless manualImageUrlInput actually holds the current form.imageUrl
        if (form.getValues("imageUrl") !== manualImageUrlInput) {
             // form.setValue("imageUrl", "", { shouldValidate: false }); // Don't validate yet
            // setImagePreviewUrl(null); // Clear preview too
        }
    } else if (imageInputMode === 'ai' && !form.getValues("imageUrl")?.startsWith('data:image')) {
         // If switching to AI and current URL is not a data URI (AI image was not set or was manual)
         // No explicit clear needed here, AI gen will overwrite or it stays empty
    }
  }, [imageInputMode, form, manualImageUrlInput]);


  const handleModerateContent = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");

    if (!title || !description) {
      toast({
        variant: "destructive",
        title: "Missing Content",
        description:
          "Please fill in the title and description before moderating.",
      });
      return;
    }

    setIsModerating(true);
    setModerationResult(null);
    try {
      const result = await moderateCampaignContent({
        content: `Title: ${title}\nDescription: ${description}`,
        contentType: type,
      });
      setModerationResult(result);
      form.setValue("contentWarning", result.isAppropriate ? "" : result.reasoning.substring(0, 100) + (result.reasoning.length > 100 ? "..." : ""));

      toast({
        title: "Content Moderated",
        description: result.isAppropriate
          ? "Content looks good!"
          : "Content needs review. See suggestions below.",
      });
      if (result.revisedContent && result.isAppropriate === false) {
        const revisedParts = result.revisedContent.split("Description:");
        if (revisedParts[0]) {
          form.setValue("title", revisedParts[0].replace("Title:", "").trim());
        }
        if (revisedParts[1]) {
          form.setValue("description", revisedParts[1].trim());
        }
      }
    } catch (error) {
      console.error("Moderation error:", error);
      toast({
        variant: "destructive",
        title: "Moderation Failed",
        description: "Could not moderate content at this time.",
      });
    } finally {
      setIsModerating(false);
    }
  };

  const handleGenerateImageWithAI = async () => {
    if (!aiImagePrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Prompt",
        description: "Please enter a prompt for image generation.",
      });
      return;
    }
    setIsGeneratingImage(true);
    setImagePreviewUrl(null); 
    form.setValue("imageUrl", "", {shouldValidate: false}); // Clear previous image URL
    try {
      const result: GenerateInitiativeImageOutput = await generateInitiativeImage({ prompt: aiImagePrompt });
      form.setValue("imageUrl", result.imageDataUri, { shouldValidate: true });
      setImagePreviewUrl(result.imageDataUri);
      setManualImageUrlInput(""); // Clear manual input field
      toast({
        title: "Image Generated!",
        description: "The AI has created an image for your initiative.",
      });
    } catch (error) {
      console.error("Image generation error:", error);
      let description = "Could not generate image at this time. Please try again.";
      if (error instanceof Error && error.message.includes('safety filters')) {
        description = "Image generation failed. The prompt might have been blocked by safety filters. Please try a different prompt.";
      }
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: description,
      });
      form.setValue("imageUrl", "", { shouldValidate: true }); // Clear on failure
      setImagePreviewUrl(null);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleUseManualImageUrl = () => {
    const url = manualImageUrlInput.trim();
    setIsProcessingManualUrl(true);
    if (!url) {
      toast({
        variant: "destructive",
        title: "Missing URL",
        description: "Please enter an image URL.",
      });
      form.setValue("imageUrl", "", { shouldValidate: true });
      setImagePreviewUrl(null);
      setIsProcessingManualUrl(false);
      return;
    }
    // Basic check, Zod will do the heavy lifting
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
         toast({
            variant: "destructive",
            title: "Invalid URL Format",
            description: "Please enter a valid image URL starting with http:// or https://.",
        });
        // form.setValue("imageUrl", "", { shouldValidate: true }); // Let Zod catch this if user insists
        // setImagePreviewUrl(null); // Don't show preview for clearly invalid URL
        setIsProcessingManualUrl(false);
        return;
    }

    form.setValue("imageUrl", url, { shouldValidate: true });
    setImagePreviewUrl(url); // Optimistically show preview
    setAiImagePrompt(""); // Clear AI prompt
    toast({
      title: "Image URL Set",
      description: "Using the provided URL. Preview updated.",
    });
    setIsProcessingManualUrl(false);
  }


  const onFormSubmit = async (values: z.infer<typeof currentSchema>) => {
    setIsSubmitting(true);
    if (!moderationResult?.isAppropriate) {
      if (moderationResult && !moderationResult.isAppropriate) {
        toast({
          variant: "destructive",
          title: "Content Not Approved",
          description:
            "Please address the moderation feedback before submitting, or use the AI suggested revision. A content warning will be added based on the moderation.",
        });
        values.contentWarning = moderationResult.reasoning.substring(0, 150) + (moderationResult.reasoning.length > 150 ? "..." : "");

      } else if (!moderationResult) {
      toast({
        variant: "default",
        title: "Content Not Moderated",
        description:
          'Content has not been checked by AI. A generic warning may be applied or it might be reviewed later. Consider using "Check Content with AI".',
      });
       values.contentWarning = "Content subject to review.";
      }
    } else {
       values.contentWarning = ""; 
    }
    
    // Ensure imageUrl is empty if no valid image was actually set by user actions
    if (!imagePreviewUrl || (imageInputMode === 'manual' && form.getValues("imageUrl") !== manualImageUrlInput) || (imageInputMode === 'ai' && !form.getValues("imageUrl")?.startsWith('data:image'))) {
        // This check is a bit complex due to reactive updates.
        // Simpler: if imagePreviewUrl is null, ensure imageUrl is also considered null/empty by form
        if (!imagePreviewUrl) {
          values.imageUrl = "";
        }
    }


    await onSubmit(values, moderationResult ?? undefined);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFormSubmit)}
        className="space-y-8 p-6 md:p-8 bg-card rounded-lg shadow-xl"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Title</FormLabel>
              <FormControl>
                <Input
                  placeholder={`Enter ${type} title`}
                  {...field}
                  className="text-base"
                />
              </FormControl>
              <FormDescription>
                A clear and concise title for your {type}.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Describe your ${type} in detail...`}
                  {...field}
                  rows={8}
                  className="text-base"
                />
              </FormControl>
              <FormDescription>
                Provide all necessary information about your {type}. Be clear
                and persuasive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">
                  Category
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === InitiativeType.Petition && (
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">
                    Supporter Goal
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 1000"
                      {...field}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>
                    Number of supporters you aim to reach.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {type === InitiativeType.Campaign && (
            <FormField
              control={form.control}
              name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">
                    Funding Goal ($)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 5000"
                      {...field}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>
                    Amount of money you aim to raise.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        {/* Image Section with Tabs */}
        <FormItem>
            <FormLabel className="text-lg font-semibold">Initiative Image (Optional)</FormLabel>
            <Tabs value={imageInputMode} onValueChange={(value) => setImageInputMode(value as 'manual' | 'ai')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual"><LinkIcon className="mr-2 h-4 w-4" />Manual URL</TabsTrigger>
                    <TabsTrigger value="ai"><Wand2 className="mr-2 h-4 w-4" />Generate with AI</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="mt-4 space-y-3">
                    <Input
                        placeholder="Paste image URL here (e.g., https://example.com/image.png)"
                        value={manualImageUrlInput}
                        onChange={(e) => setManualImageUrlInput(e.target.value)}
                        className="text-base"
                        disabled={isProcessingManualUrl || isGeneratingImage}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseManualImageUrl}
                        disabled={isProcessingManualUrl || isGeneratingImage || !manualImageUrlInput.trim()}
                         className="btn-glow-accent hover:border-accent"
                    >
                        {isProcessingManualUrl ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ImagePlus className="mr-2 h-4 w-4" />
                        )}
                        Use this Image
                    </Button>
                    <FormDescription>
                      Provide a direct link to an image. Preview will appear below if valid.
                    </FormDescription>
                </TabsContent>
                <TabsContent value="ai" className="mt-4 space-y-3">
                    <Input
                        id="aiImagePrompt"
                        placeholder="e.g., 'Happy diverse community members collaborating'"
                        value={aiImagePrompt}
                        onChange={(e) => setAiImagePrompt(e.target.value)}
                        className="text-base"
                        disabled={isGeneratingImage || isProcessingManualUrl}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateImageWithAI}
                        disabled={isGeneratingImage || isProcessingManualUrl || isSubmitting || !aiImagePrompt.trim()}
                        className="btn-glow-accent hover:border-accent"
                    >
                        {isGeneratingImage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Generate Image
                    </Button>
                    {isGeneratingImage && <p className="text-sm text-muted-foreground">Generating image, please wait...</p>}
                     <FormDescription>
                      Describe the image you want the AI to create.
                    </FormDescription>
                </TabsContent>
            </Tabs>
             {/* Hidden FormField for Zod validation message on imageUrl */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ fieldState }) => (
                <FormItem className="h-0 m-0 p-0"> 
                  {/* This FormItem is only for the message, not for display of input */}
                  {fieldState.error && <FormMessage className="mt-2" />}
                </FormItem>
              )}
            />
        </FormItem>

        {imagePreviewUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Image Preview:</p>
            <Image
              src={imagePreviewUrl}
              alt="Initiative image preview"
              width={300}
              height={168}
              className="rounded-md border border-border object-cover"
              data-ai-hint="initiative image"
              onError={() => {
                toast({
                    variant: "destructive",
                    title: "Image Load Error",
                    description: "Could not load the preview for the provided URL. Please check the link.",
                });
                setImagePreviewUrl(null); // Clear preview on error
                form.setValue("imageUrl", "", { shouldValidate: true }); // Clear form value too
              }}
            />
          </div>
        )}


        {moderationResult && (
          <Alert
            variant={moderationResult.isAppropriate ? "default" : "destructive"}
            className="mt-6"
          >
            {moderationResult.isAppropriate ? <Sparkles className="h-5 w-5 text-accent" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
            <AlertTitle className="font-semibold">
              {moderationResult.isAppropriate
                ? "AI Content Check: Approved"
                : "AI Content Check: Needs Attention"}
            </AlertTitle>
            <AlertDescription>
              <p className="font-medium">
                Reasoning: {moderationResult.reasoning}
              </p>
              {moderationResult.revisedContent &&
                !moderationResult.isAppropriate && (
                  <div className="mt-2 p-3 bg-muted/50 rounded">
                    <p className="font-semibold text-sm">Suggested Revision:</p>
                    <p className="text-xs whitespace-pre-wrap">
                      {moderationResult.revisedContent}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="link"
                      className="p-0 h-auto text-accent"
                      onClick={() => {
                        const revisedParts =
                          moderationResult.revisedContent!.split(
                            "Description:"
                          );
                        if (revisedParts[0])
                          form.setValue(
                            "title",
                            revisedParts[0].replace("Title:", "").trim()
                          );
                        if (revisedParts[1])
                          form.setValue("description", revisedParts[1].trim());
                        toast({
                          title: "Suggestion Applied",
                          description:
                            "Title and description updated with AI suggestion.",
                        });
                      }}
                    >
                      Apply Suggestion
                    </Button>
                  </div>
                )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleModerateContent}
            disabled={isModerating || isSubmitting || isGeneratingImage || isProcessingManualUrl}
            className="btn-glow-accent hover:border-accent w-full sm:w-auto"
          >
            {isModerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Check Content with AI
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isModerating || isGeneratingImage || isProcessingManualUrl}
            className="bg-primary text-primary-foreground btn-glow-primary w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create {type === InitiativeType.Petition ? "Petition" : "Campaign"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

