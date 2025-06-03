
// src/app/dashboard/study-rooms/page.tsx
'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client'; 
import type { Tables, TablesInsert, Database, StudyRoomMessageWithProfile, ActivityLogWithSelfie } from '@/lib/database.types';
import { Loader2, MessageSquare, PlusCircle, Send, Users, Bot, Info, ShieldCheck, Trash2 } from 'lucide-react';
import { moderateStudyRoom, type ModerateStudyRoomInput, type ModerateStudyRoomOutput } from '@/ai/flows/ai-moderated-study-rooms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

const createRoomSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters.').max(50),
  topic: z.string().max(100).optional(),
});
type CreateRoomFormData = z.infer<typeof createRoomSchema>;

const messageSchema = z.object({
  message_text: z.string().min(1, 'Message cannot be empty.').max(1000),
});
type MessageFormData = z.infer<typeof messageSchema>;

type StudyRoom = Tables<'study_rooms'>;

export default function StudyRoomsPage() {
  const [isPending, startTransition] = useTransition();
  const [isRoomOperationPending, startRoomOperationTransition] = useTransition();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [messages, setMessages] = useState<StudyRoomMessageWithProfile[]>([]);
  const [aiModeration, setAiModeration] = useState<ModerateStudyRoomOutput | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const createRoomForm = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: '', topic: '' },
  });

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message_text: '' },
  });
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);
  
  const fetchRooms = useCallback(async () => {
    startRoomOperationTransition(async () => {
      const { data, error } = await supabase.from('study_rooms').select('*').order('created_at', { ascending: false });
      if (error) toast({ variant: 'destructive', title: 'Error fetching rooms', description: error.message });
      else setRooms(data || []);
    });
  }, [supabase, toast]);


  useEffect(() => {
    if(userId) fetchRooms();
  }, [userId, fetchRooms]);

  useEffect(() => {
    if (selectedRoom && userId) {
      fetchMessages(selectedRoom.id);
      const channel = supabase
        .channel(`study_room:${selectedRoom.id}`)
        .on<Tables<'study_room_messages'>>( 
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${selectedRoom.id}` },
          async (payload) => {
            const newMessage = payload.new as Tables<'study_room_messages'>; 
            
            // Fetch profile for the new message sender
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('email, full_name, avatar_url')
              .eq('id', newMessage.user_id) // Assuming profiles.id is the user_id
              .single();
            
            const newMessageWithProfile: StudyRoomMessageWithProfile = {
                ...newMessage,
                // profiles table 'id' is FK to auth.users.id
                profiles: profileData ? { email: profileData.email, full_name: profileData.full_name, avatar_url: profileData.avatar_url } : {email: 'Unknown User', full_name: 'Unknown', avatar_url: null}
            };
            setMessages((prevMessages) => [...prevMessages, newMessageWithProfile]);
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedRoom, userId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const fetchMessages = async (roomId: string) => {
    startTransition(async () => {
      const { data, error } = await supabase
        .from('study_room_messages')
        .select('*, profiles:user_id(email, full_name, avatar_url)') // Adjusted join
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100); 
      if (error) {
        console.error("Error fetching messages:", JSON.stringify(error, null, 2));
        toast({ variant: 'destructive', title: 'Error fetching messages', description: error.message });
      } else {
        setMessages(data as StudyRoomMessageWithProfile[] || []);
      }
    });
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!userId) return;
    const roomToDelete = rooms.find(r => r.id === roomId);

    startRoomOperationTransition(async () => {
      const { error: messagesError } = await supabase
        .from('study_room_messages')
        .delete()
        .eq('room_id', roomId);

      if (messagesError) {
        console.warn("Error deleting messages for room", roomId, messagesError.message);
      }

      const { error } = await supabase.from('study_rooms').delete().eq('id', roomId);

      if (error) {
        toast({ variant: 'destructive', title: 'Error deleting room', description: error.message });
      } else {
        toast({ title: 'Room deleted successfully!', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
        
        if (roomToDelete) {
            const activityLog: TablesInsert<'activity_logs'> = {
                user_id: userId,
                activity_type: 'study_room_deleted',
                description: `Deleted study room: "${roomToDelete.name}"`,
                details: { room_id: roomId, room_name: roomToDelete.name }
            };
            await supabase.from('activity_logs').insert(activityLog);
        }

        setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
        if (selectedRoom?.id === roomId) {
            setSelectedRoom(null);
        }
      }
    });
  };

  const handleCreateRoom = async (values: CreateRoomFormData) => {
    if (!userId) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }
    startRoomOperationTransition(async () => {
      const { data, error } = await supabase.from('study_rooms').insert([{ ...values, created_by_user_id: userId! }]).select().single();
      if (error) {
        toast({ variant: 'destructive', title: 'Error creating room', description: error.message });
      } else {
        toast({ title: 'Room created successfully!', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary'});
        setIsCreateRoomOpen(false);
        createRoomForm.reset();
        if (data) {
          setRooms(prev => [data as StudyRoom, ...prev]); 
          setSelectedRoom(data as StudyRoom); 
        }
      }
    });
  };

  const handleSendMessage = async (values: MessageFormData) => {
    if (!selectedRoom || !userId) {
        toast({ variant: 'destructive', title: 'No room selected or not authenticated' });
        return;
    }
    startTransition(async () => {
      const { error } = await supabase.from('study_room_messages').insert([{
        room_id: selectedRoom.id,
        user_id: userId!,
        message_text: values.message_text,
      }]);
      if (error) {
        toast({ variant: 'destructive', title: 'Error sending message', description: error.message });
      } else {
        messageForm.reset();
        if (selectedRoom.topic) { 
            const aiInput: ModerateStudyRoomInput = {
                topic: selectedRoom.topic,
                studentQuestion: values.message_text, 
                currentActivity: 'Chatting / Discussion',
            };
            try {
                const modResult = await moderateStudyRoom(aiInput);
                setAiModeration(modResult); 
            } catch (aiError: any) {
                console.warn("[AI Moderation] Error calling AI:", aiError.message);
                 setAiModeration({ clarificationOrAnswer: "AI Moderator is currently experiencing some turbulence. Please continue your discussion!"});
            }
        }
      }
    });
  };
  
  const handleSelectRoom = (room: StudyRoom) => {
    setSelectedRoom(room);
    setAiModeration(null); 
    if (room.topic) {
        setAiModeration({
            clarificationOrAnswer: "AI Moderator is listening. Suggestions related to the room topic will appear here based on the chat."
        });
    } else {
        setAiModeration({
            clarificationOrAnswer: "No specific topic set for this room, so AI moderation is general."
        });
    }
  };


  if (!selectedRoom) {
    return (
      <div className="space-y-10 pb-16 md:pb-0">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
            <Users className="mr-4 h-10 w-10" /> AI-Moderated Study Rooms
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join a room to collaborate, discuss topics, or create your own study group. Remember to be respectful and constructive!
          </p>
        </header>
        <div className="text-center mb-8">
          <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
            <DialogTrigger asChild>
              <Button className="glow-button text-lg py-6">
                <PlusCircle className="mr-2 h-6 w-6" /> Create New Study Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border shadow-xl shadow-primary/20">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl glow-text-primary">Create Room</DialogTitle>
                <DialogDescription>Enter details for your new study room.</DialogDescription>
              </DialogHeader>
              <Form {...createRoomForm}>
                <form onSubmit={createRoomForm.handleSubmit(handleCreateRoom)} className="space-y-4">
                  <FormField control={createRoomForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl><Input placeholder="E.g., Biology Ch.3 Discussion" {...field} className="input-glow" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={createRoomForm.control} name="topic" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic (Optional)</FormLabel>
                      <FormControl><Input placeholder="E.g., Cell Structure (for AI moderation)" {...field} className="input-glow" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="outline" className="glow-button">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isRoomOperationPending} className="glow-button">
                      {isRoomOperationPending ? <Loader2 className="animate-spin" /> : <PlusCircle />} Create Room
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        {isRoomOperationPending && rooms.length === 0 && <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Loading rooms...</p></div>}
        {!isRoomOperationPending && rooms.length === 0 && <p className="text-center text-muted-foreground py-10 text-lg">No study rooms available. Create one to get started!</p>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <Card key={room.id} className="interactive-card shadow-lg shadow-primary/10 hover:border-primary">
              <CardHeader className="cursor-pointer" onClick={() => handleSelectRoom(room)}>
                <CardTitle className="font-headline text-xl glow-text-primary">{room.name}</CardTitle>
                {room.topic && <CardDescription>Topic: {room.topic}</CardDescription>}
              </CardHeader>
              <CardContent className="cursor-pointer" onClick={() => handleSelectRoom(room)}>
                <p className="text-sm text-muted-foreground">Created: {format(parseISO(room.created_at), "PP")}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <Button size="sm" className="glow-button" onClick={(e) => { e.stopPropagation(); handleSelectRoom(room); }}>
                     <MessageSquare className="mr-1 h-4 w-4"/> Join Room
                 </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button size="sm" variant="destructive" onClick={(e) => e.stopPropagation()} disabled={isRoomOperationPending}> 
                          <Trash2 className="h-4 w-4" /> 
                          <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this room?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the "{room.name}" study room and all its messages.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRoomOperationPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRoom(room.id)} disabled={isRoomOperationPending} className="bg-destructive hover:bg-destructive/90">
                          {isRoomOperationPending ? <Loader2 className="animate-spin mr-2"/> : <Trash2 className="mr-2"/>} Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
      <header className="mb-6">
        <Button variant="outline" onClick={() => setSelectedRoom(null)} className="mb-4 glow-button">
          &larr; Back to Rooms List
        </Button>
        <h1 className="text-3xl font-headline font-bold glow-text-primary">{selectedRoom.name}</h1>
        {selectedRoom.topic && <p className="text-muted-foreground">Topic: {selectedRoom.topic}</p>}
      </header>

      <div className="flex flex-col md:flex-row flex-1 gap-6 min-h-0">
        <Card className="flex-1 flex flex-col interactive-card shadow-lg shadow-primary/10 min-h-0">
          <CardHeader>
            <CardTitle className="font-headline text-xl glow-text-primary flex items-center"><MessageSquare className="mr-2" /> Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {isPending && messages.length === 0 && <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Loading messages...</p></div>}
              {messages.map(msg => (
                <div key={msg.id} className={`mb-3 p-3 rounded-lg max-w-[80%] break-words shadow-sm ${msg.user_id === userId ? 'ml-auto bg-primary/80 text-primary-foreground' : 'bg-muted/50'}`}>
                  <p className="text-xs text-muted-foreground mb-1">{msg.profiles?.full_name || msg.profiles?.email?.split('@')[0] || 'User'} - {formatDistanceToNow(parseISO(msg.created_at), { addSuffix: true })}</p>
                  <p>{msg.message_text}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Form {...messageForm}>
              <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex w-full gap-2">
                <FormField control={messageForm.control} name="message_text" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl><Input placeholder="Type your message..." {...field} className="h-11 input-glow" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={isPending || !messageForm.formState.isValid} className="h-11 glow-button">
                  {isPending ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
              </form>
            </Form>
          </CardFooter>
        </Card>
        
        {selectedRoom.topic && (
          <Card className="w-full md:w-1/3 interactive-card shadow-lg shadow-accent/10">
            <CardHeader>
              <CardTitle className="font-headline text-xl glow-text-accent flex items-center"><Bot className="mr-2" /> AI Moderator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {aiModeration?.clarificationOrAnswer && (
                     <div>
                        <h4 className="font-semibold text-accent mb-1">AI Insight:</h4>
                        <p className="bg-muted/30 p-2 rounded-md">{aiModeration.clarificationOrAnswer}</p>
                    </div>
                )}
                {aiModeration?.quizQuestion && (
                    <div>
                        <h4 className="font-semibold text-accent mb-1">Quiz Question:</h4>
                        <p className="bg-muted/30 p-2 rounded-md">{aiModeration.quizQuestion}</p>
                    </div>
                )}
                {aiModeration?.timeSuggestion && (
                    <div>
                        <h4 className="font-semibold text-accent mb-1">Time Suggestion:</h4>
                        <p className="bg-muted/30 p-2 rounded-md">{aiModeration.timeSuggestion}</p>
                    </div>
                )}
                {aiModeration?.nextTopicSuggestion && (
                     <div>
                        <h4 className="font-semibold text-accent mb-1">Next Topic Suggestion:</h4>
                        <p className="bg-muted/30 p-2 rounded-md">{aiModeration.nextTopicSuggestion}</p>
                    </div>
                )}
                 <Alert variant="default" className="mt-4 bg-muted/20 border-border/30">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <AlertTitle className="font-semibold text-primary">Community Guidelines</AlertTitle>
                    <AlertDescription>
                        Be respectful, stay on topic, and help each other learn. No spam or inappropriate content. Let's make this a great study environment!
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground flex items-center"><Info className="w-3 h-3 mr-1.5"/>AI suggestions appear based on chat in rooms with a topic.</p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
    
