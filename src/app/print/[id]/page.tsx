"use client";

import { use, useEffect, useState } from "react";
import { FileText, Printer } from "lucide-react";
import Image from 'next/image'

const COMPANY_INFO = {
  name: "บริษัท ซีอาร์ซี ไทวัสดุจำกัด (สาขาจันทบุรี)",
  branch: "สาขาที่ 00036 เลขประจำตัวผู้เสียภาษี 0105555021215",
  address1: "999 หมู่ที่ 2 ตำบล ท่าช้าง",
  address2: "อำเภอเมืองจันทบุรี จ.จันทบุรี 22000",
  phone: "039-600-100",
  fax: "039-600-101",
};

type PrintDoc = {
    docNo: string;
    docReturnNo: string;
    docDate: string;
    send_to_vendor_date: string;
    receive_from_user_date: string;
    vendor_name: string;
    internalFlg: string;
    customer: {
        name: string;
        phone: string;
        address: string;
    };
    product: {
        sku: number;
        barcode: string;
        name: string;
        brand: string;
        model: string;
        qty: string;
        serial: string;
        issue: string;
        warrantyFlg: string;
        warrantyNo: string;
    };
};

type Row = {
    id: number;
    desc: string;
    parts: number;
    labor: number;
    warrantyParts: boolean;
    warrantyLabor: boolean;
    repairCheck: boolean;
    repairReason: string;
};

type quotationList = {
    review_price_date?: string | Date | null;
    repair_order?: string | null;
    part_cost?: number | string | null;
    part_warranty_flg?: "Y" | "N" | null;
    labor_cost?: number | string | null;
    labor_warranty_flg?: "Y" | "N" | null;
    user_approve_date?: string | Date | null;
    user_approve_flg?: "Y" | "N" | null;
    user_repair_flg?: "Y" | "N" | null;
    user_repair_reason?: string | null;
    num_of_repair_day?: string | null;
    num_of_guarantee_day?: string | null;
    ticket_no?: string | null;
    quotation_no?: string | null;
    total_cost?: number | string | null;
};

//*  กำหนดวันให้ลูกค้ารับสินค้า
function getReturnCustomerDate(
    receive_from_user_date: string | null,
    send_to_vendor_date: string | null,
    num_of_repair_day: string | null,
): Date | null  {

    if (!receive_from_user_date || !send_to_vendor_date || !num_of_repair_day) return null;

    //* ระยะเวลาการซ่อมประมาณ
    const repairDays = Number(num_of_repair_day);
    if (!Number.isFinite(repairDays)) return null;

    const receiveDate = new Date(receive_from_user_date);
    const vendorDate = new Date(send_to_vendor_date);

    if (Number.isNaN(receiveDate.getTime()) || Number.isNaN(vendorDate.getTime())) return null;

    //* step 1 วันที่ vendor รับสินค้า - วันที่ลูกค้าส่งซ่อม
    const diffDays = Math.floor(
        (vendorDate.getTime() - receiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    //* step 2 + ระยะเวลาประมาณการซ่อม
    const totalDays = diffDays + repairDays;
    //* STEP 3 + วันที่ลูกค้าส่งซ่อม
    const resultDate = new Date(receiveDate);
    resultDate.setDate(resultDate.getDate() + totalDays);
        
    return resultDate;
}

function formatDateTH(d: Date) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        page-shell box-border
        w-[210mm]
        min-h-[297mm]
        mx-auto
        bg-white p-8 shadow-lg
        print:h-[297mm]
        print:min-h-0
        print:shadow-none
        print:break-after-page
        print:last:break-after-auto
      "
    >
      {children}
    </div>
  );
}

function CompanyHeader({ docNo }: { docNo: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-x-6">
      <div className="grid grid-cols-[80px_auto] gap-x-2">
        <Image src="/images/icon_twd.png" width={60} height={70} alt="Logo" />
        <div className="text-left text-xs">
          <div className="font-bold">ใบแจ้งซ่อม / ส่งซ่อมสินค้า</div>
          <div>{COMPANY_INFO.name}</div>
          <div>
            {COMPANY_INFO.branch}
            <br />
            {COMPANY_INFO.address1}
          </div>
          <div>{COMPANY_INFO.address2}</div>
          <div>โทรศัพท์ {COMPANY_INFO.phone} แฟกซ์ {COMPANY_INFO.fax}</div>
        </div>
      </div>

      <div className="justify-self-end translate-x-9 text-xs">
        <div className="grid gap-y-0">
          <div className="grid grid-cols-[60px_170px]">
            <div className="text-right pr-2">เลขที่ :</div>
            <div className="text-left tabular-nums">{docNo}</div>
          </div>

          <div className="grid grid-cols-[60px_170px]">
            <div className="text-right pr-2">วันที่ :</div>
            <div className="text-left tabular-nums">
              {new Date().toLocaleDateString("th-TH")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepairDocContent({ doc, avgRepairDay, copyType }: { doc: PrintDoc; avgRepairDay: string; copyType: 'customer' | 'company' }) {
  return (
    <>
      <div className="mb-6">
        <CompanyHeader docNo={doc?.docNo} />

        <div className="underline font-bold mb-1 mt-2 text-xs">
          รายละเอียดลูกค้า
        </div>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-2 text-xs">
          <div>
            <span className="font-medium">ชื่อ - นามสกุล :</span> {doc?.customer?.name}
          </div>

          <div>
            <span className="font-medium">เบอร์โทรศัพท์ :</span> {doc?.customer?.phone}
          </div>

          <div className="w-full">
            <span className="font-medium">ที่อยู่ :</span> {doc?.customer?.address}
          </div>
        </div>

        <div className="underline font-bold mb-1 mt-2 text-xs">
          รายละเอียดสินค้า
        </div>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-2 text-xs">
          <div>
            <span className="font-medium">SKU :</span>{" "}
            {doc?.product?.sku !== null && doc?.product?.sku !== undefined
              ? String(doc?.product?.sku).padStart(7, "0")
              : "-"}
          </div>

          <div>
            <span className="font-medium">B/C :</span> {doc?.product?.barcode}
          </div>

          <div>{doc?.product?.name}</div>

          <div>{doc?.product?.brand}</div>

          <div>{doc?.product?.model}</div>

          <div className="break-all max-w-[250px]">
            <span className="font-medium">S/N : </span> {doc?.product?.serial}
          </div>

          <div>
            <span className="font-medium">จำนวน </span> {doc?.product?.qty} ชิ้น
          </div>
        </div>

        <table className="w-auto border-collapse mt-2">
          <tbody>
            <tr>
              <td className="pr-2 text-xs">อาการเสียที่พบเบื้องต้น :</td>
              <td className="pl-0 text-xs">{doc?.product?.issue}</td>
            </tr>
            <tr>
              <td className="pr-2 text-xs">ปัญหาที่เกิดขึ้น :</td>
              <td className="pl-0 text-xs">
                {doc?.product.warrantyFlg === "Y" ? (
                  <>
                    อยู่ในประกัน (เลขที่ใบประกัน {doc?.product.warrantyNo})
                  </>
                ) : (
                  <>ไม่อยู่ในประกัน</>
                )}
              </td>
            </tr>
            <tr>
              <td className="pr-2 text-xs">
                สินค้าส่งซ่อมมีระยะเวลาการซ่อมประมาณ :
              </td>
              <td className="pl-0 text-xs">
                {avgRepairDay !== "" ? `${avgRepairDay} วัน` : "-"}
              </td>
            </tr>
            <tr>
              <td className="pr-2 text-xs">กำหนดวันให้ลูกค้ารับสินค้า :</td>
              <td className="pl-0 text-xs">
                {(() => {
                  const estiDate = getReturnCustomerDate(
                    doc?.receive_from_user_date,
                    doc?.send_to_vendor_date,
                    avgRepairDay
                  );
                  return estiDate ? formatDateTH(estiDate) : "-";
                })()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signature Section */}
        <div className="mt-3 flex justify-between text-xs">
          <div>
            <div className="ml-8">เจ้าหน้าที่บริการลูกค้า</div>
            <div className="ml-6">( ได้รับสินค้าเพื่อส่งซ่อม )</div>
            <br />
            <div>ลงชื่อ ____________________</div>
            <br />
            <div>วันที่ _____________________</div>
          </div>
          <div>
            <div className="ml-14">ลูกค้าลงนาม</div>
            <br />
            <br />
            <div>ลงชื่อ ____________________</div>
            <br />
            <div>วันที่ _____________________</div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3 mb-1 font-semibold text-xs">
          หมายเหตุ :
          <div>
            * โปรดเก็บเอกสารเพื่อเป็นหลักฐานในการตรวจสอบรายละเอียดการซ่อมสินค้า
          </div>
          <div>
            * บริษัทขอสงวนสิทธิ์ เรียกเก็บค่าใช้จ่ายที่เกิดขึ้นตามจริง
            หากสินค้าไม่ได้อยู่ในการรับประกัน
          </div>
          <div>
            * บริษัทขอสงวนสิทธิ์ในการรับฝากสินค้าซ่อมไม่เกิน 14 วันนับจากวันที่สินค้าซ่อมเสร็จ
          </div>
          <div>* กำหนดระยะเวลาส่งซ่อมโดยประมาณ ไม่เกิน 30 วัน</div>
          <div className="flex justify-between">
            <span>
              * บริษัทฯ รับประกันหลังการซ่อม ภายใน 30 วัน
              (เงื่อนไขเป็นไปตามข้อกำหนดของ Supplier)
            </span>
            <span className="text-xs font-normal">
              {copyType === 'customer' ? 'สำหรับลูกค้า' : 'สำหรับบริษัท'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function DocumentPage1({ doc, avgRepairDay }: { doc: PrintDoc; avgRepairDay: string }) {
  return (
    <div className="print-page">
      {/* Customer Copy */}
      <RepairDocContent doc={doc} avgRepairDay={avgRepairDay} copyType="customer" />

      {/* Divider */}
      <hr className="border-t border-dashed border-gray-400 my-3" />

      {/* Company Copy */}
      <RepairDocContent doc={doc} avgRepairDay={avgRepairDay} copyType="company" />
    </div>
  );
}

function QuotationContent({ doc, rows, avgRepairDay, quotationNo, ticketNum, totalCost, copyType }:
    { doc: PrintDoc; rows: Row[]; avgRepairDay: string; quotationNo: string; ticketNum: string; totalCost: number; copyType: 'customer' | 'company' }) {
  return (
    <>
      <div className="mb-6">
                <div className="grid grid-cols-[1fr_auto] items-start gap-x-6">
                    <div className="grid grid-cols-[80px_auto] gap-x-2">
                        <Image
                            src="/images/icon_twd.png"
                            width={60}
                            height={70}
                            alt="Logo"
                        />
                        <div className="text-left text-xs">
                            <div className="font-bold">
                                ใบส่งคืนสินค้าซ่อม
                            </div>
                            <div>
                                บริษัท ซีอาร์ซี ไทวัสดุจำกัด (สาขาจันทบุรี)
                            </div>
                            <div>
                                สาขาที่ 00036 เลขประจำตัวผู้เสียภาษี 0105555021215
                            <br />
                                999 หมู่ที่ 2 ตำบล ท่าช้าง
                            </div>
                            <div>
                                อำเภอเมืองจันทบุรี จ.จันทบุรี 22000
                            </div>
                            <div>
                                โทรศัพท์ 039-600-100 แฟกซ์ 039-600-101
                            </div>
                        </div>
                    </div>

                    <div className="justify-self-end translate-x-9 text-xs">
                        <div className="grid gap-y-0">
                            <div className="grid grid-cols-[60px_170px]">
                                <div className="text-right pr-2">เลขที่ :</div>
                                <div className="text-left tabular-nums">{doc?.docReturnNo}</div>
                            </div>

                            <div className="grid grid-cols-[60px_170px]">
                                <div className="text-right pr-2">วันที่ :</div>
                                <div className="text-left tabular-nums">
                                    {new Date().toLocaleDateString("th-TH")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="underline font-bold mb-1 mt-2 text-xs">
                    รายละเอียดลูกค้า
                </div>
                <div className="flex flex-wrap items-center gap-x-10 gap-y-2 text-xs">
                    <div>
                        <span className="font-medium">ชื่อ - นามสกุล :</span>{" "}
                        {doc?.customer?.name}
                    </div>

                    <div>
                        <span className="font-medium">เบอร์โทรศัพท์ :</span>{" "}
                        {doc?.customer?.phone}
                    </div>

                    <div className="w-full">
                        <span className="font-medium">ที่อยู่ :</span>{" "}
                        {doc?.customer?.address}
                    </div>
                </div>

                <div className="underline mb-1 mt-2 font-bold text-xs">
                    รายละเอียดสินค้า
                </div>
                <div className="flex flex-wrap items-center gap-x-10 gap-y-2 text-xs">
                    <div>
                        <span className="font-medium">SKU :</span>{" "}
                        {doc?.product?.sku !== null && doc?.product?.sku !== undefined
                            ? String(doc?.product?.sku).padStart(7, "0")
                            : "-"}
                    </div>

                    <div>
                        <span className="font-medium">B/C :</span>{" "}
                        {doc?.product?.barcode}
                    </div>

                    <div>
                        {doc?.product?.name}
                    </div>

                    <div>
                        {doc?.product?.brand}
                    </div>

                    <div>
                        {doc?.product?.model}
                    </div>

                    <div className="break-all max-w-[250px]">
                        <span className="font-medium">S/N : </span>{" "}
                        {doc?.product?.serial}
                    </div>

                    <div>
                        <span className="font-medium">จำนวน </span>{" "}
                        {doc?.product?.qty} ชิ้น
                    </div>
                </div>
            
                <div className="grid grid-cols-2 gap-x-10 items-start mt-2">
                    {/* ฝั่งซ้าย */}
                    <table className="w-auto border-collapse font-medium text-xs">
                        <tbody>
                            <tr>
                                <td className="pr-2 whitespace-nowrap">เงื่อนไข :</td>
                                <td className="pl-0">
                                    {doc?.product.warrantyFlg === "Y"
                                        ? <>อยู่ในประกัน (เลขที่ใบประกัน {doc?.product.warrantyNo})</>
                                        : <>ไม่อยู่ในประกัน</>}
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-2 whitespace-nowrap">สินค้าส่งซ่อมมีระยะเวลาการซ่อมประมาณ :</td>
                                <td className="pl-0">
                                    {avgRepairDay != null ? `${avgRepairDay} วัน` : "-"}
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-2 whitespace-nowrap">กำหนดวันให้ลูกค้ารับสินค้า :</td>
                                <td className="pl-0">
                                    {(() => {
                                        const estiDate = getReturnCustomerDate(
                                            doc?.receive_from_user_date,
                                            doc?.send_to_vendor_date,
                                            avgRepairDay
                                    );
                                        return estiDate ? formatDateTH(estiDate) : "-";
                                    })()}
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-2 whitespace-nowrap align-top">รายการที่ซ่อมเรียบร้อยแล้ว :</td>
                                {/* <td className="px-1 text-center align-top">:</td> */}
                                <td className="pl-1 align-top">
                                    {rows.length > 0 ? (
                                        rows.map((item) => (
                                            <div key={item.id}>
                                                {item.desc || "-"}
                                            </div>
                                        ))
                                    ) : (
                                        <div>-</div>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ฝั่งขวา */}
                    <div className="space-y-3">
                        <table className="w-auto border-collapse font-medium text-xs">
                            <tbody>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">เลขที่ใบแจ้งซ่อม/ส่งซ่อมสินค้า :</td>
                                    <td className="pl-0">{doc?.docNo}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">เลขที่ใบเสนอราคา :</td>
                                    <td className="pl-0">{quotationNo}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">เลขที่ใบเสร็จ :</td>
                                    <td className="pl-0">{ticketNum}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">ราคาค่าซ่อมจริงที่ลูกค้าชำระ :</td>
                                    <td className="pl-0">{totalCost} บาท </td>
                                </tr>
                                <tr>            
                                    <td className="pr-2 whitespace-nowrap"></td>
                                    <td className="pl-0">(ราคาที่ Supplier เป็นผู้กำหนด)</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">ผู้รับผิดชอบงานซ่อม (Supplier) :</td>
                                    <td className="pl-0">
                                        {doc?.internalFlg === "Y"
                                            ? `${doc?.vendor_name} (x)`
                                            : doc?.vendor_name}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* License (footer) */}
                <div className="mt-1 flex justify-between text-xs">
                    <div>
                        <div className="ml-8">
                            เจ้าหน้าที่บริการลูกค้า
                        </div>
                        <div className="ml-6">
                            ( ได้รับสินค้าเพื่อส่งซ่อม )
                        </div>
                        <br />
                        <div>
                            ลงชื่อ ____________________
                        </div>
                        <br />
                        <div>
                            วันที่ _____________________
                        </div>
                    </div>
                    <div>
                        <div className="ml-14">
                            ลูกค้าลงนาม
                        </div>
                        <br />
                        <br />
                        <div>
                            ลงชื่อ ____________________
                        </div>
                        <br />
                        <div>
                            วันที่ _____________________
                        </div>
                    </div>
                </div>
                <div className="mt-2 mb-1 font-semibold text-xs">
                    หมายเหตุ :
                    <div>
                        * โปรดเก็บเอกสารเพื่อเป็นหลักฐานในการตรวจสอบรายละเอียดการซ่อมสินค้า
                    </div>
                    <div>
                        * บริษัทขอสงวนสิทธิ์ เรียกเก็บค่าใช้จ่ายที่เกิดขึ้นตามจริง หากสินค้าไม่ได้อยู่ในการรับประกัน
                    </div>
                    <div>
                        * บริษัทขอสงวนสิทธิ์ในการรับฝากสินค้าซ่อมไม่เกิน 14 วันนับจากวันที่สินค้าซ่อมเสร็จ
                    </div>
                    <div>
                        * กำหนดระยะเวลาส่งซ่อมโดยประมาณ ไม่เกิน 30 วัน
                    </div>
                     <div className="flex justify-between">
                        <span>
                            * บริษัทฯ รับประกันหลังการซ่อม ภายใน 30 วัน (เงื่อนไขเป็นไปตามข้อกำหนดของ Supplier)
                        </span>

                        <span className="text-xs font-normal">
                            สำหรับลูกค้า
                        </span>
                    </div>
                </div>
                <hr className="border-t border-dashed border-gray-400 my-3" />
                <div className="grid grid-cols-[1fr_auto] items-start gap-x-6">
                    <div className="grid grid-cols-[80px_auto] gap-x-2">
                        <Image
                            src="/images/icon_twd.png"
                            width={60}
                            height={70}
                            alt="Logo"
                        />
                        <div className="text-left text-xs">
                            <div className="font-bold">
                                ใบส่งคืนสินค้าซ่อม
                            </div>
                            <div>
                                บริษัท ซีอาร์ซี ไทวัสดุจำกัด (สาขาจันทบุรี)
                            </div>
                            <div>
                                สาขาที่ 00036 เลขประจำตัวผู้เสียภาษี 0105555021215
                            <br />
                                999 หมู่ที่ 2 ตำบล ท่าช้าง
                            </div>
                            <div>
                                อำเภอเมืองจันทบุรี จ.จันทบุรี 22000
                            </div>
                            <div>
                                โทรศัพท์ 039-600-100 แฟกซ์ 039-600-101
                            </div>
                        </div>
                    </div>

                    <div className="justify-self-end translate-x-9 text-xs">
                        <div className="grid gap-y-0">
                            <div className="grid grid-cols-[60px_170px]">
                                <div className="text-right pr-2">เลขที่ :</div>
                                <div className="text-left tabular-nums">{doc?.docReturnNo}</div>
                            </div>

                            <div className="grid grid-cols-[60px_170px]">
                                <div className="text-right pr-2">วันที่ :</div>
                                <div className="text-left tabular-nums">
                                    {new Date().toLocaleDateString("th-TH")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="underline font-bold mb-1 mt-2 text-xs">
                    รายละเอียดลูกค้า
                </div>
                <div className="flex flex-wrap items-center gap-x-10 gap-y-2 text-xs">
                    <div>
                        <span className="font-medium">ชื่อ - นามสกุล :</span>{" "}
                        {doc?.customer?.name}
                    </div>

                    <div>
                        <span className="font-medium">เบอร์โทรศัพท์ :</span>{" "}
                        {doc?.customer?.phone}
                    </div>

                    <div className="w-full">
                        <span className="font-medium">ที่อยู่ :</span>{" "}
                        {doc?.customer?.address}
                    </div>
                </div>

                <div className="underline mb-1 mt-2 font-bold text-xs">
                    รายละเอียดสินค้า
                </div>
                <div className="flex flex-wrap items-center gap-x-10 gap-y-2 text-xs">
                    <div>
                        <span className="font-medium">SKU :</span>{" "}
                        {doc?.product?.sku !== null && doc?.product?.sku !== undefined
                            ? String(doc?.product?.sku).padStart(7, "0")
                            : "-"}
                    </div>

                    <div>
                        <span className="font-medium">B/C :</span>{" "}
                        {doc?.product?.barcode}
                    </div>

                    <div>
                        {doc?.product?.name}
                    </div>

                    <div>
                        {doc?.product?.brand}
                    </div>

                    <div>
                        {doc?.product?.model}
                    </div>

                    <div className="break-all max-w-[250px]">
                        <span className="font-medium">S/N : </span>{" "}
                        {doc?.product?.serial}
                    </div>

                    <div>
                        <span className="font-medium">จำนวน </span>{" "}
                        {doc?.product?.qty} ชิ้น
                    </div>
                </div>
            
                <div className="grid grid-cols-2 gap-x-10 items-start mt-2">
                    {/* ฝั่งซ้าย */}
                    <table className="w-auto border-collapse font-medium text-xs">
                        <tbody>
                            <tr>
                                <td className="pr-2 whitespace-nowrap">เงื่อนไข :</td>
                                <td className="pl-0">
                                    {doc?.product.warrantyFlg === "Y"
                                        ? <>อยู่ในประกัน (เลขที่ใบประกัน {doc?.product.warrantyNo})</>
                                        : <>ไม่อยู่ในประกัน</>}
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-2 whitespace-nowrap">สินค้าส่งซ่อมมีระยะเวลาการซ่อมประมาณ :</td>
                                <td className="pl-0">
                                    {avgRepairDay != null ? `${avgRepairDay} วัน` : "-"}
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-2 whitespace-nowrap">กำหนดวันให้ลูกค้ารับสินค้า :</td>
                                <td className="pl-0">
                                    {(() => {
                                        const estiDate = getReturnCustomerDate(
                                            doc?.receive_from_user_date,
                                            doc?.send_to_vendor_date,
                                            avgRepairDay
                                    );
                                        return estiDate ? formatDateTH(estiDate) : "-";
                                    })()}
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-2 whitespace-nowrap align-top">รายการที่ซ่อมเรียบร้อยแล้ว :</td>
                                <td className="pl-1 align-top">
                                    {rows.length > 0 ? (
                                        rows.map((item) => (
                                            <div key={item.id}>
                                                {item.desc || "-"}
                                            </div>
                                        ))
                                    ) : (
                                        <div>-</div>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ฝั่งขวา */}
                    <div className="space-y-3">
                        <table className="w-auto border-collapse font-medium text-xs">
                            <tbody>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">เลขที่ใบแจ้งซ่อม/ส่งซ่อมสินค้า :</td>
                                    <td className="pl-0">{doc?.docNo}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">เลขที่ใบเสนอราคา :</td>
                                    <td className="pl-0">{quotationNo}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">เลขที่ใบเสร็จ :</td>
                                    <td className="pl-0">{ticketNum}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">ราคาค่าซ่อมจริงที่ลูกค้าชำระ :</td>
                                    <td className="pl-0">{totalCost} บาท </td>
                                </tr>
                                <tr>            
                                    <td className="pr-2 whitespace-nowrap"></td>
                                    <td className="pl-0">(ราคาที่ Supplier เป็นผู้กำหนด)</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 whitespace-nowrap">ผู้รับผิดชอบงานซ่อม (Supplier) :</td>
                                    <td className="pl-0">{doc?.vendor_name}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                    <div>
                        <div className="ml-8">
                            เจ้าหน้าที่บริการลูกค้า
                        </div>
                        <div className="ml-6">
                            ( ได้รับสินค้าเพื่อส่งซ่อม )
                        </div>
                        <br />
                        <div>
                            ลงชื่อ ____________________
                        </div>
                        <br />
                        <div>
                            วันที่ _____________________
                        </div>
                    </div>
                    <div>
                        <div className="ml-14">
                            ลูกค้าลงนาม
                        </div>
                        <br />
                        <br />
                        <div>
                            ลงชื่อ ____________________
                        </div>
                        <br />
                        <div>
                            วันที่ _____________________
                        </div>
                    </div>
                </div>
                <div className="mt-2 mb-1 font-semibold text-xs">
                    หมายเหตุ :
                    <div>
                        * โปรดเก็บเอกสารเพื่อเป็นหลักฐานในการตรวจสอบรายละเอียดการซ่อมสินค้า
                    </div>
                    <div>
                        * บริษัทขอสงวนสิทธิ์ เรียกเก็บค่าใช้จ่ายที่เกิดขึ้นตามจริง หากสินค้าไม่ได้อยู่ในการรับประกัน
                    </div>
                    <div>
                        * บริษัทขอสงวนสิทธิ์ในการรับฝากสินค้าซ่อมไม่เกิน 14 วันนับจากวันที่สินค้าซ่อมเสร็จ
                    </div>
                    <div>
                        * กำหนดระยะเวลาส่งซ่อมโดยประมาณ ไม่เกิน 30 วัน
                    </div>
                     <div className="flex justify-between">
                        <span>
                            * บริษัทฯ รับประกันหลังการซ่อม ภายใน 30 วัน (เงื่อนไขเป็นไปตามข้อกำหนดของ Supplier)
                        </span>

                        <span className="text-xs font-normal">
                            {copyType === 'customer' ? 'สำหรับลูกค้า' : 'สำหรับบริษัท'}
                        </span>
                    </div>
                </div>
      </div>
    </>
  );
}

function QuotationPage({ doc, rows, avgRepairDay, quotationNo, ticketNum, totalCost }:
    { doc: PrintDoc; rows: Row[]; avgRepairDay: string; quotationNo: string; ticketNum: string; totalCost: number }) {
  return (
    <>
      {/* Customer Copy */}
      <QuotationContent doc={doc} rows={rows} avgRepairDay={avgRepairDay} quotationNo={quotationNo} ticketNum={ticketNum} totalCost={totalCost} copyType="customer" />

      {/* Divider */}
      <hr className="border-t border-dashed border-gray-400 my-3" />

      {/* Company Copy */}
      <QuotationContent doc={doc} rows={rows} avgRepairDay={avgRepairDay} quotationNo={quotationNo} ticketNum={ticketNum} totalCost={totalCost} copyType="company" />
    </>
  );
}

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [doc, setDoc] = useState<PrintDoc | null>(null);

    const [avgRepairDay, setAvgRepairDay] = useState("");
    const [quotationNo, setQuotationNo] = useState("");
    const [ticketNum, setTicketNum] = useState("");
    const [totalCost, setTotalCost] = useState<number>(0);
    const [status, setStatus] = useState<number | "">("");
    const statusNum =
      typeof status === "number" ? status : Number(status || 0);
    const [rows, setRows] = useState<Row[]>([]);

    const onPrint = () => {
        window.print();
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}`, { cache: "no-store" });

            const data = await res.json();
            if (!res.ok) return;

            const r = data.request;
            console.log("DATA :",data.request)
            const nextDoc: PrintDoc = {
                //* เลขที่ใบแจ้งซ่อม
                docNo: r.request_no,
                //* เลขที่ใบรับคืนสินค้า
                docReturnNo: r.request_return_no,
                //* วันที่
                docDate: new Date().toLocaleDateString("th-TH"),
                //* กำหนดวันให้ลูกค้ารับสินค้า
                send_to_vendor_date: r.send_to_vendor_date,
                receive_from_user_date: r.receive_from_user_date,
                //* vendor
                vendor_name: r.vendor_name,
                //* flg เช็คการซ่อมภายใน
                internalFlg: r.internal_flg,
                //* รายละเอียดลูกค้า
                customer: {
                    name: r.customer_name ?? "-",
                    phone: r.phone ?? "-",
                    address: r.address ?? "-",
                },
                //* รายละเอียดสินค้า
                product: {
                    sku: r.item?.sku_code ?? "-",
                    barcode: r.item?.bar_code ?? "-",
                    name: r.item?.product_type ?? "-",
                    brand: r.item?.brand ?? "-",
                    model: r.item?.model ?? "-",
                    qty: r.item?.qty ?? "-",
                    serial: r.item?.serial_no ?? "-",
                    issue: r.item?.issue ?? "-",
                    warrantyFlg: r.item?.in_warranty ?? "-",
                    warrantyNo: r.item?.warranty_no ?? "-",
                },
            };
            setStatus(r.status);
            const q: quotationList[] = Array.isArray(r?.quotation)
              ? (r.quotation as quotationList[])
              : [];
            if (q.length > 0) {
                setAvgRepairDay(q[0]?.num_of_repair_day ?? "");
                setQuotationNo(q[0]?.quotation_no ?? "");
                setTicketNum(q[0]?.ticket_no ?? "");
                setTotalCost(Number(q[0]?.total_cost ?? 0));
            }

            setRows(
                q.map((row, idx) => ({
                    id: idx + 1,
                    desc: String(row.repair_order ?? ""),
                    parts: Number(row.part_cost ?? 0),
                    labor: Number(row.labor_cost ?? 0),
                    warrantyParts: (row.part_warranty_flg ?? "") === "Y",
                    warrantyLabor: (row.labor_warranty_flg ?? "") === "Y",
                    repairCheck : (row.user_repair_flg ?? "") === "Y",
                    repairReason : String(row.user_repair_reason ?? ""),
                }))
            );

            if (alive) setDoc(nextDoc);
            
        })();

        return () => { alive = false; };
    }, [id]);

    useEffect(() => {
        if (doc) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [doc]);

    return (
        <div className="min-h-screen bg-slate-200">
            {/* Toolbar */}
            <div className="sticky top-0 z-50 flex items-center justify-between bg-white px-6 py-3 shadow print:hidden">
                <div className="flex items-center gap-2 text-slate-700">
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">{doc?.docNo}</span>
                </div>

                <button
                onClick={onPrint}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                    <Printer className="h-4 w-4" />
                    Print
                </button>
            </div>

            <div className="flex flex-col items-center gap-8 py-8 print:gap-0 print:py-0 print:block">
                {!doc ? (
                <div className="text-slate-600">กำลังโหลด...</div>
                ) : (
                <>  
                    {[37, 237].includes(statusNum) && (
                        <PageShell>
                            <QuotationPage doc={doc} rows={rows} 
                                avgRepairDay={avgRepairDay} quotationNo={quotationNo} 
                                ticketNum={ticketNum} totalCost={totalCost} />
                        </PageShell>
                    )}
                    {!([37, 237].includes(statusNum)) && (
                        <>  
                            <PageShell>
                                <DocumentPage1 doc={doc} avgRepairDay={avgRepairDay} />
                            </PageShell>

                            {/* <PageShell>
                                <DocumentPage2 doc={doc} />
                            </PageShell> */}
                        </>
                    )}
                </>
                )}
            </div>
        </div>
    );
}
