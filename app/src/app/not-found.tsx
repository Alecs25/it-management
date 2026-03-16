import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-lg mb-6">Pagina non trovata</p>
        <Link href="/" className="btn btn-primary">
          Torna a Home
        </Link>
      </div>
    </main>
  );
}
