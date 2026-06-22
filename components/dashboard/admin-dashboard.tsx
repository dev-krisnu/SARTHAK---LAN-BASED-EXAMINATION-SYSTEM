import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EXAMS } from "@/lib/exams";
import { USER_CREDENTIALS } from "@/lib/credentials";

type AdminDashboardProps = {
  fullName: string;
  username: string;
};

export function AdminDashboard({ fullName, username }: AdminDashboardProps) {
  const activeExams = EXAMS.filter((exam) => exam.isActive).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader
        fullName={fullName}
        username={username}
        role="admin"
        title="Admin Dashboard"
      />
      <main className="mx-auto max-w-6xl space-y-6 p-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total exams</CardDescription>
              <CardTitle className="text-3xl">{EXAMS.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active exams</CardDescription>
              <CardTitle className="text-3xl">{activeExams}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Students</CardDescription>
              <CardTitle className="text-3xl">{USER_CREDENTIALS.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Submissions</CardDescription>
              <CardTitle className="text-3xl">—</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="exams">
          <TabsList>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          <TabsContent value="exams" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Exam management</CardTitle>
                <CardDescription>
                  Overview of all exams in the LAN Exam System.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {EXAMS.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>{exam.subject}</TableCell>
                        <TableCell>{exam.durationMinutes} min</TableCell>
                        <TableCell>{exam.totalMarks}</TableCell>
                        <TableCell>
                          <Badge variant={exam.isActive ? "default" : "secondary"}>
                            {exam.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Registered students</CardTitle>
                <CardDescription>
                  Hardcoded student accounts from middleware credentials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {USER_CREDENTIALS.map((user) => (
                      <TableRow key={user.username}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline">student</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
