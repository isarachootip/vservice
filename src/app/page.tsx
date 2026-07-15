import { Suspense } from "react";
import RequestViewClient from "./request/view/request_view_client";


export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">กำลังโหลด...</div>}>
      <RequestViewClient />
    </Suspense>
  );
}
