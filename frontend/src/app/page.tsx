import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gray-900 text-white font-bold text-4xl shadow-lg">
        D
      </div>
      <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-gray-900">
        Welcome to Dealio
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-gray-600">
        The smartest B2B CRM powered by AI. Track deals, manage pipelines, and close faster with intelligent intent signals and automated summaries.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
