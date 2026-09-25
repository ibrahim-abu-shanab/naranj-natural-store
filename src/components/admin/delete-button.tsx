"use client";
import { Trash2 } from "lucide-react";
import { adminError } from "./messages";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function DeleteButton({
  resource,
  id,
}: {
  resource: string;
  id: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <>
      <button
        disabled={busy}
        onClick={async () => {
          if (
            !confirm(
              "هل تريد حذف هذا السجل نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
            )
          )
            return;
          setBusy(true);
          setError("");
          try {
            const res = await fetch(`/api/admin/${resource}/${id}`, {
              method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            router.refresh();
          } catch (e) {
            setError(adminError(e instanceof Error ? e.message : ""));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Trash2 size={15} />
        {busy ? "جارٍ الحذف…" : "حذف"}
      </button>
      {error && (
        <p role="alert" style={{ color: "#963e27", whiteSpace: "normal" }}>
          {error}
        </p>
      )}
    </>
  );
}
