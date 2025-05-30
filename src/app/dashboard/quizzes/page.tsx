// src/app/dashboard/quizzes/page.tsx
'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert } from '@/lib/database.types';

import { generateQuiz, type GenerateQuizInput, type QuizQuestion } from '@/ai/flows/quiz-generator';
import { explainQuizQuestion, type ExplainQuizQuestionInput } from '@/ai/flows/customizable-quiz-explanation';

import { Target, Lightbulb, ChevronRight, ChevronLeft, Loader2, Wand2, HelpCircle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

const quizConfigSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  numQuestions: z.coerce.number().int().min(1).max(10), // Max 10 for quicker demo
});

type QuizConfigFormData = z.infer<typeof quizConfigSchema>;

type CurrentQuiz = {
  quizData: Tables<'quizzes'>;
  questions: Tables<'questions'>[];
};

type UserAnswer = {
  questionId: string;
  selectedOptionIndex: number | null;
};

export default function QuizzesPage() {
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isSubmitting, startSubmittingTransition] = useTransition();
  const [isExplaining, startExplainingTransition] = useTransition();

  const [currentQuiz, setCurrentQuiz] = useState<CurrentQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizResults, setQuizResults] = useState<{ score: number; totalQuestions: number; attemptId: string } | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const supabase = createClient();

  const configForm = useForm<QuizConfigFormData>({
    resolver: zodResolver(quizConfigSchema),
    defaultValues: {
      topic: '',
      difficulty: 'medium',
      numQuestions: 5,
    },
  });

  async function onConfigSubmit(values: QuizConfigFormData) {
    startGeneratingTransition(async () => {
      setAiQuiz(null);
      setCurrentQuiz(null);
      setUserAnswers([]);
      setQuizResults(null);
      setExplanations({});
      setCurrentQuestionIndex(0);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to generate a quiz.' });
          return;
        }

        const aiInput: GenerateQuizInput = values;
        const generatedQuizOutput = await generateQuiz(aiInput);

        if (!generatedQuizOutput || generatedQuizOutput.questions.length === 0) {
          toast({ variant: 'destructive', title: 'Quiz Generation Failed', description: 'The AI could not generate questions for this topic. Please try again.' });
          return;
        }
        
        setAiQuiz(generatedQuizOutput.questions); // Temporary state for AI generated questions before DB save
        
        // Store quiz and questions in Supabase
        const quizId = uuidv4();
        const quizInsert: TablesInsert<'quizzes'> = {
          id: quizId,
          user_id: user.id,
          topic: values.topic,
          difficulty: values.difficulty,
          num_questions: generatedQuizOutput.questions.length,
        };

        const { error: quizError } = await supabase.from('quizzes').insert(quizInsert);
        if (quizError) throw quizError;

        const questionsInsert: TablesInsert<'questions'>[] = generatedQuizOutput.questions.map(q => ({
          id: uuidv4(),
          quiz_id: quizId,
          question_text: q.questionText,
          options: q.options,
          correct_option_index: q.correctOptionIndex,
          explanation_prompt: q.explanationPrompt,
        }));

        const { error: questionsError } = await supabase.from('questions').insert(questionsInsert);
        if (questionsError) throw questionsError;
        
        setCurrentQuiz({ quizData: quizInsert as Tables<'quizzes'>, questions: questionsInsert as Tables<'questions'>[] });
        setUserAnswers(questionsInsert.map(q => ({ questionId: q.id, selectedOptionIndex: null })));

        toast({
          title: 'Quiz Ready!',
          description: `Your ${values.difficulty} quiz on "${values.topic}" is generated. Good luck!`,
          className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
        });

      } catch (error: any) {
        console.error("Error generating quiz:", error);
        toast({
          variant: 'destructive',
          title: 'Error Generating Quiz',
          description: error.message || 'An unexpected error occurred while generating the quiz.',
        });
      }
    });
  }
  
  // Used to temporarily hold AI generated questions before they are saved to DB and put into currentQuiz
  const [aiQuiz, setAiQuiz] = useState<QuizQuestion[] | null>(null);


  const handleAnswerChange = (questionId: string, selectedOptionIndex: number) => {
    setUserAnswers(prevAnswers =>
      prevAnswers.map(ans =>
        ans.questionId === questionId ? { ...ans, selectedOptionIndex } : ans
      )
    );
  };

  const handleNextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  async function handleSubmitQuiz() {
    if (!currentQuiz || !userAnswers) return;

    startSubmittingTransition(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to submit a quiz.' });
          return;
        }

        let score = 0;
        userAnswers.forEach(userAns => {
          const question = currentQuiz.questions.find(q => q.id === userAns.questionId);
          if (question && question.correct_option_index === userAns.selectedOptionIndex) {
            score++;
          }
        });

        const attemptId = uuidv4();
        const attemptInsert: TablesInsert<'quiz_attempts'> = {
          id: attemptId,
          user_id: user.id,
          quiz_id: currentQuiz.quizData.id,
          score: score,
          answers_submitted: userAnswers.map(ua => ({q: ua.questionId, a: ua.selectedOptionIndex})), // Store lean answers
          completed_at: new Date().toISOString(),
        };
        
        const { error: attemptError } = await supabase.from('quiz_attempts').insert(attemptInsert);
        if (attemptError) throw attemptError;

        setQuizResults({ score, totalQuestions: currentQuiz.questions.length, attemptId });
        toast({
          title: 'Quiz Submitted!',
          description: `You scored ${score} out of ${currentQuiz.questions.length}.`,
          className: 'bg-accent/10 border-accent text-accent-foreground glow-text-accent',
        });

      } catch (error: any) {
        console.error("Error submitting quiz:", error);
        toast({
          variant: 'destructive',
          title: 'Error Submitting Quiz',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  async function handleGetExplanation(question: Tables<'questions'>, studentAnswerIndex: number | null) {
    if (!question.explanation_prompt) {
      toast({ variant: 'destructive', title: 'No Explanation Available', description: 'This question does not have an explanation prompt.' });
      return;
    }
    startExplainingTransition(async () => {
      try {
        const studentAnswerText = studentAnswerIndex !== null ? question.options[studentAnswerIndex] as string : "Not Answered";
        const input: ExplainQuizQuestionInput = {
          question: question.question_text,
          answer: question.options[question.correct_option_index] as string,
          studentAnswer: studentAnswerText,
          topic: currentQuiz?.quizData.topic || 'general', // Fallback topic
        };
        
        const result = await explainQuizQuestion(input);
        setExplanations(prev => ({ ...prev, [question.id]: result.explanation }));
      } catch (error: any) {
        console.error("Error fetching explanation:", error);
        toast({
          variant: 'destructive',
          title: 'Error Fetching Explanation',
          description: error.message || 'Could not load explanation.',
        });
      }
    });
  }
  
  const renderQuizTaker = () => {
    if (!currentQuiz) return null;
    const question = currentQuiz.questions[currentQuestionIndex];
    const userAnswer = userAnswers.find(ans => ans.questionId === question.id);

    return (
      <Card className="w-full max-w-2xl mx-auto interactive-card shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-primary flex justify-between items-center">
            <span>{currentQuiz.quizData.topic} Quiz</span>
            <span className="text-sm font-normal text-muted-foreground">Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</span>
          </CardTitle>
          <Progress value={((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100} className="w-full h-2 [&>div]:bg-primary" />
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg font-semibold">{question.question_text}</p>
          <RadioGroup
            value={userAnswer?.selectedOptionIndex !== null && userAnswer?.selectedOptionIndex !== undefined ? userAnswer.selectedOptionIndex.toString() : ""}
            onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
            className="space-y-3"
          >
            {(question.options as string[]).map((option, index) => (
              <FormItem key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                <FormControl>
                  <RadioGroupItem value={index.toString()} id={`${question.id}-option-${index}`} />
                </FormControl>
                <FormLabel htmlFor={`${question.id}-option-${index}`} className="font-normal text-base flex-1 cursor-pointer">
                  {String.fromCharCode(65 + index)}. {option}
                </FormLabel>
              </FormItem>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0} className="glow-button">
            <ChevronLeft className="mr-2" /> Previous
          </Button>
          {currentQuestionIndex < currentQuiz.questions.length - 1 ? (
            <Button onClick={handleNextQuestion} className="glow-button bg-primary hover:bg-primary/90">
              Next <ChevronRight className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmitQuiz} disabled={isSubmitting} className="glow-button bg-green-500 hover:bg-green-600">
              {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" />}
              Submit Quiz
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderResults = () => {
    if (!quizResults || !currentQuiz) return null;
    
    const percentage = (quizResults.score / quizResults.totalQuestions) * 100;
    let feedbackMessage: ReactNode;
    let feedbackColor = "text-red-500";

    if (percentage >= 80) {
      feedbackMessage = <><CheckCircle2 className="inline mr-2"/>Excellent work! You've mastered this topic.</>;
      feedbackColor = "text-green-400";
    } else if (percentage >= 60) {
      feedbackMessage = <><ThumbsUp className="inline mr-2"/>Good job! A little more practice and you'll ace it.</>;
      feedbackColor = "text-yellow-400";
    } else {
      feedbackMessage = <><RotateCcw className="inline mr-2"/>Keep practicing! Review the explanations to improve.</>;
      feedbackColor = "text-orange-400";
    }


    return (
      <Card className="w-full max-w-3xl mx-auto interactive-card shadow-xl shadow-accent/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline glow-text-accent">Quiz Results!</CardTitle>
          <CardDescription className={`text-xl font-semibold ${feedbackColor}`}>{feedbackMessage}</CardDescription>
          <p className="text-4xl font-bold glow-text-primary py-4">
            {quizResults.score} / {quizResults.totalQuestions}
          </p>
          <Progress value={percentage} className="w-full h-4 [&>div]:bg-gradient-to-r [&>div]:from-secondary [&>div]:to-accent" />
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-4 text-center">Review Your Answers:</h3>
          <Accordion type="single" collapsible className="w-full">
            {currentQuiz.questions.map((q, index) => {
              const userAnswer = userAnswers.find(ans => ans.questionId === q.id);
              const isCorrect = userAnswer?.selectedOptionIndex === q.correct_option_index;
              return (
                <AccordionItem value={q.id} key={q.id} className="border-b-border/30">
                  <AccordionTrigger className={`text-left hover:no-underline ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="flex items-center justify-between w-full">
                       <span>Question {index + 1}: {q.question_text.substring(0,50)}{q.question_text.length > 50 ? '...' : ''}</span>
                       {isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-3">
                    <p><strong>Your Answer:</strong> {userAnswer?.selectedOptionIndex !== null && userAnswer?.selectedOptionIndex !== undefined ? String.fromCharCode(65 + userAnswer.selectedOptionIndex) + '. ' + (q.options as string[])[userAnswer.selectedOptionIndex] : 'Not Answered'}</p>
                    <p className="text-green-400"><strong>Correct Answer:</strong> {String.fromCharCode(65 + q.correct_option_index)}. {(q.options as string[])[q.correct_option_index]}</p>
                    {explanations[q.id] ? (
                      <Alert variant="default" className="bg-card-foreground/5">
                        <Lightbulb className="h-5 w-5 text-accent" />
                        <AlertTitle className="text-accent">AI Explanation</AlertTitle>
                        <AlertDescription className="text-sm whitespace-pre-wrap">{explanations[q.id]}</AlertDescription>
                      </Alert>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGetExplanation(q, userAnswer?.selectedOptionIndex ?? null)}
                        disabled={isExplaining || !q.explanation_prompt}
                        className="glow-button border-accent text-accent hover:bg-accent/10 hover:text-accent"
                      >
                        {isExplaining && explanations[q.id] === undefined ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HelpCircle className="mr-2 h-4 w-4" />}
                        Get AI Explanation
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
        <CardFooter className="flex justify-center">
           <Button onClick={() => { setCurrentQuiz(null); setQuizResults(null); configForm.reset(); }} className="glow-button">
            <RotateCcw className="mr-2"/> Take Another Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  };
  

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Target className="mr-4 h-10 w-10" /> Customizable Quiz Arena
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Forge your knowledge! Configure a quiz, test your skills, and get AI-powered insights.
        </p>
      </header>

      {!currentQuiz && !quizResults && (
        <Card className="max-w-lg mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline">
              <Wand2 className="mr-3 h-8 w-8 text-primary" /> Configure Your Challenge
            </CardTitle>
            <CardDescription>
              Set the parameters for your personalized quiz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...configForm}>
              <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="space-y-6">
                <FormField
                  control={configForm.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Cell Biology, Kinematics, Organic Chemistry Basics" {...field} className="h-11 text-base border-2 border-input focus:border-primary"/>
                      </FormControl>
                      <FormDescription>Enter the specific topic or chapter for your quiz.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-base border-2 border-input focus:border-primary">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="numQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Number of Questions (1-10)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="10" {...field} className="h-11 text-base border-2 border-input focus:border-primary"/>
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-6 w-6" />
                  )}
                  Generate Quiz
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      
      {isGenerating && !currentQuiz && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Generating your custom quiz... this might take a moment.</p>
        </div>
      )}

      {currentQuiz && !quizResults && renderQuizTaker()}
      {quizResults && renderResults()}

    </div>
  );
}

// Helper to get ThumbsUp icon if available or fallback
const ThumbsUp = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-thumbs-up", className)}><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 3 3.88Z"/></svg>
);
