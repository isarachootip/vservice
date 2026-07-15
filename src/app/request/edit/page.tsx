import { Suspense } from "react";
import RequestEditClient from "./request_edit_client";


export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">กำลังโหลด...</div>}>
      <RequestEditClient />
    </Suspense>
  );
}
