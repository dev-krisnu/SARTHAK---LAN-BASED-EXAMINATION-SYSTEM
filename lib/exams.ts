export type Exam = {
  id: number;
  title: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  isActive: boolean;
  questionCount: number;
};

export type Question = {
  id: number;
  examId: number;
  text: string;
  options: { key: "A" | "B" | "C" | "D"; label: string }[];
  correctOption: "A" | "B" | "C" | "D";
  marks: number;
};

export const EXAMS: Exam[] = [
  {
    id: 1,
    title: "C Programming Exam",
    subject: "C Programming",
    durationMinutes: 20,
    totalMarks: 15,
    isActive: true,
    questionCount: 20,
  },
  {
    id: 2,
    title: "Data Structures Exam",
    subject: "Data Structures",
    durationMinutes: 20,
    totalMarks: 15,
    isActive: true,
    questionCount: 20,
  },
  {
    id: 3,
    title: "OOP Using Java Exam",
    subject: "OOP Using Java",
    durationMinutes: 20,
    totalMarks: 15,
    isActive: true,
    questionCount: 20,
  },
  {
    id: 4,
    title: "Computer Networks Exam",
    subject: "Computer Networks",
    durationMinutes: 20,
    totalMarks: 15,
    isActive: true,
    questionCount: 20,
  },
  {
    id: 5,
    title: "Introduction To DBMS Exam",
    subject: "Introduction To DBMS",
    durationMinutes: 20,
    totalMarks: 15,
    isActive: true,
    questionCount: 20,
  },
  {
    id: 6,
    title: "Python Programming Exam",
    subject: "Python Programming",
    durationMinutes: 20,
    totalMarks: 15,
    isActive: false,
    questionCount: 20,
  },
];

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    examId: 1,
    text: "Which keyword is used to define a constant in C?",
    options: [
      { key: "A", label: "const" },
      { key: "B", label: "#define" },
      { key: "C", label: "static" },
      { key: "D", label: "final" },
    ],
    correctOption: "B",
    marks: 1,
  },
  {
    id: 2,
    examId: 1,
    text: "What is the size of an int on most 32-bit systems?",
    options: [
      { key: "A", label: "2 bytes" },
      { key: "B", label: "4 bytes" },
      { key: "C", label: "8 bytes" },
      { key: "D", label: "1 byte" },
    ],
    correctOption: "B",
    marks: 1,
  },
  {
    id: 3,
    examId: 1,
    text: "Which header file is required for printf()?",
    options: [
      { key: "A", label: "conio.h" },
      { key: "B", label: "stdlib.h" },
      { key: "C", label: "stdio.h" },
      { key: "D", label: "math.h" },
    ],
    correctOption: "C",
    marks: 1,
  },
  {
    id: 4,
    examId: 1,
    text: "What does the 'continue' statement do in a loop?",
    options: [
      { key: "A", label: "Exits the loop" },
      { key: "B", label: "Skips the current iteration" },
      { key: "C", label: "Restarts the program" },
      { key: "D", label: "Pauses execution" },
    ],
    correctOption: "B",
    marks: 1,
  },
  {
    id: 5,
    examId: 1,
    text: "Which operator is used to access members of a structure via a pointer?",
    options: [
      { key: "A", label: "." },
      { key: "B", label: "->" },
      { key: "C", label: "&" },
      { key: "D", label: "*" },
    ],
    correctOption: "B",
    marks: 1,
  },
];

export function getActiveExams(): Exam[] {
  return EXAMS.filter((exam) => exam.isActive);
}

export function getExamById(id: number): Exam | undefined {
  return EXAMS.find((exam) => exam.id === id);
}

export function getQuestionsForExam(examId: number): Question[] {
  return SAMPLE_QUESTIONS.filter((q) => q.examId === examId);
}

export function gradeExam(
  examId: number,
  answers: Record<number, "A" | "B" | "C" | "D" | undefined>
) {
  const questions = getQuestionsForExam(examId);
  let score = 0;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  for (const question of questions) {
    if (answers[question.id] === question.correctOption) {
      score += question.marks;
    }
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 50) grade = "D";

  return { score, totalMarks, percentage, grade };
}
