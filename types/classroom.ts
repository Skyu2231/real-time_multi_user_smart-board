export type UserRole = "teacher" | "student";

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Classroom {
  id: string;
  name: string;
  teacher: User;
  students: User[];
}