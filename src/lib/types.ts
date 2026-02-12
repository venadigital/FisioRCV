export type AppRole = "admin" | "therapist" | "patient";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export type BodyPart =
  | "neck"
  | "upper_back"
  | "lower_back"
  | "shoulder"
  | "knee"
  | "other";

export type PainTrigger =
  | "exercise"
  | "sitting"
  | "sport"
  | "lifting"
  | "sleep"
  | "stress"
  | "other";

export type ExerciseDifficulty = "easy" | "medium" | "hard";

export type UserContext = {
  userId: string;
  role: AppRole;
  clinicId: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
};

export type NavItem = {
  href: string;
  label: string;
  icon?: string;
};
