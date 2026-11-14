import Link from "next/link";

export default function ScanPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-8 sm:px-8">
      <Link href="/" className="text-sm font-semibold text-[#ed795d]">← Back to Splitzy</Link>
      <div className="my-auto py-16">
        <p className="text-xs font-bold tracking-[0.16em] text-[#99968d]">RECEIPT SCANNER</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Drop in a receipt.</h1>
        <p className="mt-4 leading-7 text-[#77766d]">Receipt upload and extraction belong to the AI scanner feature branch. The demo receipt API is ready to try without an API key.</p>
        <a href="/api/receipt" className="mt-6 inline-flex rounded-xl bg-[#f1efe8] px-4 py-3 text-sm font-bold">View sample receipt JSON ↗</a>
      </div>
    </main>
  );
}
