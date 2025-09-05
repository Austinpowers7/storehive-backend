// import { PrismaClient, User, Role } from "@prisma/client";
// import { PrismaClient } from "@prisma/client";
import { PrismaClient, Role, User as PrismaUser } from "@prisma/client";

const prisma = new PrismaClient();
//Works but but these are the cons:
// ❌ Too verbose and complex.
// ❌ Depends on the shape of a function return, which may change if you include relations or select fields.
// ❌ Doesn't always guarantee the full User model unless you explicitly request all fields.
// ❌ Could break if you change query behavior (e.g. include store, or use select).
// type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
// type Role = NonNullable<Awaited<ReturnType<typeof prisma.role.findUnique>>>;

// Alias for User type
// Directly imports the correct User type from the Prisma schema
type User = PrismaUser;

export class UserRepository {
  // Find user by email, only active (not soft deleted)
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  // Find user by id, only active
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // Create a new user (soft delete not applicable here)
  // async createUser(data: {
  //   email: string;
  //   password: string;
  //   role: Role;
  //   storeId?: string;
  // }): Promise<User> {
  //   return prisma.user.create({ data });
  // }
  async createUser(data: {
    email: string;
    password: string;
    role: Role;
    storeId?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  // Soft delete user by setting deletedAt timestamp
  async softDeleteUser(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Restore a soft deleted user by setting deletedAt to null
  async restoreUser(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // Find all active admins
  async findActiveAdmins(): Promise<Pick<User, "id" | "email" | "role">[]> {
    return prisma.user.findMany({
      where: { role: Role.ADMIN, deletedAt: null },
      select: { id: true, email: true, role: true },
    });
  }

  // Update user details
  // async updateUser(
  //   id: string,
  //   data: Partial<Pick<User, "email" | "password">>
  // ): Promise<User> {
  //   return prisma.user.update({
  //     where: { id },
  //     data,
  //   });
  // }
  async updateUser(
    id: string,
    data: Partial<
      Pick<
        User,
        "email" | "password" | "firstName" | "lastName" | "phoneNumber"
      >
    >
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  // Find all active users
  // async findAllActiveUsers(): Promise<Pick<User, "id" | "email" | "role">[]> {
  //   return prisma.user.findMany({
  //     where: { deletedAt: null },
  //     select: { id: true, email: true, role: true },
  //   });
  // }
  async findAllActiveUsers(): Promise<
    Pick<
      User,
      "id" | "email" | "role" | "firstName" | "lastName" | "phoneNumber"
    >[]
  > {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
      },
    });
  }

  async findUsersByStore(
    storeId: string
  ): Promise<Pick<User, "id" | "email" | "role">[]> {
    return prisma.user.findMany({
      where: { storeId, deletedAt: null },
      select: { id: true, email: true, role: true },
    });
  }

  async findUserWithBusinessById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        business: true,
      },
    });
  }
}
