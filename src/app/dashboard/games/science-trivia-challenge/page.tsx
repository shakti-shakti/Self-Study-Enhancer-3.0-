// src/app/dashboard/games/science-trivia-challenge/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BrainCircuit, Check, X, RotateCcw, Loader2, Trophy, Lightbulb } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import * as apiClient from '@/lib/apiClient';

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'General';
  explanation?: string;
}

const sampleQuestions: TriviaQuestion[] = [
  { id: 'phy001', question: 'What is the SI unit of force?', options: ['Watt', 'Joule', 'Newton', 'Pascal'], correctAnswerIndex: 2, subject: 'Physics', explanation: "Force is measured in Newtons (N) in the SI system, named after Sir Isaac Newton." },
  { id: 'chem001', question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'O2', 'NaCl'], correctAnswerIndex: 0, subject: 'Chemistry', explanation: "Water is a compound made of two hydrogen atoms and one oxygen atom, hence H2O." },
  { id: 'bio001', question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Apparatus'], correctAnswerIndex: 2, subject: 'Biology', explanation: "Mitochondria are responsible for generating most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy." },
  { id: 'gen001', question: 'Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correctAnswerIndex: 1, subject: 'General', explanation: "Mars is often called the Red Planet because of its reddish appearance, due to iron oxide (rust) on its surface." },
  { id: 'phy002', question: 'What type of energy is stored in a battery?', options: ['Kinetic', 'Potential', 'Chemical', 'Mechanical'], correctAnswerIndex: 2, subject: 'Physics', explanation: "Batteries store chemical energy, which can be converted into electrical energy." },
  { id: 'chem002', question: 'Which of these is a noble gas?', options: ['Oxygen', 'Nitrogen', 'Helium', 'Carbon'], correctAnswerIndex: 2, subject: 'Chemistry', explanation: "Helium (He) is a noble gas, characterized by its full valence electron shell, making it very unreactive." },
  { id: 'bio002', question: 'What part of the plant conducts photosynthesis?', options: ['Roots', 'Stem', 'Leaves', 'Flower'], correctAnswerIndex: 2, subject: 'Biology', explanation: "Photosynthesis primarily occurs in the leaves, which contain chloroplasts, the site of this process." },
  { id: 'gen002', question: 'What is the hardest known natural substance?', options: ['Gold', 'Iron', 'Quartz', 'Diamond'], correctAnswerIndex: 3, subject: 'General', explanation: "Diamond is the hardest known natural substance, rated 10 on the Mohs scale of hardness." },
];

const QUESTIONS_PER_GAME = 5;

export default function ScienceTriviaChallengePage() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isProcessing, startTransition] = useTransition();

  const { toast } = useToast();

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const startNewGame = () => {
    startTransition(() => {
      const shuffledQuestions = shuffleArray([...sampleQuestions]).slice(0, QUESTIONS_PER_GAME);
      setQuestions(shuffledQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setIsAnswerSubmitted(false);
      setGameOver(false);
    });
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !questions[currentQuestionIndex]) return;
    startTransition(() => {
      setIsAnswerSubmitted(true);
      if (selectedAnswer === questions[currentQuestionIndex].correctAnswerIndex) {
        setScore(prev => prev + 1);
        toast({title: "Correct!", description: "Great job!", className: "bg-green-500/20 text-green-300"});
      } else {
        toast({variant: "destructive", title: "Incorrect", description: `The correct answer was: ${questions[currentQuestionIndex].options[questions[currentQuestionIndex].correctAnswerIndex]}`});
      }
    });
  };

  const handleNextQuestion = () => {
    startTransition(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
      } else {
        setGameOver(true);
        // Conceptual: Award Focus Coins based on score
        const coinsEarned = score * 5; // Example: 5 coins per correct answer
        apiClient.updateUserFocusCoins(currentCoins => (currentCoins || 0) + coinsEarned);
        toast({title: "Game Over!", description: `You scored ${score}/${questions.length}. You earned ${coinsEarned} Focus Coins (Demo)!`, className: "bg-primary/20 text-primary-foreground"});
      }
    });
  };

  if (questions.length === 0 && !isProcessing) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Button onClick={startNewGame}>Start Trivia</Button></div>;
  }
  if (isProcessing && questions.length === 0) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }


  const currentQuestion = questions[currentQuestionIndex];

  if (gameOver) {
    return (
      <div className="flex flex-col items-center space-y-6">
        <Card className="w-full max-w-lg interactive-card shadow-xl text-center">
          <CardHeader>
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-3xl font-headline glow-text-primary">Trivia Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">Your final score: {score} / {questions.length}</p>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button onClick={startNewGame} className="w-full glow-button text-lg">
              <RotateCcw className="mr-2"/> Play Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!currentQuestion) {
     return <div className="flex justify-center items-center min-h-[60vh]"><p>Loading question or game ended unexpectedly.</p><Button onClick={startNewGame}>Restart</Button></div>;
  }


  return (
    <div className="space-y-8 flex flex-col items-center">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <BrainCircuit className="mr-3 h-10 w-10 text-primary" /> Science Trivia Challenge
        </h1>
        <p className="text-lg text-muted-foreground">
          Test your knowledge! Question {currentQuestionIndex + 1} of {questions.length}. Score: {score}
        </p>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full max-w-md mx-auto mt-2 h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"/>
      </header>

      <Card className="w-full max-w-2xl interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center glow-text-accent">{currentQuestion.subject} Trivia</CardTitle>
          <CardDescription className="text-lg text-center min-h-[3em]">{currentQuestion.question}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={`w-full justify-start text-left h-auto py-3 text-base input-glow 
                ${isAnswerSubmitted && index === currentQuestion.correctAnswerIndex ? 'bg-green-500/20 border-green-500 hover:bg-green-500/30' : ''}
                ${isAnswerSubmitted && selectedAnswer === index && index !== currentQuestion.correctAnswerIndex ? 'bg-red-500/20 border-red-500 hover:bg-red-500/30' : ''}
                ${!isAnswerSubmitted && selectedAnswer === index ? 'bg-primary/20 border-primary' : ''}
              `}
              onClick={() => !isAnswerSubmitted && setSelectedAnswer(index)}
              disabled={isAnswerSubmitted || isProcessing}
            >
              {isAnswerSubmitted && index === currentQuestion.correctAnswerIndex && <Check className="mr-2 text-green-500"/>}
              {isAnswerSubmitted && selectedAnswer === index && index !== currentQuestion.correctAnswerIndex && <X className="mr-2 text-red-500"/>}
              {option}
            </Button>
          ))}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          {!isAnswerSubmitted ? (
            <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null || isProcessing} className="w-full glow-button text-lg">
              {isProcessing ? <Loader2 className="animate-spin"/> : "Submit Answer"}
            </Button>
          ) : (
            <>
            {currentQuestion.explanation && (
                <Alert className="bg-card/50 border-border/30">
                    <Lightbulb className="h-5 w-5 text-accent"/>
                    <AlertTitle className="text-accent">Explanation</AlertTitle>
                    <AlertDescription>{currentQuestion.explanation}</AlertDescription>
                </Alert>
            )}
            <Button onClick={handleNextQuestion} className="w-full glow-button text-lg">
              {isProcessing ? <Loader2 className="animate-spin"/> : (currentQuestionIndex < questions.length - 1 ? "Next Question" : "Show Results")}
            </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
