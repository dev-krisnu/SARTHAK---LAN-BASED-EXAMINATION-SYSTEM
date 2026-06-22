import Link from "next/link";
import { BookOpen, Clock3 } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getActiveExams } from "@/lib/exams";

type StudentDashboardProps = {
  fullName: string;
  username: string;
};

export function StudentDashboard({ fullName, username }: StudentDashboardProps) {
  const exams = getActiveExams();

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader
        fullName={fullName}
        username={username}
        role="student"
        title="Student Dashboard"
      />
      <main className="mx-auto max-w-6xl space-y-6 p-4 py-8">
        <div className="flex w-full justify-between mb-16">
          <CardHeader className="w-auto grow">
            <CardDescription>Welcome back</CardDescription>
            <CardTitle className="text-3xl font-semibold tracking-tight">{fullName}</CardTitle>
            <CardDescription className="text-md text-slate-600">To Sarthak LAN Exam Portal</CardDescription>
          </CardHeader>
            <Card className="w-sm shadow-xl shadow-slate-200 text-primary">
              <CardHeader className="relative">
                <CardDescription>Assigned exams</CardDescription>
                <CardTitle className="absolute top-0 m-0 right-0 text-8xl">{exams.length}</CardTitle>
              </CardHeader>
            </Card>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Active exams</h2>
            <p className="text-sm text-muted-foreground">
              Select an exam to begin. The timer starts when you open it.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>{exam.subject}</CardDescription>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-4" />
                      {exam.durationMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="size-4" />
                      {exam.questionCount} questions · {exam.totalMarks} marks
                    </span>
                  </div>
                  <Link
                    href={`/exam/${exam.id}`}
                    className={cn(buttonVariants())}
                  >
                    Start exam
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
