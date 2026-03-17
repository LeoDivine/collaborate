import { User } from "../../generated/prisma/client";

export type ExtendedUser = Pick<User, "fullName" | "email" | "id" | "userName">;
