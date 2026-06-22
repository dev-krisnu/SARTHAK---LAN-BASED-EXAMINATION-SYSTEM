"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/app-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { Exam, Question } from "@/lib/exams";
import { gradeExam } from "@/lib/exams";

type ExamRunnerProps = {
  exam: Exam;
  questions: Question[];
  fullName: string;
  username: string;
};

type ResultSummary = {
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ExamRunner({
  exam,
  questions,
  fullName,
  username,
}: ExamRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [secondsLeft, setSecondsLeft] = useState(exam.durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ResultSummary | null>(null);

  const currentQuestion = questions[currentIndex];
  const progressValue =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  useEffect(() => {
    if (submitted) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (secondsLeft === 0 && !submitted) {
      handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, submitted]);

  function handleAnswer(value: string) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value as "A" | "B" | "C" | "D",
    }));
  }

  function handleSubmit(auto = false) {
    const summary = gradeExam(exam.id, answers);
    setResult(summary);
    setSubmitted(true);
    if (auto) {
      toast.message("Time is up. Your exam was submitted automatically.");
    } else {
      toast.success("Exam submitted successfully.");
    }
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30">
        <AppHeader
          fullName={fullName}
          username={username}
          role="student"
          title={exam.title}
        />
        <main className="mx-auto max-w-3xl p-4 py-8">
          <Alert>
            <AlertTitle>No questions available</AlertTitle>
            <AlertDescription>
              This exam does not have sample questions configured yet.
            </AlertDescription>
          </Alert>
          <Link href="/dashboard" className={cn(buttonVariants(), "mt-4")}>
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-muted/30">
        <AppHeader
          fullName={fullName}
          username={username}
          role="student"
          title="Exam result"
        />
        <main className="mx-auto max-w-2xl space-y-6 p-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>{exam.title}</CardTitle>
              <CardDescription>Your result is ready.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-semibold">
                  {result.score}/{result.totalMarks}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-2xl font-semibold">{result.percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="text-2xl font-semibold">{result.grade}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard" className={cn(buttonVariants())}>
                Back to dashboard
              </Link>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader
        fullName={fullName}
        username={username}
        role="student"
        title={exam.title}
      />
      <main className="mx-auto max-w-4xl space-y-6 p-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{exam.subject}</p>
            <h2 className="text-xl font-semibold">Question {currentIndex + 1} of {questions.length}</h2>
          </div>
          <Badge variant={secondsLeft < 60 ? "destructive" : "secondary"} className="gap-1.5 px-3 py-1">
            <Clock3 className="size-4" />
            {formatTime(secondsLeft)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{answeredCount}/{questions.length} answered</span>
          </div>
          <Progress value={progressValue} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base leading-relaxed">
              {currentQuestion.text}
            </CardTitle>
            <CardDescription>{currentQuestion.marks} mark(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] ?? ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <RadioGroupItem value={option.key} id={`${currentQuestion.id}-${option.key}`} />
                  <Label htmlFor={`${currentQuestion.id}-${option.key}`} className="flex-1 cursor-pointer">
                    <span className="mr-2 font-medium">{option.key}.</span>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((index) => index - 1)}
            >
              <ArrowLeft />
              Previous
            </Button>
            <div className="flex flex-wrap gap-2">
              {currentIndex < questions.length - 1 ? (
                <Button onClick={() => setCurrentIndex((index) => index + 1)}>
                  Next
                  <ArrowRight />
                </Button>
              ) : (
                <Button onClick={() => handleSubmit(false)}>Submit exam</Button>
              )}
            </div>
          </CardFooter>
        </Card>

        <Separator />

        <div className="flex flex-wrap gap-2">
          {questions.map((question, index) => (
            <Button
              key={question.id}
              size="sm"
              variant={index === currentIndex ? "default" : answers[question.id] ? "secondary" : "outline"}
              onClick={() => setCurrentIndex(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </main>
    </div>
  );
}
