export type UserRole = "teacher" | "student";

export type BoardPermission =
  | "none"
  | "draw"
  | "type"
  | "draw_and_type";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  permission: BoardPermission;
}

export interface Classroom {
  id: string;
  name: string;
  teacher: User;
  students: User[];
}