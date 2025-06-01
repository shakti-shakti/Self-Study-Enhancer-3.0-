
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
import { Loader2, UserCircle, Save, UploadCloud, Music, KeyRound, Palette, Edit, ShieldQuestion, SaveIcon, CalendarClock, CheckCircle, Coins } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { changePassword } from '@/app/auth/actions'; 
import * as apiClient from '@/lib/apiClient'; // Using the placeholder API client

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg"];

// Sample avatars, these should ideally come from your avatar store definitions
const sampleAvatars = [
  { id: 'db_adv_01', name: 'Adventurer Uno', url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Uno&size=150', dataAiHint: 'adventurer male' },
  { id: 'db_adv_02', name: 'Adventurer Duo', url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Duo&size=150&flip=true', dataAiHint: 'adventurer female' },
  { id: 'db_pix_01', name: 'Pixel Pal', url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=PixelPal&size=150', dataAiHint: 'pixel human' },
  { id: 'db_bot_01', name: 'Bot Alpha', url: 'https://api.dicebear.com/8.x/bottts/svg?seed=AlphaBot&size=150', dataAiHint: 'robot head' },
  { id: 'rh_s1_01', name: 'Robo One', url: 'https://robohash.org/roboone?set=set1&size=150x150', dataAiHint: 'robot design' },
  { id: 'rh_s2_01', name: 'Monster Uno', url: 'https://robohash.org/monsteruno?set=set2&size=150x150', dataAiHint: 'monster cute' },
  { id: 'rh_s4_01', name: 'Kitten Alpha', url: 'https://robohash.org/kittenalpha?set=set4&size=150x150', dataAiHint: 'kitten cute' },
  { id: 'db_lor_01', name: 'Lorelei Hue', url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=LoreHue&size=150', dataAiHint: 'cartoon face' },
  { id: 'ph_cat', name: 'Placeholder Cat', url: 'https://placehold.co/150x150/7B59E0/FFFFFF.png?text=CAT', dataAiHint: 'cat illustration' },
  // Add up to 100 from the previous list or generate more unique seeds
  ...Array.from({ length: 91 }, (_, i) => {
    const setNum = (i % 4) + 1; // cycle through robohash sets or dicebear styles
    const seed = `Avatar${i + 10}`;
    let url = `https://robohash.org/${seed}?set=set${setNum}&size=150x150`;
    if (i % 5 === 0) url = `https://api.dicebear.com/8.x/adventurer/svg?seed=${seed}&size=150`;
    else if (i % 5 === 1) url = `https://api.dicebear.com/8.x/bottts/svg?seed=${seed}&size=150`;
    else if (i % 5 === 2) url = `https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=${seed}&size=150`;
    else if (i % 5 === 3) url = `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${seed}&size=150`;
    return { id: `gen_avatar_${i}`, name: `Avatar ${i+10}`, url, dataAiHint: `generated avatar ${i % 5}` };
  })
];


const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(50).optional().or(z.literal('')),
  full_name: z.string().min(3, 'Full name must be at least 3 characters.').max(100).optional().or(z.literal('')),
  class_level: z.enum(['11', '12']).optional(),
  target_year: z.coerce.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 10).optional(),
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
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
  selectedAvatarUrl: z.string().url().optional().or(z.literal('')),
}).refine(data => {
    if (data.custom_countdown_target_date && !data.custom_countdown_event_name) {
        return false;
    }
    if (data.custom_countdown_event_name && !data.custom_countdown_target_date) {
        return false;
    }
    return true;
}, {
    message: "Both event name and target date are required for custom countdown, or leave both empty.",
    path: ["custom_countdown_event_name"],
}).refine(data => {
    if (data.newPassword && (!data.currentPassword || !data.confirmNewPassword)) {
        return false; 
    }
    if (data.newPassword && data.newPassword.length < 6) {
        return false; 
    }
    if (data.newPassword !== data.confirmNewPassword) {
        return false; 
    }
    return true;
}, {
    message: "To change password, all password fields are required. New password must be at least 6 characters and match confirmation.",
    path: ["confirmNewPassword"],
});


type ProfileFormData = z.infer<typeof profileSchema>;
type ProfileData = Tables<'profiles'>;

export default function ProfileSettingsPage() {
  const [isSavingGeneral, startSavingGeneralTransition] = useTransition();
  const [isSavingAlarm, startSavingAlarmTransition] = useTransition();
  const [isSavingCountdown, startSavingCountdownTransition] = useTransition();
  const [isChangingPassword, startChangingPasswordTransition] = useTransition();
  const [isSavingAvatar, startSavingAvatarTransition] = useTransition();


  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [currentAlarmToneUrl, setCurrentAlarmToneUrl] = useState<string | null>(null);
  const [selectedAlarmFile, setSelectedAlarmFile] = useState<File | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const alarmFileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentFocusCoins, setCurrentFocusCoins] = useState(0); // For displaying demo coins

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      full_name: '',
      theme: 'dark',
      custom_countdown_event_name: '',
      custom_countdown_target_date: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      selectedAvatarUrl: '',
    },
  });

  useEffect(() => {
    const fetchProfileAndCoins = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        startSavingGeneralTransition(async () => { 
          // Fetch Profile
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
              selectedAvatarUrl: data.avatar_url || '',
            });
            setCurrentAlarmToneUrl(data.alarm_tone_url);
            if (data.theme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
            }
          }
          // Fetch Demo Coins
          // TODO: Replace with actual backend call when available
          const coins = await apiClient.fetchUserFocusCoins();
          setCurrentFocusCoins(coins);
        });
      } else {
        toast({ variant: 'destructive', title: 'Not authenticated' });
      }
    };
    fetchProfileAndCoins();
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
    } else {
        setSelectedAlarmFile(null);
    }
  };

  const handleSaveAlarmTone = async () => {
    if (!userId || !selectedAlarmFile) {
      toast({ variant: 'destructive', title: 'No alarm file selected or not authenticated.' });
      return;
    }
    startSavingAlarmTransition(async () => {
      try {
        const file = selectedAlarmFile;
        const filePath = `${userId}/alarm_tones/${Date.now()}_${file.name}`;
        // TODO: Replace with actual Supabase Storage call if you implement file uploads
        // For now, this is conceptual, and we'll just update the profile URL to a placeholder
        // const { error: uploadError } = await supabase.storage
        //   .from('user-uploads') // Ensure this bucket exists with proper policies
        //   .upload(filePath, file);
        // if (uploadError) throw uploadError;
        // const { data } = supabase.storage.from('user-uploads').getPublicUrl(filePath);
        // const publicUrl = data.publicUrl;
        const publicUrl = `/alarms/${file.name}`; // Placeholder for demo if no actual upload

        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ alarm_tone_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', userId);
        
        if (profileUpdateError) throw profileUpdateError;

        setCurrentAlarmToneUrl(publicUrl);
        setSelectedAlarmFile(null);
        if(alarmFileInputRef.current) alarmFileInputRef.current.value = "";
        toast({ title: 'Alarm Tone Updated!', description: 'Your new alarm tone has been conceptually saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving alarm tone', description: error.message });
      }
    });
  };

  const handleSaveGeneralSettings = async () => {
    if (!userId) return;
    const values = form.getValues();
    startSavingGeneralTransition(async () => {
        try {
            const updateData: Partial<TablesUpdate<'profiles'>> = {
                username: values.username,
                full_name: values.full_name,
                class_level: values.class_level,
                target_year: values.target_year,
                theme: values.theme,
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
            if (error) throw error;
            toast({ title: 'General Settings Updated!', description: 'Your profile details and theme have been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
            if (values.theme === 'light') document.documentElement.classList.remove('dark');
            else document.documentElement.classList.add('dark');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error updating general settings', description: error.message });
        }
    });
  };
  
  const handleSaveCustomCountdown = async () => {
    if (!userId) return;
    const values = form.getValues();
    const countdownValidation = profileSchema.safeParse(values); 
    if (!countdownValidation.success && (countdownValidation.error.flatten().fieldErrors.custom_countdown_event_name || countdownValidation.error.flatten().fieldErrors.custom_countdown_target_date)) {
        toast({variant: "destructive", title: "Countdown Error", description: "Both event name and date are required for custom countdown, or leave both empty."});
        return;
    }

    startSavingCountdownTransition(async () => {
        try {
            const updateData: Partial<TablesUpdate<'profiles'>> = {
                custom_countdown_event_name: values.custom_countdown_event_name || null,
                custom_countdown_target_date: values.custom_countdown_target_date ? new Date(values.custom_countdown_target_date).toISOString() : null,
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
            if (error) throw error;
            toast({ title: 'Custom Countdown Updated!', description: 'Your countdown settings have been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error updating countdown', description: error.message });
        }
    });
  };

  const handlePasswordChange = async () => {
    if (!userId) return;
    const values = form.getValues();
    
    if (!values.currentPassword || !values.newPassword || !values.confirmNewPassword) {
        form.setError("currentPassword", { type: "manual", message: "All password fields are required to change password." });
        form.setError("newPassword", { type: "manual", message: "" });
        form.setError("confirmNewPassword", { type: "manual", message: "" });
        return;
    }
    if (values.newPassword.length < 6) {
        form.setError("newPassword", { type: "manual", message: "New password must be at least 6 characters."});
        return;
    }
    if (values.newPassword !== values.confirmNewPassword) {
        form.setError("confirmNewPassword", { type: "manual", message: "New passwords do not match." });
        return;
    }

    startChangingPasswordTransition(async () => {
      const result = await changePassword({
        currentPassword: values.currentPassword!,
        newPassword: values.newPassword!,
      });

      if (result.error) {
        toast({ variant: 'destructive', title: 'Password Change Failed', description: result.error });
        form.setError("currentPassword", { type: "manual", message: result.error });
      } else {
        toast({ title: 'Password Changed Successfully!', description: 'Your password has been updated.', className: 'bg-green-500/20 text-green-300 border-green-400/50'});
        form.resetField("currentPassword");
        form.resetField("newPassword");
        form.resetField("confirmNewPassword");
      }
    });
  };
  
  const handleAvatarSelect = (avatarUrl: string) => {
    form.setValue('selectedAvatarUrl', avatarUrl); 
  };

  const handleSaveAvatar = async () => {
    if (!userId) return;
    const selectedAvatarUrl = form.getValues('selectedAvatarUrl');
    if (!selectedAvatarUrl) {
        toast({variant: 'destructive', title: "No Avatar Selected", description: "Please select an avatar first."});
        return;
    }
    startSavingAvatarTransition(async () => {
        try {
            // TODO: If this avatar was "purchased", ensure it's in the user's owned list on backend
            // For now, we directly update the profile
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: selectedAvatarUrl, updated_at: new Date().toISOString() })
                .eq('id', userId);
            if (error) throw error;
            setProfileData(prev => prev ? {...prev, avatar_url: selectedAvatarUrl} : null); 
            toast({ title: 'Avatar Updated!', description: 'Your new avatar has been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error saving avatar', description: error.message });
        }
    });
  };


  if (isSavingGeneral && !profileData) { 
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <UserCircle className="mr-4 h-10 w-10" /> Profile & Settings
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Personalize your experience and manage your account details. Current Focus Coins (Demo): <Coins className="inline h-5 w-5 text-accent"/> {currentFocusCoins}
        </p>
      </header>

      <Form {...form}>
        <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
                        <AvatarImage src={form.watch('selectedAvatarUrl') || profileData?.avatar_url || undefined} alt={profileData?.full_name || 'User'} data-ai-hint="user profile large"/>
                        <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                            {profileData?.full_name ? profileData.full_name.charAt(0).toUpperCase() : profileData?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left">
                        <CardTitle className="text-3xl font-headline glow-text-primary">{profileData?.full_name || profileData?.username || 'Your Profile'}</CardTitle>
                        <CardDescription className="text-base">{profileData?.email || 'Edit your personal information and app preferences below.'}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
                            <Select onValueChange={field.onChange} value={field.value || ''}>
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
                    <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-accent"><Palette className="mr-2" /> Theme</CardTitle></CardHeader>
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
                  <Button type="button" onClick={handleSaveGeneralSettings} className="w-full sm:w-auto glow-button" disabled={isSavingGeneral}>
                      {isSavingGeneral ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save General & Theme Settings
                  </Button>
            </CardContent>
          </Card>

        <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-purple-500/10">
            <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-purple-400"><UserCircle className="mr-2"/> Choose Your Avatar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Note: This grid shows all sample avatars. Ideally, purchased avatars from the Study Store would be filtered and displayed here once the coin and inventory system is fully implemented on the backend.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-2 border rounded-md bg-background/20">
                    {sampleAvatars.map(avatar => (
                        <div 
                            key={avatar.id}
                            className={`p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-100 hover:shadow-lg ${form.watch('selectedAvatarUrl') === avatar.url ? 'border-primary shadow-primary/40 opacity-100 scale-105' : 'border-transparent opacity-70'}`}
                            onClick={() => handleAvatarSelect(avatar.url)}
                        >
                            <Avatar className="h-20 w-20 mx-auto">
                                <AvatarImage src={avatar.url} alt={avatar.name} data-ai-hint={avatar.dataAiHint}/>
                                <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="text-xs text-center mt-1 text-muted-foreground truncate">{avatar.name}</p>
                        </div>
                    ))}
                </div>
                 <Button type="button" onClick={handleSaveAvatar} className="w-full sm:w-auto glow-button" disabled={isSavingAvatar || !form.getValues('selectedAvatarUrl')}>
                    {isSavingAvatar ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />} Set Selected Avatar
                </Button>
            </CardContent>
        </Card>

          <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-accent/10">
            <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-accent"><Music className="mr-2" /> Alarm Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <FormItem>
                    <FormLabel className="text-base font-medium">Upload Custom Alarm Tone</FormLabel>
                    <FormControl>
                        <Input type="file" accept={ACCEPTED_AUDIO_TYPES.join(',')} ref={alarmFileInputRef} onChange={handleAlarmFileChange} className="input-glow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                    </FormControl>
                    <FormDescription>Upload an MP3, WAV, or OGG file ({MAX_FILE_SIZE_MB}MB max). TODO: Full backend storage needed for this to persist correctly.</FormDescription>
                </FormItem>
                {currentAlarmToneUrl && (
                    <div>
                        <p className="text-sm text-muted-foreground">Current alarm tone:</p>
                        <audio controls src={currentAlarmToneUrl} className="w-full mt-1 rounded-md">Your browser does not support the audio element.</audio>
                    </div>
                )}
                <Button type="button" onClick={handleSaveAlarmTone} className="w-full sm:w-auto glow-button" disabled={isSavingAlarm || !selectedAlarmFile}>
                    {isSavingAlarm ? <Loader2 className="animate-spin mr-2" /> : <SaveIcon className="mr-2" />} Save Alarm Tone
                </Button>
            </CardContent>
          </Card>
          
          <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-secondary/10">
            <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-secondary"><CalendarClock className="mr-2" /> Custom Countdown</CardTitle></CardHeader>
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
                <Button type="button" onClick={handleSaveCustomCountdown} className="w-full sm:w-auto glow-button" disabled={isSavingCountdown}>
                    {isSavingCountdown ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save Custom Countdown
                </Button>
            </CardContent>
          </Card>

          <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-destructive/10">
            <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-destructive"><KeyRound className="mr-2" /> Account Security</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="currentPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Current Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Enter your current password" {...field} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">New Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Enter new password (min 6 chars)" {...field} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="confirmNewPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Confirm New Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Confirm new password" {...field} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <Button type="button" onClick={handlePasswordChange} className="w-full sm:w-auto glow-button border-destructive/70 text-destructive/90 hover:bg-destructive/20 hover:text-destructive" disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 className="animate-spin mr-2" /> : <ShieldQuestion className="mr-2" />} Change Password
                </Button>
            </CardContent>
          </Card>
      </Form>
    </div>
  );
}

    