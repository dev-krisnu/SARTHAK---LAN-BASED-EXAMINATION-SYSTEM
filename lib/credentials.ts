export type UserRole = "admin" | "student";

export type CredentialUser = {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
};

export const ADMIN_CREDENTIALS: CredentialUser = {
  username: "admin",
  password: "admin123",
  fullName: "System Administrator",
  role: "admin",
};

export const USER_CREDENTIALS: CredentialUser[] = [
  {
    username: "krrishjeswar01@gmail.com",
    password: "krrish2006",
    fullName: "Krrish Jeswar",
    role: "student",
  },
  {
    username: "komalshaw5577@gmail.com",
    password: "komal2007",
    fullName: "Komal Shaw",
    role: "student",
  },
  {
    username: "manishkumarchowdhury45@gmail.com",
    password: "manish2004",
    fullName: "Manish Kumar Chowdhury",
    role: "student",
  },
  {
    username: "bikramghosh69@gmail.com",
    password: "bikram2005",
    fullName: "Bikram Ghosh",
    role: "student",
  },
];

const registeredUsers: CredentialUser[] = [];

export function registerUser(user: CredentialUser): { ok: true } | { ok: false; message: string } {
  const allUsers = [ADMIN_CREDENTIALS, ...USER_CREDENTIALS, ...registeredUsers];
  if (allUsers.some((u) => u.username.toLowerCase() === user.username.toLowerCase())) {
    return { ok: false, message: "Username already exists. Please choose another." };
  }
  if (user.password.length < 5) {
    return { ok: false, message: "Password must be at least 5 characters." };
  }
  registeredUsers.push(user);
  return { ok: true };
}

export function validateCredentials(
  username: string,
  password: string
): CredentialUser | null {
  const allUsers = [ADMIN_CREDENTIALS, ...USER_CREDENTIALS, ...registeredUsers];
  return (
    allUsers.find(
      (user) =>
        user.username.toLowerCase() === username.trim().toLowerCase() &&
        user.password === password
    ) ?? null
  );
}
