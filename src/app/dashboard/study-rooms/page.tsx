// src/app/dashboard/study-rooms/page.tsx
'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea'; // Not used in this simplified version
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert, Database, StudyRoomMessageWithProfile } from '@/lib/database.types'; // Use refined type
import { Loader2, MessageSquare, PlusCircle, Send, Users, Bot, Info } from 'lucide-react';
import { moderateStudyRoom, type ModerateStudyRoomInput, type ModerateStudyRoomOutput } from '@/ai/flows/ai-moderated-study-rooms';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, parseISO } from 'date-fns';


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
// StudyRoomMessageWithProfile is imported from database.types.ts

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
  
  useEffect(() => {
    if(userId) fetchRooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (selectedRoom && userId) {
      fetchMessages(selectedRoom.id);
      const channel = supabase
        .channel(`study_room:${selectedRoom.id}`)
        .on<Tables<'study_room_messages'>>( // Use base type for payload
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${selectedRoom.id}` },
          async (payload) => {
            const newMessage = payload.new as Tables<'study_room_messages'>; // Cast to base type
            // Fetch the user profile for the new message
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('email, full_name, avatar_url')
              .eq('id', newMessage.user_id)
              .single();

            const newMessageWithProfile: StudyRoomMessageWithProfile = {
                ...newMessage,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom, userId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRooms = async () => {
    startRoomOperationTransition(async () => {
      const { data, error } = await supabase.from('study_rooms').select('*').order('created_at', { ascending: false });
      if (error) toast({ variant: 'destructive', title: 'Error fetching rooms', description: error.message });
      else setRooms(data || []);
    });
  };

  const fetchMessages = async (roomId: string) => {
    startTransition(async () => {
      const { data, error } = await supabase
        .from('study_room_messages')
        .select('*, profiles(email, full_name, avatar_url)') 
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100); // Limit messages fetched initially
      if (error) toast({ variant: 'destructive', title: 'Error fetching messages', description: error.message });
      else setMessages(data as StudyRoomMessageWithProfile[] || []);
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
          setSelectedRoom(data as StudyRoom); // Auto-select new room
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
                console.warn("AI Moderation Error:", aiError.message);
            }
        }
      }
    });
  };
  
  const handleSelectRoom = (room: StudyRoom) => {
    setSelectedRoom(room);
    setAiModeration(null); 
  };


  if (!selectedRoom) {
    return (
      <div className="space-y-10 pb-16 md:pb-0">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
            <Users className="mr-4 h-10 w-10" /> AI-Moderated Study Rooms
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join a room to collaborate, discuss topics, or create your own study group.
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
                      <FormControl><Input placeholder="E.g., Cell Structure" {...field} className="input-glow" /></FormControl>
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
            <Card key={room.id} className="interactive-card shadow-lg shadow-primary/10 cursor-pointer hover:border-primary" onClick={() => handleSelectRoom(room)}>
              <CardHeader>
                <CardTitle className="font-headline text-xl glow-text-primary">{room.name}</CardTitle>
                {room.topic && <CardDescription>Topic: {room.topic}</CardDescription>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Created: {format(parseISO(room.created_at), "PP")}</p>
              </CardContent>
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
                        <h4 className="font-semibold text-accent mb-1">AI Clarification/Answer:</h4>
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
                 {!aiModeration && (
                    <p className="text-muted-foreground">AI moderator is active. Relevant suggestions will appear based on chat activity.</p>
                )}
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
