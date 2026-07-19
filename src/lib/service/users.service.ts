import bcrypt from "bcryptjs";
import { UsersRepository, UserRow } from "@/lib/repository/users.repo";
import { prisma } from "@/lib/database";

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
  location_name?: string | null;
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

    const profile: UserRowWithPermissionsList = {
      user_id: first.user_id,
      user_name: first.user_name,
      user_full_name: first.user_full_name,
      user_email: first.user_email,
      store_code: first.store_code,
      role: first.roles_name,
      permissions,
      store_nick: first.store_nick2 || "R9",
      in_bu: first.in_bu || "TW",
      location_id: first.location_id
    };

    if (first.location_id) {
      const loc = await prisma.location.findUnique({
        where: { id: first.location_id }
      });
      if (loc) {
        const name = loc.name.toUpperCase();
        const short = (loc.short_name || "").toUpperCase();

        // Derive BU prefix
        let in_bu = loc.bu || "TW";
        if (!loc.bu) {
          if (short.includes("AUTO1") || name.includes("AUTO 1") || name.includes("AUTO1")) {
            in_bu = "A1";
          } else if (short.includes("BAAN") || short.includes("BNB") || name.includes("BAAN") || name.includes("BEYOND")) {
            in_bu = "BB";
          } else if (short.includes("GOWOW") || name.includes("GO WOW") || name.includes("GOWOW")) {
            in_bu = "GW";
          } else {
            in_bu = "TW";
          }
        }

        // Derive store_nick
        let store_nick = "BN"; // default fallback for 'TW บางนา'
        if (name.includes("บางนา")) {
          store_nick = "BN";
        } else if (name.includes("พระราม 9") || name.includes("RAMA 9") || name.includes("RAMA9")) {
          store_nick = "R9";
        } else if (name.includes("สุขาภิบาล 3")) {
          store_nick = "S3";
        } else if (name.includes("นวมินทร์")) {
          store_nick = "NM";
        } else if (name.includes("รังสิต")) {
          store_nick = "RS";
        } else if (name.includes("สระบุรี")) {
          store_nick = "SR";
        } else {
          let clean = loc.name
            .replace(/AUTO\s*1/gi, "")
            .replace(/TW/g, "")
            .replace(/ไทวัสดุ/g, "")
            .replace(/สาขา/g, "")
            .replace(/\*/g, "")
            .trim();
          if (clean.includes("สำนักงานใหญ่")) {
            store_nick = "HQ";
          } else {
            const eng = clean.match(/[A-Z0-9]+/g);
            store_nick = (eng && eng[0]) ? eng[0].slice(0, 2) : clean.slice(0, 2);
          }
        }

        profile.in_bu = in_bu;
        profile.store_nick = store_nick;
        profile.location_name = loc.name;
      }
    }

    return profile;
  }
}
