import bcrypt from "bcryptjs";
import { UsersRepository, UserRow } from "@/lib/repository/users.repo";

export type UserRowWithPermissionsList = {
  user_id: number;
  user_name: string;
  user_full_name: string | null;
  user_email: string | null;
  store_code: number | null;
  role: string;
  permissions: string[];
  store_nick: string;
  in_bu: string;
  location_id?: string | null;
};

export class UserService {

  static async validateLogin(username: string, password: string) {
    const res = await UsersRepository.findUserForAuth(username);
    if (!res || !res.user_password) return null;                          
    const ok = await bcrypt.compare(password, res.user_password);
    if (!ok) return null;                             
    return res;                                      
  }

  static async getUserProfile(username: string): Promise<UserRowWithPermissionsList | null> {
    const rows = await UsersRepository.findUserRowsByUsername(username);
    if (!rows.length) return null;

    const first: UserRow = rows[0];
    const permissions = Array.from(new Set(rows.map(r => r.permission_name))).sort();

    return {
      user_id: first.user_id,
      user_name: first.user_name,
      user_full_name: first.user_full_name,
      user_email: first.user_email,
      store_code: first.store_code,
      role: first.roles_name,
      permissions,
      store_nick: first.store_nick2,
      in_bu: first.in_bu,
      location_id: first.location_id
    };
  }
}
