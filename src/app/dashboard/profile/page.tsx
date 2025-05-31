
// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { Loader2, UserCircle, Save, UploadCloud, Music, KeyRound, Palette, Edit, ShieldQuestion, SaveIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg"];


const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(50).optional().or(z.literal('')),
  full_name: z.string().min(3, 'Full name must be at least 3 characters.').max(100).optional().or(z.literal('')),
  class_level: z.enum(['11', '12']).optional(),
  target_year: z.coerce.number().int().min(2024).max(2030).optional(),
  theme: z.enum(['light', 'dark']).default('dark'),
  alarm_tone_upload: z
    .custom<FileList>()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE_BYTES, `Max audio file size is ${MAX_FILE_SIZE_MB}MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_AUDIO_TYPES.includes(files?.[0]?.type),
      "Only MP3, WAV, OGG formats are supported."
    ),
  custom_countdown_event_name: z.string().max(50).optional().or(z.literal('')),
  custom_countdown_target_date: z.string().optional().or(z.literal('')),
}).refine(data => {
    if (data.custom_countdown_target_date && !data.custom_countdown_event_name) {
        return false; 
    }
    if (data.custom_countdown_event_name && !data.custom_countdown_target_date) {
        return false; 
    }
    return true;
}, {
    message: "Both event name and target date are required for custom countdown, or neither.",
    path: ["custom_countdown_event_name"], 
});


type ProfileFormData = z.infer<typeof profileSchema>;
type ProfileData = Tables<'profiles'>;

export default function ProfileSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [isAlarmSaving, startAlarmSavingTransition] = useTransition();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [currentAlarmToneUrl, setCurrentAlarmToneUrl] = useState<string | null>(null);
  const [selectedAlarmFile, setSelectedAlarmFile] = useState<File | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const alarmFileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      full_name: '',
      theme: 'dark',
      custom_countdown_event_name: '',
      custom_countdown_target_date: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        startTransition(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { 
            toast({ variant: 'destructive', title: 'Error fetching profile', description: error.message });
          } else if (data) {
            setProfileData(data);
            form.reset({
              username: data.username || '',
              full_name: data.full_name || '',
              class_level: data.class_level as '11' | '12' || undefined,
              target_year: data.target_year || undefined,
              theme: (data.theme as 'light' | 'dark') || 'dark',
              custom_countdown_event_name: data.custom_countdown_event_name || '',
              custom_countdown_target_date: data.custom_countdown_target_date ? new Date(data.custom_countdown_target_date).toISOString().split('T')[0] : '',
            });
            setCurrentAlarmToneUrl(data.alarm_tone_url);
            if (data.theme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
            }
          }
        });
      } else {
        toast({ variant: 'destructive', title: 'Not authenticated' });
      }
    };
    fetchProfile();
  }, [supabase, toast, form]);

  const handleAlarmFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast({ variant: "destructive", title: "Audio file too large", description: `Max ${MAX_FILE_SIZE_MB}MB.` });
            setSelectedAlarmFile(null);
            if(alarmFileInputRef.current) alarmFileInputRef.current.value = "";
            return;
        }
        if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
            toast({ variant: "destructive", title: "Invalid audio file type", description: "Use MP3, WAV, OGG." });
            setSelectedAlarmFile(null);
            if(alarmFileInputRef.current) alarmFileInputRef.current.value = "";
            return;
        }
        setSelectedAlarmFile(file);
        form.setValue('alarm_tone_upload', event.target.files as FileList); // Keep RHF informed if needed
    } else {
        setSelectedAlarmFile(null);
        form.resetField('alarm_tone_upload');
    }
  };

  const handleSaveAlarmTone = async () => {
    if (!userId || !selectedAlarmFile) {
      toast({ variant: 'destructive', title: 'No alarm file selected or not authenticated.' });
      return;
    }
    startAlarmSavingTransition(async () => {
      try {
        const file = selectedAlarmFile;
        const filePath = `${userId}/alarm_tones/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(filePath);
        
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ alarm_tone_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', userId);
        
        if (profileUpdateError) throw profileUpdateError;

        setCurrentAlarmToneUrl(publicUrl);
        setSelectedAlarmFile(null);
        if(alarmFileInputRef.current) alarmFileInputRef.current.value = "";
        form.resetField('alarm_tone_upload');
        toast({ title: 'Alarm Tone Updated!', description: 'Your new alarm tone has been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving alarm tone', description: error.message });
      }
    });
  };


  const onSubmit = async (values: ProfileFormData) => {
    if (!userId) return;

    startTransition(async () => {
      try {
        // Note: Alarm tone is now handled by handleSaveAlarmTone if a new file is selected.
        // This main save will only save other profile fields.
        // If a file was selected via form.setValue('alarm_tone_upload', ...) but NOT uploaded via the dedicated button,
        // it will be ignored by this main save logic to prevent accidental overwrites without explicit save.
        
        const updateData: Partial<TablesUpdate<'profiles'>> = {
          username: values.username,
          full_name: values.full_name,
          class_level: values.class_level,
          target_year: values.target_year,
          theme: values.theme,
          // alarm_tone_url is NOT updated here, handled by dedicated button
          custom_countdown_event_name: values.custom_countdown_event_name || null,
          custom_countdown_target_date: values.custom_countdown_target_date ? new Date(values.custom_countdown_target_date).toISOString() : null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (error) throw error;

        toast({ title: 'Profile Settings Updated!', description: 'Your general settings have been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
        if (values.theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
        
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error updating profile settings', description: error.message });
      }
    });
  };
  
  const handleRequestPasswordReset = async () => {
    if (!profileData?.email) {
        toast({ variant: 'destructive', title: 'Error', description: 'User email not found.' });
        return;
    }
    startTransition(async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(profileData.email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Error sending reset email', description: error.message });
        } else {
            toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for instructions to reset your password.' });
        }
    });
};


  if (isPending && !profileData) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <UserCircle className="mr-4 h-10 w-10" /> Profile & Settings
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Personalize your experience and manage your account details.
        </p>
      </header>

      <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
            <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 border-2 border-primary shadow-lg">
                    <AvatarImage src={profileData?.avatar_url || undefined} alt={profileData?.full_name || 'User'} data-ai-hint="user avatar"/>
                    <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                        {profileData?.full_name ? profileData.full_name.charAt(0).toUpperCase() : profileData?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-3xl font-headline glow-text-primary">{profileData?.full_name || profileData?.username || 'Your Profile'}</CardTitle>
                    <CardDescription className="text-base">{profileData?.email || 'Edit your personal information and app preferences below.'}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Username</FormLabel>
                        <FormControl><Input placeholder="Your unique username" {...field} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="full_name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Full Name</FormLabel>
                        <FormControl><Input placeholder="Your full name" {...field} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="class_level" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-11 input-glow"><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="11">Class 11</SelectItem><SelectItem value="12">Class 12</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="target_year" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Target NEET Year</FormLabel>
                        <FormControl><Input type="number" placeholder="E.g., 2026" {...field} onChange={event => field.onChange(+event.target.value)} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>

              <Card className="bg-card/50 border-border/50 shadow-inner">
                <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-accent"><Palette className="mr-2" /> Theme & Appearance</CardTitle></CardHeader>
                <CardContent>
                    <FormField control={form.control} name="theme" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/30">
                            <div className="space-y-0.5">
                                <FormLabel>Dark Mode</FormLabel>
                                <FormDescription>Toggle between dark and light themes.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value === 'dark'} onCheckedChange={(checked) => field.onChange(checked ? 'dark' : 'light')} />
                            </FormControl>
                        </FormItem>
                    )} />
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 shadow-inner">
                <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-accent"><Music className="mr-2" /> Alarm Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FormItem> {/* Not a FormField as it's handled separately */}
                        <FormLabel className="text-base font-medium">Upload Custom Alarm Tone</FormLabel>
                        <FormControl>
                            <Input type="file" accept={ACCEPTED_AUDIO_TYPES.join(',')} ref={alarmFileInputRef} onChange={handleAlarmFileChange} className="input-glow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                        </FormControl>
                        <FormDescription>Upload an MP3, WAV, or OGG file ({MAX_FILE_SIZE_MB}MB max).</FormDescription>
                        {/* FormMessage for alarm_tone_upload would come from RHF if it was a direct FormField */}
                    </FormItem>
                    {currentAlarmToneUrl && (
                        <div>
                            <p className="text-sm text-muted-foreground">Current alarm tone:</p>
                            <audio controls src={currentAlarmToneUrl} className="w-full mt-1 rounded-md">Your browser does not support the audio element.</audio>
                        </div>
                    )}
                    <Button type="button" onClick={handleSaveAlarmTone} className="w-full sm:w-auto glow-button" disabled={isAlarmSaving || !selectedAlarmFile}>
                        {isAlarmSaving ? <Loader2 className="animate-spin mr-2" /> : <SaveIcon className="mr-2" />} Save Alarm Tone
                    </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border/50 shadow-inner">
                <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-accent"><Edit className="mr-2" /> Custom Countdown</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={form.control} name="custom_countdown_event_name" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">Event Name</FormLabel>
                            <FormControl><Input placeholder="E.g., NEET 2026 Exam" {...field} className="h-11 input-glow" /></FormControl>
                             <FormDescription>Name of the event for your custom countdown on the dashboard.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="custom_countdown_target_date" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">Target Date</FormLabel>
                            <FormControl><Input type="date" {...field} className="h-11 input-glow" /></FormControl>
                             <FormDescription>The date of your custom event.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
              </Card>


              <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isPending || isAlarmSaving}>
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save General Settings
              </Button>

              <Card className="bg-card/50 border-border/50 shadow-inner mt-8">
                <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-destructive"><KeyRound className="mr-2" /> Account Security</CardTitle></CardHeader>
                <CardContent>
                    <Button type="button" variant="outline" onClick={handleRequestPasswordReset} className="w-full glow-button border-destructive/70 text-destructive/90 hover:bg-destructive/20 hover:text-destructive" disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin mr-2" /> : <ShieldQuestion className="mr-2" />} Change Password (Send Reset Link)
                    </Button>
                    <FormDescription className="mt-2 text-center">Request a password reset link to be sent to your email.</FormDescription>
                </CardContent>
              </Card>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    