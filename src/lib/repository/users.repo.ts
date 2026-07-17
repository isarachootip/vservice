import { prisma } from "@/lib/database";

export type UserRow = {
  user_id: number;
  user_name: string;
  user_full_name: string | null;
  user_email: string | null;
  store_code: number | null;
  roles_name: string;
  permission_name: string;
  store_nick2: string;
  in_bu: string;
  location_id: string | null;
};

export class UsersRepository {

  static async findUserRowsByUsername(username: string): Promise<UserRow[]> {
    return await prisma.$queryRaw<UserRow[]>`
      SELECT  u.user_id, u.user_name, u.user_full_name, u.user_email, u.store_code, u.location_id,
              ur.roles_name, p.permission_name, s.store_nick2, s.in_bu
      FROM users u
      JOIN user_roles ur ON ur.roles_id = u.roles_id
      JOIN user_roles_has_permission urp ON urp.user_roles_roles_id = ur.roles_id
      JOIN permission p ON urp.permission_id = p.permission_id
      LEFT JOIN store s ON s.store_code = u.store_code
      WHERE u.user_name = ${username}`;
  }

  static async findUserForAuth(username: string) {
    return await prisma.users.findFirst({
      where: { user_name: username },                      
      select: { user_id: true, user_name: true, user_password: true, store_code: true, roles_id: true },
    });
  }

  static async findByUsername(username: string) {
    return await prisma.users.findUnique({
      where: { user_name : username },
      select: { user_id: true, user_name: true, user_password: true, store_code: true},
    });
  }

  static async findAll() {
    return await prisma.users.findMany({
      select: { user_id: true, user_name: true },
    });
  }
}
