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
import { BookOpen, Loader2, Download, Edit, Info, ChevronRight, FileText, Save, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';


type NcertBookMetadata = Tables<'ncert_books_metadata'>;
type UserNcertNote = Tables<'user_ncert_notes'>;

// Dummy NCERT data structure (replace with actual fetched data or structure from Supabase)
// This would ideally be populated from the `ncert_books_metadata` table.
const ncertBooksData: NcertBookMetadata[] = [
  { id: 'phy11_1', class_level: '11', subject: 'Physics', book_name: 'Physics Part I - Class 11', chapters: JSON.stringify([{name: "Chapter 1: Physical World", pdf_filename: "keph101.pdf"}, {name: "Chapter 2: Units and Measurement", pdf_filename: "keph102.pdf"}, {name: "Chapter 3: Motion in a Straight Line", pdf_filename: "keph103.pdf"}, {name: "Chapter 4: Motion in a Plane", pdf_filename: "keph104.pdf"}, {name: "Chapter 5: Laws of Motion", pdf_filename: "keph105.pdf"}, {name: "Chapter 6: Work, Energy and Power", pdf_filename: "keph106.pdf"}, {name: "Chapter 7: System of Particles and Rotational Motion", pdf_filename: "keph107.pdf"}, {name: "Chapter 8: Gravitation", pdf_filename: "keph108.pdf"}]), cover_image_url: `https://placehold.co/150x200/A758A9/FFFFFF.png?text=Phy+11.1` },
  { id: 'phy11_2', class_level: '11', subject: 'Physics', book_name: 'Physics Part II - Class 11', chapters: JSON.stringify([{name: "Chapter 9: Mechanical Properties of Solids", pdf_filename: "keph201.pdf"}, {name: "Chapter 10: Mechanical Properties of Fluids", pdf_filename: "keph202.pdf"}, {name: "Chapter 11: Thermal Properties of Matter", pdf_filename: "keph203.pdf"}, {name: "Chapter 12: Thermodynamics", pdf_filename: "keph204.pdf"}, {name: "Chapter 13: Kinetic Theory", pdf_filename: "keph205.pdf"}, {name: "Chapter 14: Oscillations", pdf_filename: "keph206.pdf"}, {name: "Chapter 15: Waves", pdf_filename: "keph207.pdf"}]), cover_image_url: `https://placehold.co/150x200/A758A9/FFFFFF.png?text=Phy+11.2` },
  { id: 'chem11_1', class_level: '11', subject: 'Chemistry', book_name: 'Chemistry Part I - Class 11', chapters: JSON.stringify([{name: "Chapter 1: Some Basic Concepts of Chemistry", pdf_filename: "kech101.pdf"}, {name: "Chapter 2: Structure of Atom", pdf_filename: "kech102.pdf"}, {name: "Chapter 3: Classification of Elements and Periodicity in Properties", pdf_filename: "kech103.pdf"}, {name: "Chapter 4: Chemical Bonding and Molecular Structure", pdf_filename: "kech104.pdf"}, {name: "Chapter 5: States of Matter", pdf_filename: "kech105.pdf"}, {name: "Chapter 6: Thermodynamics", pdf_filename: "kech106.pdf"}, {name: "Chapter 7: Equilibrium", pdf_filename: "kech107.pdf"}]), cover_image_url: `https://placehold.co/150x200/559BBA/FFFFFF.png?text=Chem+11.1` },
  { id: 'chem11_2', class_level: '11', subject: 'Chemistry', book_name: 'Chemistry Part II - Class 11', chapters: JSON.stringify([{name: "Chapter 8: Redox Reactions", pdf_filename: "kech201.pdf"}, {name: "Chapter 9: Hydrogen", pdf_filename: "kech202.pdf"}, {name: "Chapter 10: The s-Block Elements", pdf_filename: "kech203.pdf"}, {name: "Chapter 11: The p-Block Elements", pdf_filename: "kech204.pdf"}, {name: "Chapter 12: Organic Chemistry - Some Basic Principles and Techniques", pdf_filename: "kech205.pdf"}, {name: "Chapter 13: Hydrocarbons", pdf_filename: "kech206.pdf"}, {name: "Chapter 14: Environmental Chemistry", pdf_filename: "kech207.pdf"}]), cover_image_url: `https://placehold.co/150x200/559BBA/FFFFFF.png?text=Chem+11.2` },
  { id: 'bio11', class_level: '11', subject: 'Biology', book_name: 'Biology - Class 11', chapters: JSON.stringify([{name: "Chapter 1: The Living World", pdf_filename: "kebo101.pdf"}, {name: "Chapter 2: Biological Classification", pdf_filename: "kebo102.pdf"}, {name: "Chapter 3: Plant Kingdom", pdf_filename: "kebo103.pdf"}, {name: "Chapter 4: Animal Kingdom", pdf_filename: "kebo104.pdf"}, {name: "Chapter 5: Morphology of Flowering Plants", pdf_filename: "kebo105.pdf"}, {name: "Chapter 6: Anatomy of Flowering Plants", pdf_filename: "kebo106.pdf"}, {name: "Chapter 7: Structural Organisation in Animals", pdf_filename: "kebo107.pdf"}, {name: "Chapter 8: Cell: The Unit of Life", pdf_filename: "kebo108.pdf"}, {name: "Chapter 9: Biomolecules", pdf_filename: "kebo109.pdf"}, {name: "Chapter 10: Cell Cycle and Cell Division", pdf_filename: "kebo110.pdf"}, {name: "Chapter 11: Transport in Plants", pdf_filename: "kebo111.pdf"}, {name: "Chapter 12: Mineral Nutrition", pdf_filename: "kebo112.pdf"}, {name: "Chapter 13: Photosynthesis in Higher Plants", pdf_filename: "kebo113.pdf"}, {name: "Chapter 14: Respiration in Plants", pdf_filename: "kebo114.pdf"}, {name: "Chapter 15: Plant Growth and Development", pdf_filename: "kebo115.pdf"}, {name: "Chapter 16: Digestion and Absorption", pdf_filename: "kebo116.pdf"}, {name: "Chapter 17: Breathing and Exchange of Gases", pdf_filename: "kebo117.pdf"}, {name: "Chapter 18: Body Fluids and Circulation", pdf_filename: "kebo118.pdf"}, {name: "Chapter 19: Excretory Products and their Elimination", pdf_filename: "kebo119.pdf"}, {name: "Chapter 20: Locomotion and Movement", pdf_filename: "kebo120.pdf"}, {name: "Chapter 21: Neural Control and Coordination", pdf_filename: "kebo121.pdf"}, {name: "Chapter 22: Chemical Coordination and Integration", pdf_filename: "kebo122.pdf"}]), cover_image_url: `https://placehold.co/150x200/84CC16/FFFFFF.png?text=Bio+11` },
  { id: 'phy12_1', class_level: '12', subject: 'Physics', book_name: 'Physics Part I - Class 12', chapters: JSON.stringify([{name: "Chapter 1: Electric Charges and Fields", pdf_filename: "leph101.pdf"}, {name: "Chapter 2: Electrostatic Potential and Capacitance", pdf_filename: "leph102.pdf"}, {name: "Chapter 3: Current Electricity", pdf_filename: "leph103.pdf"}, {name: "Chapter 4: Moving Charges and Magnetism", pdf_filename: "leph104.pdf"}, {name: "Chapter 5: Magnetism and Matter", pdf_filename: "leph105.pdf"}, {name: "Chapter 6: Electromagnetic Induction", pdf_filename: "leph106.pdf"}, {name: "Chapter 7: Alternating Current", pdf_filename: "leph107.pdf"}, {name: "Chapter 8: Electromagnetic Waves", pdf_filename: "leph108.pdf"}]), cover_image_url: `https://placehold.co/150x200/A758A9/FFFFFF.png?text=Phy+12.1` },
  { id: 'phy12_2', class_level: '12', subject: 'Physics', book_name: 'Physics Part II - Class 12', chapters: JSON.stringify([{name: "Chapter 9: Ray Optics and Optical Instruments", pdf_filename: "leph201.pdf"}, {name: "Chapter 10: Wave Optics", pdf_filename: "leph202.pdf"}, {name: "Chapter 11: Dual Nature of Radiation and Matter", pdf_filename: "leph203.pdf"}, {name: "Chapter 12: Atoms", pdf_filename: "leph204.pdf"}, {name: "Chapter 13: Nuclei", pdf_filename: "leph205.pdf"}, {name: "Chapter 14: Semiconductor Electronics: Materials, Devices and Simple Circuits", pdf_filename: "leph206.pdf"}]), cover_image_url: `https://placehold.co/150x200/A758A9/FFFFFF.png?text=Phy+12.2` },
  { id: 'chem12_1', class_level: '12', subject: 'Chemistry', book_name: 'Chemistry Part I - Class 12', chapters: JSON.stringify([{name: "Chapter 1: The Solid State", pdf_filename: "lech101.pdf"}, {name: "Chapter 2: Solutions", pdf_filename: "lech102.pdf"}, {name: "Chapter 3: Electrochemistry", pdf_filename: "lech103.pdf"}, {name: "Chapter 4: Chemical Kinetics", pdf_filename: "lech104.pdf"}, {name: "Chapter 5: Surface Chemistry", pdf_filename: "lech105.pdf"}, {name: "Chapter 6: General Principles and Processes of Isolation of Elements", pdf_filename: "lech106.pdf"}, {name: "Chapter 7: The p-Block Elements", pdf_filename: "lech107.pdf"}, {name: "Chapter 8: The d-and f-Block Elements", pdf_filename: "lech108.pdf"}, {name: "Chapter 9: Coordination Compounds", pdf_filename: "lech109.pdf"}]), cover_image_url: `https://placehold.co/150x200/559BBA/FFFFFF.png?text=Chem+12.1` },
  { id: 'chem12_2', class_level: '12', subject: 'Chemistry', book_name: 'Chemistry Part II - Class 12', chapters: JSON.stringify([{name: "Chapter 10: Haloalkanes and Haloarenes", pdf_filename: "lech201.pdf"}, {name: "Chapter 11: Alcohols, Phenols and Ethers", pdf_filename: "lech202.pdf"}, {name: "Chapter 12: Aldehydes, Ketones and Carboxylic Acids", pdf_filename: "lech203.pdf"}, {name: "Chapter 13: Amines", pdf_filename: "lech204.pdf"}, {name: "Chapter 14: Biomolecules", pdf_filename: "lech205.pdf"}, {name: "Chapter 15: Polymers", pdf_filename: "lech206.pdf"}, {name: "Chapter 16: Chemistry in Everyday Life", pdf_filename: "lech207.pdf"}]), cover_image_url: `https://placehold.co/150x200/559BBA/FFFFFF.png?text=Chem+12.2` },
  { id: 'bio12', class_level: '12', subject: 'Biology', book_name: 'Biology - Class 12', chapters: JSON.stringify([{name: "Chapter 1: Reproduction in Organisms", pdf_filename: "lebo101.pdf"}, {name: "Chapter 2: Sexual Reproduction in Flowering Plants", pdf_filename: "lebo102.pdf"}, {name: "Chapter 3: Human Reproduction", pdf_filename: "lebo103.pdf"}, {name: "Chapter 4: Reproductive Health", pdf_filename: "lebo104.pdf"}, {name: "Chapter 5: Principles of Inheritance and Variation", pdf_filename: "lebo105.pdf"}, {name: "Chapter 6: Molecular Basis of Inheritance", pdf_filename: "lebo106.pdf"}, {name: "Chapter 7: Evolution", pdf_filename: "lebo107.pdf"}, {name: "Chapter 8: Human Health and Disease", pdf_filename: "lebo108.pdf"}, {name: "Chapter 9: Strategies for Enhancement in Food Production", pdf_filename: "lebo109.pdf"}, {name: "Chapter 10: Microbes in Human Welfare", pdf_filename: "lebo110.pdf"}, {name: "Chapter 11: Biotechnology : Principles and Processes", pdf_filename: "lebo111.pdf"}, {name: "Chapter 12: Biotechnology and its Applications", pdf_filename: "lebo112.pdf"}, {name: "Chapter 13: Organisms and Populations", pdf_filename: "lebo113.pdf"}, {name: "Chapter 14: Ecosystem", pdf_filename: "lebo114.pdf"}, {name: "Chapter 15: Biodiversity and Conservation", pdf_filename: "lebo115.pdf"}, {name: "Chapter 16: Environmental Issues", pdf_filename: "lebo116.pdf"}]), cover_image_url: `https://placehold.co/150x200/84CC16/FFFFFF.png?text=Bio+12` },
];
const NCERT_PDF_BASE_URL = "https://ncert.nic.in/textbook/pdf/";


export default function NcertViewerPage() {
  const [selectedClass, setSelectedClass] = useState<string>('11');
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [booksForSelection, setBooksForSelection] = useState<NcertBookMetadata[]>([]);
  const [selectedBook, setSelectedBook] = useState<NcertBookMetadata | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{name: string, pdf_filename: string} | null>(null);
  const [chapterNotes, setChapterNotes] = useState<UserNcertNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState<string | null>(null); 

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

  useEffect(() => {
    // In a real app, fetch this from `ncert_books_metadata` table in Supabase
    // For now, using the hardcoded ncertBooksData
    const filtered = ncertBooksData.filter(book => book.class_level === selectedClass && book.subject === selectedSubject);
    setBooksForSelection(filtered);
    setSelectedBook(null); 
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
        if (isEditingNote) { 
            const { error: updateError } = await supabase
                .from('user_ncert_notes')
                .update({ note_content: currentNote, updated_at: new Date().toISOString()})
                .eq('id', isEditingNote)
                .eq('user_id', userId);
            error = updateError;
        } else { 
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
            if(isEditingNote === noteId) { 
                setIsEditingNote(null);
                setCurrentNote('');
            }
        }
     });
  };


  const openChapterPdf = (pdfFilename: string) => {
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
                <SelectItem value="Biology">Biology</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isPending && booksForSelection.length === 0 && <div className="text-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto"/></div>}
          {!isPending && booksForSelection.length === 0 && <p className="text-muted-foreground text-center py-6">No books found for this selection. Ensure NCERT data is loaded.</p>}
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
                const chaptersArray = typeof selectedBook.chapters === 'string' ? JSON.parse(selectedBook.chapters) : selectedBook.chapters;
                const chap = (chaptersArray as Array<{name: string, pdf_filename: string}>)?.find((c: any) => c.name === value);
                setSelectedChapter(chap || null);
            }}>
              {(typeof selectedBook.chapters === 'string' ? JSON.parse(selectedBook.chapters) : selectedBook.chapters as Array<{name: string, pdf_filename: string}> || []).map((chapter: {name: string, pdf_filename: string}) => (
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
                    Chapter PDFs will open in a new tab from the official NCERT source. You can take digital notes related to each chapter here, which will be saved to your account. In-app PDF viewing/annotation is a complex feature; for now, external viewing is used.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
