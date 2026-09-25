"use client";
import { useParams } from "next/navigation";
import { dictionary } from "@/lib/i18n";
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const params = useParams();
  const d = dictionary[params.locale === "ar" ? "ar" : "tr"];
  return (
    <div className="empty-state container">
      <h1>{d.error}</h1>
      <button className="button" onClick={retry}>
        {d.retry}
      </button>
    </div>
  );
}
