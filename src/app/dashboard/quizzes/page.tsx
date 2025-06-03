
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

const syllabusData: Record<string, Record<string, Record<string, string[]>>> = {
  "Physics": {
    "Class 11": {
      "Physical World and Measurement": [
        "Units of measurements",
        "System of Units (CGS, MKS, SI)",
        "Fundamental and derived units",
        "Least count",
        "Significant figures",
        "Errors in measurement",
        "Dimensions of physical quantities",
        "Dimensional analysis and its applications"
      ],
      "Kinematics": [
        "Frame of reference",
        "Motion in a straight line",
        "Position-time graph",
        "Speed and velocity",
        "Uniform and non-uniform motion",
        "Average speed and instantaneous velocity",
        "Uniformly accelerated motion",
        "Velocity-time and position-time graphs",
        "Scalars and Vectors",
        "Vector addition and subtraction",
        "Scalar and vector products",
        "Unit vector, resolution of a vector",
        "Relative velocity",
        "Motion in a plane",
        "Projectile motion",
        "Uniform circular motion"
      ],
      "Laws of Motion": [
        "Force and inertia",
        "Newton's First, Second, and Third laws of motion",
        "Law of conservation of momentum",
        "Equilibrium of concurrent forces",
        "Static and kinetic friction",
        "Laws of friction, rolling friction",
        "Dynamics of uniform circular motion",
        "Centripetal force",
        "Applications: vehicle on level and banked roads"
      ],
      "Work, Energy and Power": [
        "Work done by a constant and variable force",
        "Kinetic and potential energies",
        "Work-energy theorem",
        "Power",
        "Potential energy of spring",
        "Conservation of mechanical energy",
        "Conservative and non-conservative forces",
        "Motion in a vertical circle",
        "Elastic and inelastic collisions in one and two dimensions"
      ],
      "Motion of System of Particles and Rigid Body": [
        "Centre of mass (two-particle system and rigid body)",
        "Torque",
        "Angular momentum",
        "Conservation of angular momentum",
        "Moment of inertia and radius of gyration",
        "Theorems of moment of inertia",
        "Equilibrium of rigid bodies",
        "Rotational motion",
        "Comparison of linear and rotational motion"
      ],
      "Gravitation": [
        "Newton's law of gravitation",
        "Acceleration due to gravity",
        "Variation with height and depth",
        "Kepler's laws",
        "Gravitational potential energy and potential",
        "Escape velocity",
        "Orbital velocity",
        "Energy and time period of satellite motion"
      ],
      "Properties of Bulk Matter": [
        "Elastic behavior and stress-strain",
        "Hooke's law",
        "Young's modulus, bulk modulus, rigidity",
        "Pressure in fluid column",
        "Pascal's law and applications",
        "Effect of gravity on pressure",
        "Viscosity and Stokes' law",
        "Terminal velocity",
        "Streamline and turbulent flow",
        "Critical velocity",
        "Bernoulli's principle and applications",
        "Surface energy and tension",
        "Angle of contact",
        "Excess pressure across curved surfaces",
        "Capillarity and its applications",
        "Thermal properties: expansion, calorimetry, latent heat",
        "Heat transfer: conduction, convection, radiation"
      ],
      "Thermodynamics": [
        "Thermal equilibrium",
        "Zeroth law of thermodynamics",
        "Concept of temperature",
        "Heat, work, and internal energy",
        "First law of thermodynamics",
        "Isothermal and adiabatic processes",
        "Second law of thermodynamics",
        "Reversible and irreversible processes"
      ],
      "Behaviour of Perfect Gas and Kinetic Theory": [
        "Equation of state of ideal gas",
        "Work done on compressing a gas",
        "Assumptions of kinetic theory",
        "Concept of pressure",
        "RMS speed of gas molecules",
        "Degrees of freedom",
        "Law of equipartition of energy",
        "Specific heat capacities",
        "Mean free path",
        "Avogadro's number"
      ],
      "Oscillations and Waves": [
        "Oscillations and periodic motion",
        "SHM: time period, frequency, displacement",
        "Energy in SHM",
        "Oscillations of spring",
        "Simple pendulum and its time period",
        "Wave motion: longitudinal and transverse",
        "Speed of wave propagation",
        "Displacement relation",
        "Superposition principle",
        "Reflection of waves",
        "Standing waves in strings and pipes",
        "Beats and resonance"
      ]
    },
    "Class 12": {
      "Electrostatics": [
        "Electric charges and conservation",
        "Coulomb's law",
        "Superposition principle",
        "Electric field, field lines",
        "Electric dipole",
        "Torque on dipole",
        "Electric flux",
        "Gauss's law and its applications",
        "Electric potential and potential energy",
        "Equipotential surfaces",
        "Capacitance, capacitors",
        "Energy stored in capacitors",
        "Dielectrics and polarization"
      ],
      "Current Electricity": [
        "Electric current, drift velocity",
        "Ohm's law",
        "V-I characteristics (Ohmic/non-Ohmic)",
        "Electrical energy and power",
        "Resistivity and conductivity",
        "Series and parallel resistors",
        "Internal resistance and EMF",
        "Kirchhoff's laws",
        "Wheatstone bridge and meter bridge"
      ],
      "Magnetic Effects of Current and Magnetism": [
        "Biot-Savart law",
        "Ampere's circuital law",
        "Magnetic force on moving charge",
        "Force on current-carrying conductor",
        "Torque on current loop",
        "Magnetic field of solenoid",
        "Galvanometer, ammeter, voltmeter",
        "Magnetic dipole and field lines",
        "Bar magnet and magnetic moment",
        "Magnetic materials: para-, dia-, ferromagnetic",
        "Hysteresis",
        "Earth's magnetic field"
      ],
      "Electromagnetic Induction and AC": [
        "Faraday's laws",
        "Lenz's law",
        "Eddy currents",
        "Self and mutual induction",
        "Alternating current and peak/RMS values",
        "Reactance and impedance",
        "LCR circuits",
        "Resonance",
        "Transformer and AC generator"
      ],
      "Electromagnetic Waves": [
        "Displacement current",
        "Maxwell's equations (qualitative)",
        "Properties of EM waves",
        "Electromagnetic spectrum",
        "Applications: radio, microwave, IR, UV, X-ray, gamma"
      ],
      "Optics": [
        "Reflection and refraction",
        "Mirrors and lenses",
        "Total internal reflection",
        "Lens/mirror formula",
        "Power of a lens",
        "Microscopes and telescopes",
        "Wavefront and Huygens principle",
        "Interference (Young's experiment)",
        "Diffraction and polarization"
      ],
      "Dual Nature of Matter and Radiation": [
        "Photoelectric effect",
        "Einstein's equation",
        "Particle nature of light",
        "de Broglie hypothesis"
      ],
      "Atoms and Nuclei": [
        "Rutherford and Bohr models",
        "Hydrogen spectrum",
        "Composition of nucleus",
        "Binding energy and mass defect",
        "Radioactivity (alpha, beta, gamma)",
        "Decay laws",
        "Fission and fusion"
      ],
      "Electronic Devices": [
        "Semiconductors",
        "Diode and I-V characteristics",
        "Zener diode and regulation",
        "LED, solar cell, photodiode",
        "Logic gates (AND, OR, NOT, NAND, NOR)"
      ],
      "Experimental Skills": [
        "Vernier calipers and screw gauge",
        "Young's modulus",
        "Surface tension and viscosity",
        "Calorimetry",
        "Meter bridge, galvanometer",
        "Optical instruments and diode tests"
      ]
    }
  },
  "Chemistry": {
    "Class 11": {
      "Some Basic Concepts of Chemistry": ["Some Basic Concepts of Chemistry"],
      "Structure of Atom": ["Structure of Atom"],
      "Classification of Elements and Periodicity in Properties": ["Classification of Elements and Periodicity in Properties"],
      "Chemical Bonding and Molecular Structure": ["Chemical Bonding and Molecular Structure"],
      "States of Matter: Gases and Liquids": ["States of Matter"],
      "Thermodynamics": ["Thermodynamics"],
      "Equilibrium": ["Equilibrium"],
      "Redox Reactions": ["Redox Reactions"],
      "Hydrogen": ["Hydrogen"],
      "s-Block Element (Alkali and Alkaline earth metals)": ["The s-Block Elements"],
      "Some p-Block Elements": ["Some p-Block Elements"],
      "Organic Chemistry - Some Basic Principles and Techniques": ["Organic Chemistry - Some Basic Principles and Techniques"],
      "Hydrocarbons": ["Hydrocarbons"],
      "Environmental Chemistry": ["Environmental Chemistry"]
    },
    "Class 12": {
      "Solid State": ["Solid State"],
      "Solutions": ["Solutions"],
      "Electrochemistry": ["Electrochemistry"],
      "Chemical Kinetics": ["Chemical Kinetics"],
      "Surface Chemistry": ["Surface Chemistry"],
      "General Principles and Processes of Isolation of Elements": ["General Principles and Processes of Isolation of Elements"],
      "p-Block Element": ["The p-Block Elements (Group 15, 16, 17, 18)"],
      "d and f Block Elements": ["The d-and f-Block Elements"],
      "Coordination Compounds": ["Coordination Compounds"],
      "Haloalkanes and Haloarenes": ["Haloalkanes and Haloarenes"],
      "Alcohols, Phenols and Ethers": ["Alcohols, Phenols and Ethers"],
      "Aldehydes, Ketones and Carboxylic Acids": ["Aldehydes, Ketones and Carboxylic Acids"],
      "Organic Compounds Containing Nitrogen": ["Amines"],
      "Biomolecules": ["Biomolecules"],
      "Polymers": ["Polymers"],
      "Chemistry in Everyday Life": ["Chemistry in Everyday Life"]
    }
  },
  "Biology": {
    "Class 11": {
      "Diversity in Living World": ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom"],
      "Structural Organisation in Animals and Plants": ["Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals"],
      "Cell Structure and Function": ["Cell: The Unit of Life", "Biomolecules", "Cell Cycle and Cell Division"],
      "Plant Physiology": ["Transport in Plants", "Mineral Nutrition", "Photosynthesis in Higher Plants", "Respiration in Plants", "Plant Growth and Development"],
      "Human Physiology": ["Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products and their Elimination", "Locomotion and Movement", "Neural Control and Coordination", "Chemical Coordination and Integration"]
    },
    "Class 12": {
      "Reproduction": ["Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health"],
      "Genetics and Evolution": ["Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution"],
      "Biology and Human Welfare": ["Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare"],
      "Biotechnology and Its Applications": ["Biotechnology : Principles and Processes", "Biotechnology and its Applications"],
      "Ecology and Environment": ["Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"]
    }
  }
};


const quizConfigSchema = z.object({
  class_level: z.enum(['11', '12'], { required_error: 'Please select a class.' }),
  subject: z.enum(['Physics', 'Chemistry', 'Biology'], { required_error: 'Please select a subject.' }),
  chapter: z.string().optional(),
  topic: z.string().optional(), // Specific topic within a chapter (will remain empty as per current syllabusData)
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
    configForm.setValue('chapter', ''); 
  }, [selectedClass, selectedSubject, configForm]);


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
          topicForAI += ` - ${values.chapter}`; 
        }
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
            topic: values.chapter || null, 
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
            topic: q.topic, 
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
        
        const xpEarned = score * 2; 
        const coinsEarned = score * 5; 
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
          topic: question.topic || question.subject || 'general', 
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
                topic: question.topic, 
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
                        question.explanation_prompt && 
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

    