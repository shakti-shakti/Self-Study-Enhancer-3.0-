
// src/app/dashboard/file-uploads/page.tsx
'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, Loader2, FileText, ImageIcon, Trash2, Download, Eye, Info, Wand2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

type UserFile = Tables<'user_files'>;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit
const ACCEPTED_FILE_TYPES = [
  "application/pdf", 
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .doc, .docx
  "text/plain"
];

export default function FileUploadsPage() {
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isProcessing, startProcessingTransition] = useTransition(); 
  
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchUserFiles = useCallback(async () => {
    if (!userId) return;
    startProcessingTransition(async () => {
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching files', description: error.message });
      } else {
        setUserFiles(data || []);
      }
    });
  }, [userId, supabase, toast]);

  useEffect(() => {
    if (userId) fetchUserFiles();
  }, [userId, fetchUserFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: 'destructive', title: 'File too large', description: `Maximum file size is ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB.` });
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast({ variant: 'destructive', title: 'Invalid file type', description: 'Allowed types: PDF, Images (JPEG, PNG, WEBP, GIF), DOC, DOCX, TXT.' });
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      toast({ variant: 'destructive', title: 'No file selected or not authenticated' });
      return;
    }
    startProcessingTransition(async () => {
      const filePath = `${userId}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user-uploads') 
        .upload(filePath, selectedFile);

      if (uploadError) {
        let errorDescription = uploadError.message;
        if (uploadError.message.toLowerCase().includes('bucket not found')) {
            errorDescription = "Upload failed: The 'user-uploads' storage bucket was not found. Please ensure it's created in your Supabase project storage with appropriate policies."
        }
        toast({ variant: 'destructive', title: 'Upload failed', description: errorDescription, duration: 10000 });
        return;
      }

      const fileMetadata: TablesInsert<'user_files'> = {
        user_id: userId,
        file_name: selectedFile.name,
        file_path: filePath,
        file_type: selectedFile.type,
        size_bytes: selectedFile.size,
        description: description || null,
      };

      const { error: dbError } = await supabase.from('user_files').insert(fileMetadata);
      if (dbError) {
        toast({ variant: 'destructive', title: 'Failed to save file metadata', description: dbError.message });
        await supabase.storage.from('user-uploads').remove([filePath]);
      } else {
        toast({ title: 'File Uploaded Successfully!', className: 'bg-primary/10 border-primary text-primary-foreground' });
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'file_uploaded',
          description: `Uploaded file: "${selectedFile.name}"`,
          details: { filename: selectedFile.name, type: selectedFile.type, size: selectedFile.size }
        };
        await supabase.from('activity_logs').insert(activityLog);
        setSelectedFile(null);
        setDescription('');
        if(fileInputRef.current) fileInputRef.current.value = "";
        fetchUserFiles(); 
      }
    });
  };

  const handleDeleteFile = async (file: UserFile) => {
    if (!userId) return;
    startProcessingTransition(async () => { 
      const { error: storageError } = await supabase.storage
        .from('user-uploads')
        .remove([file.file_path]);
      
      if (storageError && storageError.message !== 'The resource was not found') { 
        toast({ variant: 'destructive', title: 'Storage deletion failed', description: storageError.message });
        return;
      }

      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', file.id)
        .eq('user_id', userId);

      if (dbError) {
        toast({ variant: 'destructive', title: 'Metadata deletion failed', description: dbError.message });
      } else {
        toast({ title: 'File Deleted Successfully' });
         const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'file_deleted',
          description: `Deleted file: "${file.file_name}"`,
          details: { filename: file.file_name }
        };
        await supabase.from('activity_logs').insert(activityLog);
        fetchUserFiles(); 
      }
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-accent" />;
    if (fileType === 'application/pdf') return <FileText className="h-8 w-8 text-red-400" />;
    if (fileType.includes('word')) return <FileText className="h-8 w-8 text-blue-400" />;
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  const getFilePublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('user-uploads').getPublicUrl(filePath);
    return data.publicUrl;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <UploadCloud className="mr-4 h-10 w-10" /> File & Image Uploads
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Upload and manage your study notes, diagrams, and other helpful resources. Max 10MB per file.
        </p>
      </header>

      <Card className="interactive-card shadow-xl p-4 md:p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-accent">Upload New File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="file-upload" className="text-base font-medium">Choose File</label>
            <Input 
              id="file-upload" 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              className="mt-1 input-glow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground mt-1">Max ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB. Allowed: PDF, Images, DOC, TXT.</p>
          </div>
          <div>
            <label htmlFor="file-description" className="text-base font-medium">Description (Optional)</label>
            <Textarea 
              id="file-description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Briefly describe the file content..."
              className="mt-1 input-glow"
              disabled={isProcessing}
            />
          </div>
          <Button onClick={handleUpload} disabled={!selectedFile || isProcessing} className="w-full glow-button text-lg py-3">
            {isProcessing && selectedFile ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2" />}
            Upload File
          </Button>
        </CardContent>
      </Card>

      <Alert variant="default" className="max-w-3xl mx-auto bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Note Analysis (Future Feature)</AlertTitle>
        <AlertDescription>
            Currently, this page allows you to store your files. For AI-powered analysis of text-based notes (like summaries or key points), please copy the text from your document and paste it into the{" "}
            <Link href="/dashboard/smart-notes-generator" className="font-medium text-primary hover:underline">Smart Notes Generator <Wand2 className="inline h-4 w-4 ml-1"/></Link>.
            Automatic analysis of uploaded PDFs or DOCs via OCR is a planned future enhancement.
        </AlertDescription>
      </Alert>

      <Card className="interactive-card shadow-xl mt-8 p-4 md:p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-primary">Your Uploaded Files</CardTitle>
          <CardDescription>Access and manage your uploaded resources.</CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing && userFiles.length === 0 && <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /></div>}
          {!isProcessing && userFiles.length === 0 && (
            <div className="text-center py-10">
                <UploadCloud className="mx-auto h-16 w-16 text-muted-foreground/50 my-4" />
                <p className="text-xl text-muted-foreground">No files uploaded yet.</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFiles.map(file => (
              <Card key={file.id} className="bg-card/70 border border-border/50 shadow-md overflow-hidden">
                <CardHeader className="flex flex-row items-center space-x-3 p-4 bg-muted/10">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate" title={file.file_name}>{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size_bytes / (1024*1024)).toFixed(2)} MB</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {file.description && <p className="text-sm text-muted-foreground line-clamp-2" title={file.description}>{file.description}</p>}
                  <p className="text-xs text-muted-foreground">Uploaded: {format(parseISO(file.uploaded_at), "PPp")}</p>
                </CardContent>
                <CardFooter className="p-3 bg-muted/10 flex justify-end gap-2">
                   <Link href={getFilePublicUrl(file.file_path)} target="_blank" rel="noopener noreferrer" passHref legacyBehavior>
                        <Button asChild variant="outline" size="sm" className="glow-button"><a href={getFilePublicUrl(file.file_path)} target="_blank" rel="noopener noreferrer"><Eye className="mr-1 h-4 w-4"/> View</a></Button>
                   </Link>
                   <Link href={getFilePublicUrl(file.file_path)} download={file.file_name} passHref legacyBehavior>
                        <Button asChild variant="outline" size="sm" className="glow-button border-primary text-primary hover:bg-primary/10"><a href={getFilePublicUrl(file.file_path)} download={file.file_name}><Download className="mr-1 h-4 w-4"/> Download</a></Button>
                   </Link>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteFile(file)} disabled={isProcessing} className="glow-button">
                    <Trash2 className="mr-1 h-4 w-4"/> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

