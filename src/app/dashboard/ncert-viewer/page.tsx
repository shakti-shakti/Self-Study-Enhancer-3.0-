// src/app/dashboard/ncert-viewer/page.tsx
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Loader2, Download, Edit, Info, ChevronRight, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

type NcertBookMetadata = Tables<'ncert_books_metadata'>;
type UserNcertNote = Tables<'user_ncert_notes'>;

// Dummy NCERT data structure (replace with actual fetched data or structure from Supabase)
// This would ideally be populated from the `ncert_books_metadata` table.
const ncertBooksData: NcertBookMetadata[] = [
  { id: 'phy11_1', class_level: '11', subject: 'Physics', book_name: 'Physics Part I - Class 11', chapters: JSON.stringify([{name: "Chapter 1: Physical World", pdf_filename: "keph101.pdf"}, {name: "Chapter 2: Units and Measurement", pdf_filename: "keph102.pdf"}]), cover_image_url: `https://placehold.co/150x200/A758A9/FFFFFF.png?text=Phy+11.1` },
  { id: 'phy11_2', class_level: '11', subject: 'Physics', book_name: 'Physics Part II - Class 11', chapters: JSON.stringify([{name: "Chapter 9: Mechanical Properties of Solids", pdf_filename: "keph201.pdf"}]), cover_image_url: `https://placehold.co/150x200/A758A9/FFFFFF.png?text=Phy+11.2` },
  { id: 'chem11_1', class_level: '11', subject: 'Chemistry', book_name: 'Chemistry Part I - Class 11', chapters: JSON.stringify([{name: "Chapter 1: Some Basic Concepts of Chemistry", pdf_filename: "kech101.pdf"}]), cover_image_url: `https://placehold.co/150x200/559BBA/FFFFFF.png?text=Chem+11.1` },
  { id: 'bio11', class_level: '11', subject: 'Biology', book_name: 'Biology - Class 11', chapters: JSON.stringify([{name: "Chapter 1: The Living World", pdf_filename: "kebo101.pdf"}]), cover_image_url: `https://placehold.co/150x200/84CC16/FFFFFF.png?text=Bio+11` },
  { id: 'phy12_1', class_level: '12', subject: 'Physics', book_name: 'Physics Part I - Class 12', chapters: JSON.stringify([{name: "Chapter 1: Electric Charges and Fields", pdf_filename: "leph101.pdf"}, {name: "Chapter 2: Electrostatic Potential and Capacitance", pdf_filename: "leph102.pdf"}]), cover_image_url: `https://placehold.co/150x200/A758A9/FFFFFF.png?text=Phy+12.1` },
  { id: 'chem12_1', class_level: '12', subject: 'Chemistry', book_name: 'Chemistry Part I - Class 12', chapters: JSON.stringify([{name: "Chapter 1: The Solid State", pdf_filename: "lech101.pdf"}]), cover_image_url: `https://placehold.co/150x200/559BBA/FFFFFF.png?text=Chem+12.1` },
  { id: 'bio12', class_level: '12', subject: 'Biology', book_name: 'Biology - Class 12', chapters: JSON.stringify([{name: "Chapter 1: Reproduction in Organisms", pdf_filename: "lebo101.pdf"}]), cover_image_url: `https://placehold.co/150x200/84CC16/FFFFFF.png?text=Bio+12` },
];
// Base URL for NCERT PDFs (example structure, might need adjustment)
const NCERT_PDF_BASE_URL = "https://ncert.nic.in/textbook/pdf/";


export default function NcertViewerPage() {
  const [selectedClass, setSelectedClass] = useState<string>('11');
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [booksForSelection, setBooksForSelection] = useState<NcertBookMetadata[]>([]);
  const [selectedBook, setSelectedBook] = useState<NcertBookMetadata | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{name: string, pdf_filename: string} | null>(null);
  const [chapterNotes, setChapterNotes] = useState<UserNcertNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState<string | null>(null); // Stores ID of note being edited

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    const getInitialUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getInitialUser();
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Filter books based on class and subject
  useEffect(() => {
    // In a real app, fetch this from `ncert_books_metadata` table in Supabase
    const filtered = ncertBooksData.filter(book => book.class_level === selectedClass && book.subject === selectedSubject);
    setBooksForSelection(filtered);
    setSelectedBook(null); // Reset selected book when filters change
    setSelectedChapter(null);
    setChapterNotes([]);
  }, [selectedClass, selectedSubject]);
  
  const fetchChapterNotes = useCallback(async () => {
    if (!userId || !selectedBook || !selectedChapter) {
        setChapterNotes([]);
        return;
    }
    startTransition(async () => {
        const { data, error } = await supabase
            .from('user_ncert_notes')
            .select('*')
            .eq('user_id', userId)
            .eq('book_id', selectedBook.id)
            .eq('chapter_name', selectedChapter.name)
            .order('created_at', {ascending: true});
        if (error) {
            toast({variant: 'destructive', title: 'Error fetching notes', description: error.message});
        } else {
            setChapterNotes(data || []);
        }
    });
  }, [userId, selectedBook, selectedChapter, supabase, toast]);


  useEffect(() => {
    if(selectedChapter) fetchChapterNotes();
  }, [selectedChapter, fetchChapterNotes]);


  const handleSaveNote = async () => {
    if (!userId || !selectedBook || !selectedChapter || !currentNote.trim()) return;
    
    startTransition(async () => {
        let error;
        if (isEditingNote) { // Update existing note
            const { error: updateError } = await supabase
                .from('user_ncert_notes')
                .update({ note_content: currentNote, updated_at: new Date().toISOString()})
                .eq('id', isEditingNote)
                .eq('user_id', userId);
            error = updateError;
        } else { // Insert new note
            const noteData: TablesInsert<'user_ncert_notes'> = {
                user_id: userId,
                book_id: selectedBook.id,
                chapter_name: selectedChapter.name,
                note_content: currentNote,
            };
            const { error: insertError } = await supabase.from('user_ncert_notes').insert(noteData);
            error = insertError;
        }

        if (error) {
            toast({ variant: 'destructive', title: `Error ${isEditingNote ? 'updating' : 'saving'} note`, description: error.message });
        } else {
            toast({ title: `Note ${isEditingNote ? 'updated' : 'saved'}!`, className: 'bg-primary/10 border-primary text-primary-foreground' });
            setCurrentNote('');
            setIsEditingNote(null);
            fetchChapterNotes();
        }
    });
  };
  
  const handleEditNote = (note: UserNcertNote) => {
    setIsEditingNote(note.id);
    setCurrentNote(note.note_content);
  };

  const handleDeleteNote = async (noteId: string) => {
     if(!userId) return;
     startTransition(async () => {
        const {error} = await supabase.from('user_ncert_notes').delete().eq('id', noteId).eq('user_id', userId);
        if(error) {
            toast({variant: 'destructive', title: 'Error deleting note', description: error.message});
        } else {
            toast({title: 'Note deleted.'});
            fetchChapterNotes();
            if(isEditingNote === noteId) { // If deleting the note being edited
                setIsEditingNote(null);
                setCurrentNote('');
            }
        }
     });
  };


  const openChapterPdf = (pdfFilename: string) => {
    // This opens the PDF in a new tab.
    // In-app PDF viewing and annotation is a very complex feature.
    // For a web app, libraries like PDF.js can be used for viewing, but annotation adds more complexity.
    window.open(`${NCERT_PDF_BASE_URL}${pdfFilename}`, '_blank');
    toast({ title: 'Opening Chapter PDF', description: 'The chapter PDF will open in a new tab for viewing or download from the NCERT website.' });
  };

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <BookOpen className="mr-4 h-10 w-10" /> NCERT Book Viewer
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Select your class and subject to view NCERT books, chapters, and take notes.
        </p>
      </header>

      <Card className="interactive-card shadow-lg p-4 md:p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-accent">Select Book</CardTitle>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="input-glow h-11"><SelectValue placeholder="Select class..." /></SelectTrigger>
              <SelectContent><SelectItem value="11">Class 11</SelectItem><SelectItem value="12">Class 12</SelectItem></SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="input-glow h-11"><SelectValue placeholder="Select subject..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology (Botany & Zoology)</SelectItem>
                {/* Add Botany & Zoology if books are separate */}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {booksForSelection.length === 0 && <p className="text-muted-foreground text-center py-6">No books found for this selection. Data might be loading or unavailable.</p>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {booksForSelection.map(book => (
              <Card key={book.id} className={`interactive-card hover:border-primary p-1 ${selectedBook?.id === book.id ? 'border-2 border-primary shadow-primary/30' : ''}`} onClick={() => {setSelectedBook(book); setSelectedChapter(null);}}>
                <CardHeader className="p-3 text-center">
                  <img src={book.cover_image_url || `https://placehold.co/150x200/777/FFF.png?text=${book.subject.slice(0,3)}`} alt={book.book_name} className="w-24 h-32 object-cover rounded-md mx-auto mb-2 shadow-md" data-ai-hint={`${book.subject} textbook`}/>
                  <CardTitle className="text-lg font-semibold glow-text-primary">{book.book_name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedBook && (
        <Card className="interactive-card shadow-xl mt-8 p-4 md:p-6">
          <CardHeader>
            <CardTitle className="text-3xl font-headline glow-text-primary">{selectedBook.book_name} - Chapters</CardTitle>
            <CardDescription>Select a chapter to view its content (opens PDF) and manage your notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full" value={selectedChapter?.name} onValueChange={(value) => {
                const chap = JSON.parse(selectedBook.chapters as string).find((c: any) => c.name === value);
                setSelectedChapter(chap || null);
            }}>
              {JSON.parse(selectedBook.chapters as string).map((chapter: {name: string, pdf_filename: string}) => (
                <AccordionItem value={chapter.name} key={chapter.name} className="border rounded-lg bg-card/50 my-2 shadow-sm">
                  <AccordionTrigger className="p-4 text-lg font-medium hover:no-underline text-primary">
                    <div className="flex items-center justify-between w-full">
                        <span>{chapter.name}</span>
                        <ChevronRight className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="flex gap-2 mb-4">
                        <Button onClick={() => openChapterPdf(chapter.pdf_filename)} className="glow-button">
                            <Download className="mr-2 h-4 w-4" /> View/Download Chapter PDF
                        </Button>
                    </div>
                    <h4 className="font-semibold text-xl mb-2 glow-text-accent flex items-center"><FileText className="mr-2"/>Your Notes for this Chapter:</h4>
                     {isPending && chapterNotes.length === 0 && selectedChapter?.name === chapter.name && <Loader2 className="animate-spin my-4" />}
                    {chapterNotes.length > 0 && (
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto p-2 rounded bg-background/20">
                            {chapterNotes.map(note => (
                                <div key={note.id} className="p-3 border border-border/50 rounded-md bg-card/80 shadow">
                                    <p className="whitespace-pre-wrap text-sm">{note.note_content}</p>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Updated: {format(parseISO(note.updated_at), "PPp")}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditNote(note)} className="glow-button"><Edit className="h-3 w-3 mr-1"/> Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(note.id)} disabled={isPending} className="glow-button"><Trash2 className="h-3 w-3 mr-1"/> Delete</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {chapterNotes.length === 0 && !isPending && selectedChapter?.name === chapter.name && <p className="text-sm text-muted-foreground mb-3">No notes yet for this chapter.</p>}
                    
                    <Textarea 
                        placeholder={`Type your notes for ${chapter.name} here...`} 
                        value={currentNote} 
                        onChange={(e) => setCurrentNote(e.target.value)}
                        rows={5}
                        className="input-glow w-full mb-2"
                    />
                    <div className="flex justify-end gap-2">
                         {isEditingNote && <Button variant="outline" onClick={() => {setIsEditingNote(null); setCurrentNote('');}} className="glow-button">Cancel Edit</Button>}
                        <Button onClick={handleSaveNote} disabled={isPending || !currentNote.trim()} className="glow-button">
                            {isPending ? <Loader2 className="animate-spin"/> : <Save/>} {isEditingNote ? 'Update Note' : 'Save Note'}
                        </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
             <Alert className="mt-6 bg-primary/5 border-primary/20">
                <Info className="h-5 w-5 text-primary" />
                <AlertTitle className="text-primary font-semibold">PDF Viewing & Notes</AlertTitle>
                <AlertDescription>
                    Chapter PDFs will open in a new tab from the official NCERT source. You can take digital notes related to each chapter here, which will be saved to your account. Advanced in-app PDF annotation is a complex feature planned for future enhancements.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
