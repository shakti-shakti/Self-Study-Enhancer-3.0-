// src/app/dashboard/admin/page.tsx
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, AlertTriangle, Users, Settings, BarChart3, MessageSquare, Edit, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { toast } = useToast();
  const [featureXEnabled, setFeatureXEnabled] = useState(true);
  const [featureYPassword, setFeatureYPassword] = useState("demoPass123");
  const [feedbackResponse, setFeedbackResponse] = useState("");

  const handleToggleFeature = (featureName: string, currentStatus: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(!currentStatus);
    toast({
      title: "Feature Flag Toggled (Conceptual)",
      description: `${featureName} is now ${!currentStatus ? 'ENABLED' : 'DISABLED'}. (This is a UI demo; no backend change occurred.)`,
    });
  };

  const handleChangePassword = (featureName: string, newPassword: string) => {
    setFeatureYPassword(newPassword); // Simulating update
    toast({
      title: "Feature Password Changed (Conceptual)",
      description: `Password for ${featureName} updated to "${newPassword}". (Demo only; not secure.)`,
    });
  };
  
  const handleSendFeedbackResponse = () => {
    if(!feedbackResponse.trim()){
      toast({variant: 'destructive', title: "Response Empty", description: "Please type a response for the feedback."});
      return;
    }
    toast({
      title: "Feedback Response Sent (Conceptual)",
      description: `Your response: "${feedbackResponse.substring(0,30)}..." has been noted. (Demo only.)`,
    });
    setFeedbackResponse("");
  };

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-destructive mb-3 flex items-center justify-center">
          <ShieldCheck className="mr-4 h-10 w-10" /> Admin Panel (Conceptual Demo)
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          This area demonstrates potential admin functionalities. All actions are client-side simulations.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="interactive-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline glow-text-primary"><Users className="mr-2"/> User Overview (Conceptual)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Total Registered Users: <span className="font-bold text-primary">1,234 (Demo)</span></p>
            <p>Daily Active Users: <span className="font-bold text-primary">150 (Demo)</span></p>
            <p>Quizzes Taken Today: <span className="font-bold text-primary">78 (Demo)</span></p>
            <Button variant="outline" size="sm" className="mt-2 glow-button" onClick={() => toast({title: "Action: View All Users (Conceptual)", description: "This would navigate to a user management table."})}>View All Users</Button>
          </CardContent>
        </Card>

        <Card className="interactive-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline glow-text-primary"><BarChart3 className="mr-2"/> App Analytics (Conceptual)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Most Used Feature: <span className="font-bold text-primary">AI Study Assistant (Demo)</span></p>
            <p>Average Quiz Score: <span className="font-bold text-primary">72% (Demo)</span></p>
            <Button variant="outline" size="sm" className="mt-2 glow-button" onClick={() => toast({title: "Action: View Full Analytics (Conceptual)", description: "This would open a detailed analytics dashboard."})}>View Full Analytics</Button>
          </CardContent>
        </Card>

        <Card className="interactive-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline glow-text-primary"><Settings className="mr-2"/> Feature Flags (Conceptual)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="feature-x" className="text-base">Enable "Advanced Story Mode"</Label>
              <Switch id="feature-x" checked={featureXEnabled} onCheckedChange={() => handleToggleFeature("Advanced Story Mode", featureXEnabled, setFeatureXEnabled)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-y-pass" className="text-base">Password for "Expert Puzzles"</Label>
              <div className="flex gap-2">
                <Input id="feature-y-pass" value={featureYPassword} onChange={(e) => setFeatureYPassword(e.target.value)} className="input-glow" />
                <Button size="sm" onClick={() => handleChangePassword("Expert Puzzles", featureYPassword)} className="glow-button">Set</Button>
              </div>
            </div>
             <Button variant="outline" size="sm" className="mt-2 glow-button" onClick={() => toast({title: "Action: Manage All Content (Conceptual)", description: "This would lead to content management interfaces."})}>
              <Edit className="mr-2 h-4 w-4"/> Manage All Content
            </Button>
          </CardContent>
        </Card>
        
        <Card className="interactive-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline glow-text-primary"><MessageSquare className="mr-2"/> User Feedback/Requests (Conceptual)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-md bg-muted/50">
                <p className="font-semibold text-sm">User: student123 (Demo)</p>
                <p className="text-xs text-muted-foreground">Request: "Can't unlock Physics Chapter 4."</p>
            </div>
            <Textarea placeholder="Type your response or action notes here..." value={feedbackResponse} onChange={e => setFeedbackResponse(e.target.value)} className="input-glow"/>
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="glow-button" onClick={() => toast({title: "Action: Remotely Unlock Content (Conceptual)", description:"This would trigger a backend function to unlock content for 'student123'."})}>Unlock Content for User</Button>
                <Button size="sm" className="glow-button" onClick={handleSendFeedbackResponse} disabled={!feedbackResponse.trim()}>
                  <Send className="mr-1 h-4 w-4"/> Send Response
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Alert variant="destructive" className="max-w-2xl mx-auto shadow-lg">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-bold">Developer Note</AlertTitle>
        <AlertDescription>
          This Admin Panel is a **conceptual UI demonstration only**. All actions performed here are simulated on the client-side and do not interact with a real backend or database. Full implementation requires significant backend development, security measures, and database integration.
        </AlertDescription>
      </Alert>
    </div>
  );
}
