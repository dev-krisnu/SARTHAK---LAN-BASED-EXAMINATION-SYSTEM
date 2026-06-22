"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppHeaderProps = {
  fullName: string;
  username: string;
  role: "admin" | "student";
  title: string;
};

export function AppHeader({ fullName, username, role, title }: AppHeaderProps) {
  const router = useRouter();
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  }

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            LAN Exam System
          </p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="size-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                {/* <span className="hidden text-sm sm:inline">{fullName}</span> */}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{fullName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {username} · {role}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
