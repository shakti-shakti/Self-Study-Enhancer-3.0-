
// src/app/dashboard/quizzes/page.tsx
'use client';

import { useState, useTransition, type ReactNode, useEffect, useCallback } from 'react';
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
// RadioGroup and RadioGroupItem are used for the config form, but NOT for rendering quiz options
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert, QuizAttemptWithQuizTopic, Question } from '@/lib/database.types';

import { generateQuiz, type GenerateQuizInput, type QuizQuestion as AIQuizQuestion } from '@/ai/flows/quiz-generator';
import { explainQuizQuestion, type ExplainQuizQuestionInput } from '@/ai/flows/customizable-quiz-explanation';
import * as apiClient from '@/lib/apiClient';

import { Target, Lightbulb, ChevronRight, ChevronLeft, Loader2, Wand2, HelpCircle, CheckCircle2, XCircle, RotateCcw, Save, ThumbsUp, ClipboardCopy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Updated syllabusData
const syllabusData: Record<string, Record<string, Record<string, string[]>>> = {
  "Physics": {
    "Class 11": {
      "1. Physical World and Measurement": [],
      "2. Kinematics": [],
      "3. Laws of Motion": [],
      "4. Work, Energy and Power": [],
      "5. Motion of System of Particles and Rigid Body": [],
      "6. Gravitation": [],
      "7. Properties of Bulk Matter": [],
      "8. Thermodynamics": [],
      "9. Behaviour of Perfect Gas and Kinetic Theory": [],
      "10. Oscillations and Waves": []
    },
    "Class 12": {
      "11. Electrostatics": [],
      "12. Current Electricity": [],
      "13. Magnetic Effects of Current and Magnetism": [],
      "14. Electromagnetic Induction and Alternating Current": [],
      "15. Electromagnetic Waves": [],
      "16. Optics": [],
      "17. Dual Nature of Matter and Radiation": [],
      "18. Atoms and Nuclei": [],
      "19. Electronic Devices": [],
      "20. Experimental Skills": []
    }
  },
  "Chemistry": {
    "Class 11": {
      "1. Some Basic Concepts of Chemistry": [],
      "2. Structure of Atom": [],
      "3. Classification of Elements and Periodicity in Properties": [],
      "4. Chemical Bonding and Molecular Structure": [],
      "5. States of Matter: Gases and Liquids": [],
      "6. Thermodynamics": [],
      "7. Equilibrium": [],
      "8. Redox Reactions": [],
      "9. Hydrogen": [],
      "10. The s-Block Element": [],
      "11. Some p-Block Elements": [],
      "12. Organic Chemistry - Some Basic Principles and Techniques": [],
      "13. Hydrocarbons": [],
      "14. Environmental Chemistry": []
    },
    "Class 12": {
      "1. Solid State": [],
      "2. Solutions": [],
      "3. Electrochemistry": [],
      "4. Chemical Kinetics": [],
      "5. Surface Chemistry": [],
      "6. General Principles and Processes of Isolation of Elements": [],
      "7. The p-Block Element": [],
      "8. The d- and f-Block Elements": [],
      "9. Coordination Compounds": [],
      "10. Haloalkanes and Haloarenes": [],
      "11. Alcohols, Phenols and Ethers": [],
      "12. Aldehydes, Ketones and Carboxylic Acids": [],
      "13. Organic Compounds Containing Nitrogen": [],
      "14. Biomolecules": [],
      "15. Polymers": [],
      "16. Chemistry in Everyday Life": []
    }
  },
  "Biology": {
    "Class 11": {
      "1. Diversity of Living Organisms": [],
      "2. Structural Organisation in Animals and Plants": [],
      "3. Cell Structure and Function": [],
      "4. Plant Physiology": [],
      "5. Human Physiology": []
    },
    "Class 12": {
      "6. Reproduction": [],
      "7. Genetics and Evolution": [],
      "8. Biology and Human Welfare": [],
      "9. Biotechnology and Its Applications": [],
      "10. Ecology and Environment": []
    }
  }
};


const quizConfigSchema = z.object({
  class_level: z.enum(['11', '12'], { required_error: 'Please select a class.' }),
  subject: z.enum(['Physics', 'Chemistry', 'Biology'], { required_error: 'Please select a subject.' }),
  chapter: z.string().optional(),
  topic: z.string().optional(), // Topic is not in the new structure, but keeping field for potential future use. UI will not populate it.
  question_source: z.enum(['NCERT', 'PYQ', 'Mixed']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  numQuestions: z.coerce.number().int().min(1).max(50),
});

type QuizConfigFormData = z.infer<typeof quizConfigSchema>;

type CurrentGeneratedQuiz = {
  quizData: Omit<TablesInsert<'quizzes'>, 'id' | 'user_id' | 'created_at' | 'topic'> & { 
    id: string, 
    user_id: string, 
    topics: string[] | null, // topics is used for combined chapter/topic strings for DB
    display_topic?: string 
  };
  questions: Question[];
};

type UserAnswer = {
  questionId: string;
  selectedOptionIndex: number | null;
};

type QuizResult = {
  score: number;
  totalQuestions: number;
  attemptId: string;
  quizId: string;
  questionsWithUserAnswers: (Question & { userAnswerIndex: number | null })[];
};


export default function QuizzesPage() {
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isSubmitting, startSubmittingTransition] = useTransition();
  const [isExplaining, startExplainingTransition] = useTransition();
  const [isSavingQuestion, startSavingQuestionTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);

  const [currentGeneratedQuiz, setCurrentGeneratedQuiz] = useState<CurrentGeneratedQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  const [availableSubjects, setAvailableSubjects] = useState<string[]>(Object.keys(syllabusData));
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  // Topics are no longer used from the new syllabus structure, so availableTopics will remain empty.
  // const [availableTopics, setAvailableTopics] = useState<string[]>([]);


  const { toast } = useToast();
  const supabase = createClient();

  const configForm = useForm<QuizConfigFormData>({
    resolver: zodResolver(quizConfigSchema),
    defaultValues: {
      difficulty: 'medium',
      numQuestions: 5,
      class_level: undefined,
      subject: undefined,
      chapter: '',
      topic: '', // Will remain empty
      question_source: undefined,
    },
  });

  const selectedClass = configForm.watch('class_level');
  const selectedSubject = configForm.watch('subject');
  // const selectedChapter = configForm.watch('chapter'); // No longer needed for topic filtering

  useEffect(() => {
    if (selectedClass && selectedSubject && syllabusData[selectedSubject] && syllabusData[selectedSubject][`Class ${selectedClass}`]) {
      const chapters = Object.keys(syllabusData[selectedSubject][`Class ${selectedClass}`]);
      setAvailableChapters(chapters);
    } else {
      setAvailableChapters([]);
    }
    configForm.setValue('chapter', ''); // Reset chapter when class/subject changes
    // configForm.setValue('topic', ''); // Reset topic
    // setAvailableTopics([]);
  }, [selectedClass, selectedSubject, configForm]);

  // This useEffect for topics is no longer needed as topics are not in the new structure
  // useEffect(() => {
  //   if (selectedClass && selectedSubject && selectedChapter && syllabusData[selectedSubject]?.[`Class ${selectedClass}`]?.[selectedChapter]) {
  //     const topics = syllabusData[selectedSubject][`Class ${selectedClass}`][selectedChapter];
  //     setAvailableTopics(topics);
  //   } else {
  //     setAvailableTopics([]);
  //   }
  //   configForm.setValue('topic', ''); // Reset topic when chapter changes
  // }, [selectedChapter, selectedClass, selectedSubject, configForm]);


  useEffect(() => {
    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);


  async function onConfigSubmit(values: QuizConfigFormData) {
    if (!userId) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }
    startGeneratingTransition(async () => {
      setCurrentGeneratedQuiz(null);
      setUserAnswers([]);
      setQuizResults(null);
      setExplanations({});
      setCurrentQuestionIndex(0);

      try {
        // Construct a more descriptive topic for the AI based on selected chapter
        let topicForAI = `${values.subject} - Class ${values.class_level}`;
        if (values.chapter) {
          topicForAI += ` - ${values.chapter}`; // Using the full chapter name from selection
        }
        // The 'topic' field is no longer populated from the new syllabus, so we don't use values.topic here.
        if (values.question_source) {
          topicForAI += ` - Source: ${values.question_source}`;
        }

        const aiInput: GenerateQuizInput = {
          topic: topicForAI,
          difficulty: values.difficulty,
          numQuestions: values.numQuestions,
        };
        const generatedQuizOutput = await generateQuiz(aiInput);

        if (!generatedQuizOutput || generatedQuizOutput.questions.length === 0) {
          toast({ variant: 'destructive', title: 'Quiz Generation Failed', description: 'The AI could not generate questions for this topic. Please try a different chapter or broader settings.' });
          return;
        }

        const quizId = uuidv4();
        // `topics` field in DB can store the chapter name
        const dbTopicsArray = values.chapter ? [values.chapter] : null;
        const displayTopicString = values.chapter || values.subject;


        const quizDataForState: CurrentGeneratedQuiz['quizData'] = {
            id: quizId,
            user_id: userId,
            class_level: values.class_level,
            subject: values.subject,
            topics: dbTopicsArray, 
            question_source: values.question_source || null,
            difficulty: values.difficulty,
            num_questions: generatedQuizOutput.questions.length,
            display_topic: displayTopicString, 
        };

        const questionsForState: Question[] = generatedQuizOutput.questions.map(q => ({
            id: uuidv4(),
            quiz_id: quizId,
            question_text: q.questionText,
            options: q.options,
            correct_option_index: q.correctOptionIndex,
            explanation_prompt: q.explanationPrompt,
            class_level: values.class_level,
            subject: values.subject,
            topic: values.chapter || null, // Store chapter as topic if specific topic isn't available
            source: values.question_source || null,
            neet_syllabus_year: 2026, 
            created_at: new Date().toISOString(),
        }));

        setCurrentGeneratedQuiz({ quizData: quizDataForState, questions: questionsForState });
        setUserAnswers(questionsForState.map(q => ({ questionId: q.id, selectedOptionIndex: null })));

        toast({
          title: 'Quiz Ready!',
          description: `Your ${values.difficulty} quiz is generated. Good luck!`,
          className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
        });

      } catch (error: any) {
        console.error("Error generating quiz:", error);
        toast({ variant: 'destructive', title: 'Error Generating Quiz', description: error.message || 'An unexpected error occurred.' });
      }
    });
  }

  const handleAnswerChange = (questionId: string, selectedOptionIndex: number) => {
    setUserAnswers(prevAnswers => prevAnswers.map(ans => ans.questionId === questionId ? { ...ans, selectedOptionIndex } : ans));
  };

  const handleNextQuestion = () => {
    if (currentGeneratedQuiz && currentQuestionIndex < currentGeneratedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1); 
    }
  };

  async function handleSubmitQuiz() {
    if (!currentGeneratedQuiz || !userAnswers || !userId) return;

    startSubmittingTransition(async () => {
      try {
        const { display_topic, ...quizDataForDbBase } = currentGeneratedQuiz.quizData;
        
        const quizToInsert: TablesInsert<'quizzes'> = {
            ...quizDataForDbBase, 
            user_id: userId,
            // The `topic` field for quizzes table can be the chapter name or general subject if no chapter
            topic: currentGeneratedQuiz.quizData.topics ? currentGeneratedQuiz.quizData.topics[0] : currentGeneratedQuiz.quizData.subject 
        };
        
        const { data: insertedQuiz, error: quizError } = await supabase.from('quizzes').insert(quizToInsert).select().single();
        if (quizError) {
            toast({ variant: 'destructive', title: 'DB Error: Quiz Save', description: `Code: ${quizError.code}. ${quizError.message}` });
            return; 
        }

        const questionsToInsert = currentGeneratedQuiz.questions.map(q => ({
            id: q.id,
            quiz_id: insertedQuiz.id,
            question_text: q.question_text,
            options: q.options,
            correct_option_index: q.correct_option_index,
            explanation_prompt: q.explanation_prompt,
            class_level: q.class_level,
            subject: q.subject,
            topic: q.topic, // This should be the chapter name now
            source: q.source,
            neet_syllabus_year: q.neet_syllabus_year,
            created_at: q.created_at,
        }));

        if (questionsToInsert.length === 0) {
          toast({ variant: 'destructive', title: 'Quiz Error', description: 'No questions were generated or found to save.' });
          return;
        }

        const { error: questionsError } = await supabase.from('questions').insert(questionsToInsert);
        if (questionsError) {
             toast({ variant: 'destructive', title: 'DB Error: Question Save', description: `Code: ${questionsError.code}. ${questionsError.message}` });
             return; 
        }
        
        let score = 0;
        const questionsWithUserAnswers = currentGeneratedQuiz.questions.map(q => {
            const userAnswer = userAnswers.find(ans => ans.questionId === q.id);
            if (userAnswer && userAnswer.selectedOptionIndex === q.correct_option_index) {
                score++;
            }
            return {...q, userAnswerIndex: userAnswer?.selectedOptionIndex ?? null };
        });

        const attemptId = uuidv4();
        const attemptInsert: TablesInsert<'quiz_attempts'> = {
          id: attemptId,
          user_id: userId,
          quiz_id: insertedQuiz.id,
          score: score,
          total_questions: currentGeneratedQuiz.questions.length,
          answers_submitted: userAnswers.map(ua => ({q: ua.questionId, a: ua.selectedOptionIndex})),
          completed_at: new Date().toISOString(),
        };
        const { error: attemptError } = await supabase.from('quiz_attempts').insert(attemptInsert);
        if (attemptError) {
            toast({ variant: 'destructive', title: 'DB Error: Attempt Save', description: `Code: ${attemptError.code}. ${attemptError.message}` });
            return;
        }
        
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'quiz_attempted',
          description: `Attempted quiz: "${currentGeneratedQuiz.quizData.subject} - ${currentGeneratedQuiz.quizData.difficulty}". Score: ${score}/${currentGeneratedQuiz.questions.length}`,
          details: {
            quiz_id: insertedQuiz.id,
            score: score,
            total_questions: currentGeneratedQuiz.questions.length,
            subject: currentGeneratedQuiz.quizData.subject,
            difficulty: currentGeneratedQuiz.quizData.difficulty,
            chapter: currentGeneratedQuiz.quizData.topics ? currentGeneratedQuiz.quizData.topics[0] : null
          }
        };
        await supabase.from('activity_logs').insert(activityLog);
        
        // Award XP and Coins
        const xpEarned = score * 2; // Example: 2 XP per correct answer
        const coinsEarned = score * 5; // Example: 5 coins per correct answer
        await apiClient.addUserXP(xpEarned);
        const currentCoins = await apiClient.fetchUserFocusCoins();
        await apiClient.updateUserFocusCoins(currentCoins + coinsEarned);


        setQuizResults({
            score,
            totalQuestions: currentGeneratedQuiz.questions.length,
            attemptId,
            quizId: insertedQuiz.id,
            questionsWithUserAnswers
        });
        toast({
          title: 'Quiz Submitted!',
          description: `You scored ${score}/${currentGeneratedQuiz.questions.length}. Rewards: +${xpEarned} XP, +${coinsEarned} Coins! Review answers below.`,
          className: 'bg-accent/10 border-accent text-accent-foreground glow-text-accent',
        });

      } catch (error: any) {
        console.error("Error submitting quiz and saving to DB:", JSON.stringify(error, null, 2));
        toast({ variant: 'destructive', title: 'Error Submitting Quiz', description: error.message || 'An unexpected error occurred. Check console for details.' });
      }
    });
  }

  async function handleGetExplanation(question: Question, studentAnswerIndex: number | null) {
    startExplainingTransition(async () => {
      try {
        const studentAnswerText = studentAnswerIndex !== null && question.options ? (question.options as string[])[studentAnswerIndex] : "Not Answered";
        const correctAnswerText = question.options ? (question.options as string[])[question.correct_option_index] : "N/A";

        const input: ExplainQuizQuestionInput = {
          question: question.question_text,
          answer: correctAnswerText,
          studentAnswer: studentAnswerText,
          topic: question.topic || question.subject || 'general', // Use stored chapter as topic
        };

        const result = await explainQuizQuestion(input);
        setExplanations(prev => ({ ...prev, [question.id]: result.explanation }));
      } catch (error: any) {
        console.error("Error fetching explanation:", error);
        toast({ variant: 'destructive', title: 'Error Fetching Explanation', description: error.message || 'Could not load explanation.' });
        setExplanations(prev => ({...prev, [question.id]: "Sorry, couldn't fetch explanation."}))
      }
    });
  }

  async function handleSaveQuestion(question: Question) {
    if (!userId) return;
    startSavingQuestionTransition(async () => {
        try {
            const savedQuestionData: TablesInsert<'saved_questions'> = {
                user_id: userId,
                question_id: question.id, 
                question_text: question.question_text,
                options: question.options,
                correct_option_index: question.correct_option_index,
                explanation_prompt: question.explanation_prompt,
                class_level: question.class_level,
                subject: question.subject,
                topic: question.topic, // Chapter name
                source: question.source,
            };
            const { error } = await supabase.from('saved_questions').insert(savedQuestionData);
            if (error) {
              if (error.code === '23505') { 
                toast({ variant: 'default', title: "Question Already Saved", description: "This question is already in your saved list."});
              } else if (error.code === '23503') { 
                toast({ variant: 'destructive', title: "Error Saving Question", description: "Failed to save question. The original question might not have been saved to the database correctly. Please ensure quiz data is properly saved first."});
              }
              else {
                throw error;
              }
            } else {
               toast({ title: "Question Saved!", description: "You can find it in your 'Saved Questions' dashboard."});
                const activityLog: TablesInsert<'activity_logs'> = {
                  user_id: userId,
                  activity_type: 'question_saved',
                  description: `Saved question: "${question.question_text.substring(0,50)}..."`,
                  details: { question_id: question.id, subject: question.subject, chapter: question.topic }
                };
                await supabase.from('activity_logs').insert(activityLog);
            }
        } catch(error: any) {
            console.error("Error in handleSaveQuestion:", JSON.stringify(error, null, 2));
            toast({ variant: 'destructive', title: "Error Saving Question", description: error.message || "An unexpected error occurred."});
        }
    });
  }

  const handleCopyQuestionText = (questionText: string) => {
    navigator.clipboard.writeText(questionText);
    toast({ title: "Question Copied!", description: "Question text copied to clipboard." });
  };

  const renderQuizTaker = () => {
    if (!currentGeneratedQuiz) return null;
    const question = currentGeneratedQuiz.questions[currentQuestionIndex];
    const userAnswer = userAnswers.find(ans => ans.questionId === question.id);

    return (
      <Card className="w-full max-w-2xl mx-auto interactive-card shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-primary flex justify-between items-center">
            <span>{currentGeneratedQuiz.quizData.display_topic || currentGeneratedQuiz.quizData.subject} Quiz ({currentGeneratedQuiz.quizData.difficulty})</span>
            <span className="text-sm font-normal text-muted-foreground">Question {currentQuestionIndex + 1} of {currentGeneratedQuiz.questions.length}</span>
          </CardTitle>
          <Progress value={((currentQuestionIndex + 1) / currentGeneratedQuiz.questions.length) * 100} className="w-full h-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-start">
            <p className="text-lg font-semibold flex-1 pr-2">{question.question_text}</p>
            <Button variant="ghost" size="icon" onClick={() => handleCopyQuestionText(question.question_text)} className="text-muted-foreground hover:text-primary">
                <ClipboardCopy className="w-5 h-5"/>
            </Button>
          </div>
          <div className="space-y-3">
            {(question.options as string[]).map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary input-glow">
                <input
                  type="radio"
                  name={question.id} 
                  value={index.toString()}
                  id={`${question.id}-option-${index}`}
                  checked={userAnswer?.selectedOptionIndex === index}
                  onChange={() => handleAnswerChange(question.id, index)}
                  className="form-radio h-4 w-4 text-primary border-border focus:ring-primary cursor-pointer" 
                />
                <label htmlFor={`${question.id}-option-${index}`} className="font-normal text-base flex-1 cursor-pointer">
                  {String.fromCharCode(65 + index)}. {option}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0} className="glow-button">
            <ChevronLeft className="mr-2" /> Previous
          </Button>
          
          {currentQuestionIndex < currentGeneratedQuiz.questions.length - 1 ? (
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
    if (!quizResults || !currentGeneratedQuiz) return null;

    const percentage = quizResults.totalQuestions > 0 ? (quizResults.score / quizResults.totalQuestions) * 100 : 0;
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
            {quizResults.score} / {quizResults.totalQuestions} ({percentage.toFixed(0)}%)
          </p>
          <Progress value={percentage} className="w-full h-4 [&>div]:bg-gradient-to-r [&>div]:from-secondary [&>div]:to-accent" />
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-4 text-center">Review Your Answers:</h3>
          <Accordion type="single" collapsible className="w-full">
            {quizResults.questionsWithUserAnswers.map((q, index) => {
              const isCorrect = q.userAnswerIndex === q.correct_option_index;
              const explanation = explanations[q.id];
              const isExplanationLoading = isExplaining && explanations[q.id] === undefined;
              return (
                <AccordionItem value={q.id} key={q.id} className="border-b-border/30">
                  <AccordionTrigger className={`text-left hover:no-underline ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="flex items-center justify-between w-full">
                       <span>Question {index + 1}: {q.question_text.substring(0,50)}{q.question_text.length > 50 ? '...' : ''}</span>
                       {isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-3">
                    <p><strong>Your Answer:</strong> {q.userAnswerIndex !== null && q.userAnswerIndex !== undefined && q.options ? String.fromCharCode(65 + q.userAnswerIndex) + '. ' + (q.options as string[])[q.userAnswerIndex] : 'Not Answered'}</p>
                    <p className="text-green-400"><strong>Correct Answer:</strong> {q.options ? String.fromCharCode(65 + q.correct_option_index) + '. ' + (q.options as string[])[q.correct_option_index] : 'N/A'}</p>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleSaveQuestion(q)} disabled={isSavingQuestion} className="text-accent hover:text-accent/80">
                            {isSavingQuestion ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-1"/>} Save Question
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCopyQuestionText(q.question_text)} className="text-accent hover:text-accent/80">
                            <ClipboardCopy className="w-4 h-4 mr-1"/> Copy Question
                        </Button>
                        {explanation ? (
                        <Alert variant="default" className="bg-card-foreground/5 border-accent/30 w-full mt-2">
                            <Lightbulb className="h-5 w-5 text-accent" />
                            <AlertTitle className="text-accent">AI Explanation</AlertTitle>
                            <AlertDescription className="text-sm whitespace-pre-wrap">{explanation}</AlertDescription>
                        </Alert>
                        ) : (
                        question.explanation_prompt && // Only show if prompt exists
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGetExplanation(q, q.userAnswerIndex)}
                            disabled={isExplanationLoading}
                            className="glow-button border-accent text-accent hover:bg-accent/10 hover:text-accent"
                        >
                            {isExplanationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HelpCircle className="mr-2 h-4 w-4" />}
                            Get AI Explanation
                        </Button>
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
        <CardFooter className="flex justify-center">
           <Button onClick={() => { setCurrentGeneratedQuiz(null); setQuizResults(null); configForm.reset({ difficulty: 'medium', numQuestions: 5, chapter: '', topic: ''}); }} className="glow-button">
            <RotateCcw className="mr-2"/> Take Another Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  };


  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Target className="mr-4 h-10 w-10" /> Customizable Quiz Arena
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Forge your knowledge! Configure a quiz, test your skills, and get AI-powered insights.
        </p>
      </header>

      {!currentGeneratedQuiz && !quizResults && (
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
                <FormField control={configForm.control} name="subject" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="h-11 text-base input-glow"><SelectValue placeholder="Select subject..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {availableSubjects.map(subj => <SelectItem key={subj} value={subj}>{subj}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={configForm.control} name="class_level" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Class</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedSubject}>
                            <FormControl><SelectTrigger className="h-11 text-base input-glow"><SelectValue placeholder="Select class..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="11">Class 11</SelectItem>
                                <SelectItem value="12">Class 12</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={configForm.control} name="chapter" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Chapter (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedClass || !selectedSubject || availableChapters.length === 0}>
                        <FormControl><SelectTrigger className="h-11 text-base input-glow"><SelectValue placeholder="Select chapter..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availableChapters.map(chap => <SelectItem key={chap} value={chap}>{chap}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />
                {/* Topic field is removed as it's not present in the new syllabus structure */}
                <FormField control={configForm.control} name="question_source" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Question Source (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="h-11 text-base input-glow"><SelectValue placeholder="Select source..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="NCERT">NCERT-based</SelectItem>
                                <SelectItem value="PYQ">PYQ (Previous Year Questions)</SelectItem>
                                <SelectItem value="Mixed">Mixed/Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={configForm.control} name="difficulty" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-11 text-base input-glow"><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                       <FormMessage />
                    </FormItem>
                )} />
                <FormField control={configForm.control} name="numQuestions" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Number of Questions (1-50)</FormLabel>
                      <FormControl><Input type="number" min="1" max="50" {...field} className="h-11 text-base input-glow"/></FormControl>
                       <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isGenerating || !configForm.formState.isValid}>
                  {isGenerating ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Wand2 className="mr-2 h-6 w-6" />}
                  Generate Quiz
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {(isGenerating && !currentGeneratedQuiz) && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Generating your custom quiz... this might take a moment.</p>
        </div>
      )}

      {currentGeneratedQuiz && !quizResults && renderQuizTaker()}
      {quizResults && renderResults()}

    </div>
  );
}

    