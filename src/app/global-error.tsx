"use client";
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "Arial", padding: 60, textAlign: "center" }}>
        <h1>NARANJ</h1>
        <p>Bir sorun oluştu. Lütfen tekrar deneyin.</p>
        <p lang="ar" dir="rtl">
          حدث خطأ. يرجى المحاولة مجددًا.
        </p>
        <button onClick={retry}>Tekrar dene / حاول مجددًا</button>
      </body>
    </html>
  );
}
