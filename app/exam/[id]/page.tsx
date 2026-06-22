import { notFound, redirect } from "next/navigation";

import { ExamRunner } from "@/components/exam/exam-runner";
import { getExamById, getQuestionsForExam } from "@/lib/exams";
import { getSession } from "@/lib/get-session";

type ExamPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExamPage({ params }: ExamPageProps) {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (session.role === "admin") redirect("/admin/dashboard");

  const { id } = await params;
  const examId = Number(id);
  const exam = getExamById(examId);

  if (!exam || !exam.isActive) {
    notFound();
  }

  const questions = getQuestionsForExam(examId);

  return (
    <ExamRunner
      exam={exam}
      questions={questions}
      fullName={session.fullName}
      username={session.username}
    />
  );
}
