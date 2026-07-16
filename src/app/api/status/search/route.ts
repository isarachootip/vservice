import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService } from "@/lib/service/users.service";

export const runtime = "nodejs";

type SearchRow = {
  id: number;
  request_id: number;
  request_no: string | null;
  customer_name: string | null;
  product_type: string | null;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
  qty: number | null;
  in_warranty: string | null;
  store_code: string | null;
  status: number | null;
  customer_receive_date: Date | null;
  created_date: Date | null;
  created_user: string | null;
  updated_date: Date | null;
  status_updated_date: Date | null;
  num_of_repair_day: string | null;
  user_approve_date: Date | null;
  receive_from_user_date: Date | null;
  send_to_vendor_date: Date | null;
  arrive_to_dc_date: Date | null;
  reject_flg: string | null;
  reject_from_status: string | null;
  sla_hours: number | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const dcFrom = (searchParams.get("dcFrom") || "").trim();
  const dcTo = (searchParams.get("dcTo") || "").trim();
  const filterLocationId = (searchParams.get("locationId") || "").trim();
  // const receiveDate = (searchParams.get("receiveDate") || "").trim();
  const andConditions: Prisma.repair_itemWhereInput[] = [];
  const useRawDateFilter = !!(dcFrom || dcTo);
  let matchedStoreCodes: string[] = [];

  // Authenticate user to get their location
  let userLocationId: string | null = null;
  let isStaffFiltered = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const payload = await verifyToken(token);
      const username = String(payload.sub || "");
      if (username) {
        const profile = await UserService.getUserProfile(username);
        if (profile) {
          const isAdmin = profile.role === "ADMIN" || profile.role === "ADMIN_GR";
          const isDC = profile.role === "DC";
          if (!isAdmin && !isDC) {
            userLocationId = profile.location_id || null;
            isStaffFiltered = true;
          }
        }
      }
    }
  } catch (err) {
    console.error("Auth check failed in search API:", err);
  }

  // Find stores for filters
  let allowedStoreCodes: string[] = [];
  if (isStaffFiltered) {
    if (userLocationId) {
      const storesInLocation = await prisma.store.findMany({
        where: { store_location: userLocationId },
        select: { store_code: true },
      });
      allowedStoreCodes = storesInLocation.map((s) => s.store_code);
    } else {
      allowedStoreCodes = ["__NONE__"];
    }
  }

  let selectedStoreCodes: string[] = [];
  if (filterLocationId) {
    const storesInLocation = await prisma.store.findMany({
      where: { store_location: filterLocationId },
      select: { store_code: true },
    });
    selectedStoreCodes = storesInLocation.map((s) => s.store_code);
  }

  let targetStoreCodes: string[] | null = null;
  if (isStaffFiltered) {
    if (filterLocationId && filterLocationId !== userLocationId) {
      targetStoreCodes = ["__NONE__"];
    } else {
      targetStoreCodes = allowedStoreCodes;
    }
  } else if (filterLocationId) {
    targetStoreCodes = selectedStoreCodes.length > 0 ? selectedStoreCodes : ["__NONE__"];
  }

  if (targetStoreCodes !== null) {
    andConditions.push({
      repair_request: {
        is: {
          store_code: { in: targetStoreCodes },
        },
      },
    });
  }

  if (q) {
    const matchedStores = await prisma.store.findMany({
      where: {
        store_nick3: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        store_code: true,
      },
    });
    matchedStoreCodes = matchedStores.map((s) => s.store_code);
  }

  if (q) {
    andConditions.push({
      OR: [
        { serial_no: { contains: q } },
        { brand: { contains: q } },
        { product_type: { contains: q } },
        { repair_request: { is: { request_no: { contains: q } } } },
        { repair_request: { is: { customer_name: { contains: q } } } },
        ...(matchedStoreCodes.length > 0
        ? [
            {
              repair_request: {
                is: {
                  store_code: { in: matchedStoreCodes },
                },
              },
            },
          ]
        : []),
      ],
    });
  }

  if (status) {
    const statusNum = Number(status);
    if (!Number.isNaN(statusNum)) {
      andConditions.push({
        repair_request: {
          is: {
            status: statusNum,
          },
        },
      });
    }
  }

  let items: SearchRow[] = [];
  if (useRawDateFilter) {
    const statusNum = Number(status);
    const hasValidStatus = status !== "" && !Number.isNaN(statusNum);
    const likeQ = `%${q}%`;

    const rawItems = await prisma.$queryRaw<SearchRow[]>(Prisma.sql`
      SELECT
        ri.id,
        rr.id AS request_id,
        rr.request_no,
        rr.customer_name,
        ri.product_type,
        ri.brand,
        ri.model,
        ri.serial_no,
        ri.qty,
        ri.in_warranty,
        rr.store_code,
        rr.status,
        rr.customer_receive_date,
        rr.created_date,
        rr.created_user,
        rr.updated_date,
        rr.status_updated_date,
        q.num_of_repair_day,
        q.user_approve_date,
        rr.receive_from_user_date,
        rr.send_to_vendor_date,
        rr.arrive_to_dc_date,
        rr.reject_flg,
        si.sla_hours,
      FROM repair_item ri
      INNER JOIN repair_request rr
        ON rr.id = ri.request_id
      LEFT JOIN quotation q
        ON q.id = (
          SELECT qq.id
          FROM quotation qq
          WHERE qq.request_id = rr.id
          ORDER BY qq.id ASC
          LIMIT 1
        )
      LEFT JOIN status_info si
        ON si.status_id = rr.status
      WHERE 1=1
        ${targetStoreCodes !== null
          ? Prisma.sql`AND rr.store_code IN (${Prisma.join(targetStoreCodes)})`
          : Prisma.empty}
        ${q
          ? Prisma.sql`
            AND (
              ri.serial_no LIKE ${likeQ}
              OR ri.brand LIKE ${likeQ}
              OR ri.product_type LIKE ${likeQ}
              OR rr.request_no LIKE ${likeQ}
              OR rr.customer_name LIKE ${likeQ}
              ${matchedStoreCodes.length > 0
                ? Prisma.sql`OR rr.store_code IN (${Prisma.join(matchedStoreCodes)})`
                : Prisma.empty}
            )
          `
        : Prisma.empty}
        ${hasValidStatus
          ? Prisma.sql`AND rr.status = ${statusNum}`
          : Prisma.empty}
        ${dcFrom
          ? Prisma.sql`AND rr.arrive_to_dc_date >= ${dcFrom}::date`
          : Prisma.empty}
        ${dcTo
          ? Prisma.sql`AND rr.arrive_to_dc_date <= ${dcTo}::date`
          : Prisma.empty}
        ORDER BY rr.created_date DESC
        LIMIT 100
    `);
    items = rawItems;
  }else {
    const data = await prisma.repair_item.findMany({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
      include: {
        repair_request: {
          select: {
            id: true,
            request_no: true,
            customer_name: true,
            store_code: true,
            arrive_to_dc_date: true,
            receive_from_user_date: true,
            send_to_vendor_date: true,
            customer_receive_date: true,
            status: true,
            created_date: true,
            created_user: true,
            updated_date: true,
            status_updated_date: true,
            reject_flg: true,
            reject_from_status: true,
            quotation: {
              select: {
                id: true,
                user_approve_date: true,
                num_of_repair_day: true,
              },
              orderBy: {
                id: "asc",
              },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ created_date: "desc" }],
      take: 100,
    });

    const statusIds = new Set(data.map((i) => i.repair_request?.status).filter((s) => s !== null && s !== undefined) as number[]);
    const statusInfoMap = new Map<number, number>();
    if (statusIds.size > 0) {
      const statusInfos = await prisma.status_info.findMany({
        where: 
          { status_id: { in: Array.from(statusIds) } },
        select: 
          { status_id: true, sla_hours: true },
      });
      statusInfos.forEach((si) => {
        statusInfoMap.set(si.status_id, si.sla_hours);
      });
    }

    items = data.map((i) => ({
      id: i.id,
      request_id: i.repair_request?.id ?? 0,
      request_no: i.repair_request?.request_no ?? null,
      customer_name: i.repair_request?.customer_name ?? null,
      product_type: i.product_type,
      brand: i.brand,
      model: i.model,
      serial_no: i.serial_no,
      qty: i.qty,
      in_warranty: i.in_warranty,
      store_code:
        i.repair_request?.store_code != null
          ? String(i.repair_request.store_code).trim()
          : null,
      status: i.repair_request?.status ?? null,
      customer_receive_date: i.repair_request?.customer_receive_date ?? null,
      created_date: i.repair_request?.created_date ?? null,
      created_user: i.repair_request?.created_user ?? null,
      updated_date: i.repair_request?.updated_date ?? null,
      status_updated_date: i.repair_request?.status_updated_date ?? null,
      num_of_repair_day: i.repair_request?.quotation?.[0]?.num_of_repair_day ?? null,
      user_approve_date: i.repair_request?.quotation?.[0]?.user_approve_date ?? null,
      receive_from_user_date: i.repair_request?.receive_from_user_date ?? null,
      send_to_vendor_date: i.repair_request?.send_to_vendor_date ?? null,
      arrive_to_dc_date: i.repair_request?.arrive_to_dc_date ?? null,
      reject_flg: i.repair_request?.reject_flg ?? null,
      reject_from_status: i.repair_request?.reject_from_status ?? null,
      sla_hours: (i.repair_request?.status !== null && i.repair_request?.status !== undefined) ? statusInfoMap.get(i.repair_request.status) ?? null : null,
    }));
  }

  //* รวม store code จาก repair_request
  const codeSet = new Set<string>();
  for (const it of items) {
    const codeRaw = it.store_code;
    if (codeRaw !== null && codeRaw !== undefined) {
      codeSet.add(String(codeRaw).trim());
    }
  }
  const codeList = Array.from(codeSet);

  //* นำ list store code ไปหาใน nickname store
  const stores = codeList.length
  ? await prisma.store.findMany({
      where: { store_code: { in: codeList } },
      select: { 
        store_code: true, 
        store_nick3: true, 
      },
    })
  : [];

  const storeMap = new Map<string, { nickName: string | null;}>(
    stores.map(s => [s.store_code, { 
      nickName: s.store_nick3 ?? null, 
    }])
  );

  const rows = items.map(i => {
    const codeStr = i.store_code != null ? String(i.store_code).trim() : null;
    const info = codeStr ? storeMap.get(codeStr) : undefined;

    return {
      id: i.id,
      request_id: i.request_id,
      request_no: i.request_no ?? null,
      customer_name: i.customer_name ?? null,
      product_type: i.product_type,
      brand: i.brand,
      model: i.model,
      serial_no: i.serial_no,
      qty: i.qty,
      in_warranty: i.in_warranty,
      store_code: codeStr,
      store_nick: info?.nickName ?? codeStr,
      status: i.status ?? null,
      customer_receive_date: i.customer_receive_date ?? null,
      created_date: i.created_date ?? null,
      created_user: i.created_user ?? null,
      updated_date: i.updated_date ?? null,
      status_updated_date: i.status_updated_date ?? null,
      num_of_repair_day: i.num_of_repair_day ?? null,
      user_approve_date: i.user_approve_date ?? null,
      receive_from_user_date: i.receive_from_user_date ?? null,
      send_to_vendor_date: i.send_to_vendor_date ?? null,
      arrive_to_dc_date: i.arrive_to_dc_date ?? null,
      reject_flg: i.reject_flg ?? null,
      reject_from_status: i.reject_from_status ?? null,
      sla: i.sla_hours !== null ? Math.ceil(i.sla_hours / 24) : null,
    };
  });
  return NextResponse.json({ items: rows });
}
