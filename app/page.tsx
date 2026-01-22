"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type JobLocation = {
  municipality?: string;
  region?: string;
  country?: string;
  city?: string;
  streetAddress?: string;
  coordinates?: number[];
};

type JobCard = {
  id: string;
  headline?: string;
  employer?: { name?: string };
  location?: JobLocation;
  logoUrl?: string;
  url?: string;
  applicationDeadline?: string;
  publishedAt?: string;
  excerpt?: string;
  swipe?: "left" | "right" | null;
};

type Branch = {
  id: string;
  label: string;
  query: string;
  tone: string;
  description: string;
};

type Filters = {
  branch: string;
  keywords: string;
  location: string;
  category: string;
  remoteOnly: boolean;
};

type SwipeDirection = "left" | "right";

const BRANCHES: Branch[] = [
  {
    id: "tech",
    label: "Tech",
    query: "developer engineer software data",
    tone: "bg-[#17202a] text-white",
    description: "Produkt, data, utveckling",
  },
  {
    id: "design",
    label: "Design",
    query: "design ux ui product",
    tone: "bg-[#6f1d1b] text-white",
    description: "UX, UI, kreativt",
  },
  {
    id: "sales",
    label: "Sälj",
    query: "sales account business",
    tone: "bg-[#1d3557] text-white",
    description: "Försäljning, kunder, tillväxt",
  },
  {
    id: "health",
    label: "Vård",
    query: "nurse care medical health",
    tone: "bg-[#283618] text-white",
    description: "Vård och omsorg",
  },
  {
    id: "trades",
    label: "Hantverket",
    query: "electrician carpenter mechanic",
    tone: "bg-[#5f370e] text-white",
    description: "Yrkesarbete",
  },
];

const SWIPE_THRESHOLD = 120;

function formatLocation(location?: JobLocation): string {
  if (!location) return "Plats ej angiven";
  const parts = [
    location.city,
    location.municipality,
    location.region,
    location.country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Plats ej angiven";
}

function formatDate(value?: string): string {
  if (!value) return "Öppen";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Öppen";
  return parsed.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function SwipeCard({
  job,
  depth,
  isTop,
  exitDirection,
  onSwipe,
  isSwiping,
}: {
  job: JobCard;
  depth: number;
  isTop: boolean;
  exitDirection: SwipeDirection | null;
  onSwipe: (direction: SwipeDirection) => void;
  isSwiping: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -40], [1, 0]);

  return (
    <motion.article
      className="absolute inset-0 flex h-full w-full flex-col gap-6 rounded-3xl bg-white p-8 shadow-2xl border-2 border-gray-100"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 30 - depth,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      dragSnapToOrigin
      onDragEnd={(_, info) => {
        if (!isTop) return;
        if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
        if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
      }}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{
        opacity: 1,
        y: depth * 12,
        scale: 1 - depth * 0.04,
        transition: { type: "spring", stiffness: 260, damping: 24 },
      }}
      exit={
        exitDirection
          ? {
              x: exitDirection === "right" ? 360 : -360,
              rotate: exitDirection === "right" ? 12 : -12,
              opacity: 0,
              transition: { duration: 0.2 },
            }
          : { opacity: 0 }
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">
            {job.employer?.name ?? "Arbetsgivare"}
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mt-1">
            {job.headline ?? "Tjänst utan titel"}
          </h2>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50 shadow-md">
          {job.logoUrl ? (
            <img
              src={job.logoUrl}
              alt={job.employer?.name ?? "Logo"}
              className="h-12 w-12 object-contain"
            />
          ) : (
            <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-700">
          📍 {formatLocation(job.location)}
        </span>
        <span className="rounded-full bg-yellow-100 px-4 py-2 font-medium text-yellow-800">
          ⏰ {formatDate(job.applicationDeadline)}
        </span>
      </div>

      <p className="text-base leading-relaxed text-gray-700">
        {job.excerpt ??
          "Ingen beskrivning tillgänglig. Klicka 'Visa annons' för fullständig information."}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1"
          >
            Visa annons
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <span className="text-sm font-medium text-gray-400">
            Ingen annons tillgänglig
          </span>
        )}
        <span className="text-sm text-gray-500">
          Publicerad {formatDate(job.publishedAt)}
        </span>
      </div>

      {isTop ? (
        <>
          {/* Full card overlay for Save */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-yellow-300/20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={isSwiping && exitDirection === "right" ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          {/* Full card overlay for Pass */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-slate-400/20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={isSwiping && exitDirection === "left" ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className="absolute left-8 top-8 rounded-2xl border-4 border-yellow-400 bg-white px-6 py-3 flex items-center gap-2 shadow-lg"
            style={{ opacity: likeOpacity }}
            animate={isSwiping && exitDirection === "right" ? { opacity: 1, scale: 1.1 } : {}}
          >
            <svg className="h-8 w-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="text-xl font-bold text-yellow-600">LIKE</span>
          </motion.div>
          <motion.div
            className="absolute right-8 top-8 rounded-2xl border-4 border-slate-400 bg-white px-6 py-3 flex items-center gap-2 shadow-lg"
            style={{ opacity: passOpacity }}
            animate={isSwiping && exitDirection === "left" ? { opacity: 1, scale: 1.1 } : {}}
          >
            <svg className="h-8 w-8 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
            <span className="text-xl font-bold text-slate-600">NOPE</span>
          </motion.div>
        </>
      ) : null}
    </motion.article>
  );
}

export default function Home() {
  const [filters, setFilters] = useState<Filters>({
    branch: BRANCHES[0].id,
    keywords: "",
    location: "",
    category: "",
    remoteOnly: false,
  });
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [likedCount, setLikedCount] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [likedJobs, setLikedJobs] = useState<JobCard[]>([]);

  const activeBranch = useMemo(
    () => BRANCHES.find((branch) => branch.id === filters.branch),
    [filters.branch],
  );

  const fetchLikedCount = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs/liked");
      if (!response.ok) return;
      const data = (await response.json()) as { count?: number };
      setLikedCount(data.count ?? 0);
    } catch {
      // Ignore count failures.
    }
  }, []);

  const fetchLikedJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs/liked");
      if (!response.ok) return;
      const data = (await response.json()) as { jobs?: JobCard[]; count?: number };
      setLikedJobs(data.jobs ?? []);
      setLikedCount(data.count ?? 0);
    } catch {
      // Ignore failures.
    }
  }, []);

  useEffect(() => {
    fetchLikedCount();
  }, [fetchLikedCount]);

  useEffect(() => {
    if (isSidebarOpen) {
      fetchLikedJobs();
    }
  }, [isSidebarOpen, fetchLikedJobs]);

  const loadJobs = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setExitDirection(null);

    const params = new URLSearchParams();
    const keywordParts = [
      activeBranch?.query,
      filters.keywords.trim(),
      filters.category.trim(),
    ].filter(Boolean);

    if (keywordParts.length) {
      params.set("keywords", keywordParts.join(" "));
    }
    if (filters.location.trim()) {
      params.set("location", filters.location.trim());
    }
    if (filters.remoteOnly) {
      params.set("remote", "true");
    }
    params.set("limit", "25");

    try {
      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = (await response.json()) as {
        jobs?: JobCard[];
        total?: number;
        error?: string;
      };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Unable to fetch jobs.");
      }

      setJobs(data.jobs ?? []);
      setTotal(data.total ?? 0);
      setHasSearched(true);
      setStatus("idle");
    } catch (fetchError) {
      setJobs([]);
      setTotal(0);
      setHasSearched(true);
      setStatus("error");
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to fetch jobs.",
      );
    }
  }, [activeBranch?.query, filters.category, filters.keywords, filters.location, filters.remoteOnly]);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (isSwiping) return; // Prevent multiple simultaneous swipes
      
      setIsSwiping(true);
      setExitDirection(direction);
      
      // Use functional update to get the current jobs state
      setJobs((currentJobs) => {
        if (!currentJobs.length) {
          setIsSwiping(false);
          setExitDirection(null);
          return currentJobs;
        }
        
        const [current, ...rest] = currentJobs;
        
        if (direction === "right") {
          setLikedCount((count) => count + 1);
        }
        
        // Make the API call
        fetch(`/api/jobs/${current.id}/swipe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        }).catch(() => {
          // Swipes are optimistic; ignore errors for now.
        }).finally(() => {
          // Small delay to allow the exit animation to complete, then reset
          setTimeout(() => {
            setIsSwiping(false);
            setExitDirection(null);
          }, 250);
        });
        
        return rest;
      });
    },
    [isSwiping],
  );

  const stack = useMemo(() => jobs.slice(0, 3), [jobs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl">
                JobbSwipen
              </h1>
              <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">via Arbetsförmedlingen</span>
            </div>
            <p className="mt-2 text-lg text-gray-600">
              Swipea dig till ditt nästa jobb
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-3 rounded-2xl bg-yellow-400 px-6 py-3 text-gray-800 shadow-lg hover:bg-yellow-500 transition-all cursor-pointer"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            <span className="text-2xl font-bold">{likedCount}</span>
          </button>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr]">
          <motion.section
            className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-xl border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Bransch
              </h2>
              <p className="text-sm text-gray-600">
                Välj ditt område
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((branch) => {
                const isActive = branch.id === filters.branch;
                return (
                  <button
                    key={branch.id}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, branch: branch.id }))
                    }
                    className={`relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-yellow-400 text-gray-800 shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    type="button"
                  >
                    {branch.label}
                  </button>
                );
              })}
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
              {activeBranch?.description}
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-gray-700">
                Sökord
                <input
                  value={filters.keywords}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      keywords: event.target.value,
                    }))
                  }
                  className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  placeholder="t.ex. produktägare, python, lön"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700">
                Plats
                <input
                  value={filters.location}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: event.target.value,
                    }))
                  }
                  className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  placeholder="t.ex. Stockholm, distans"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700">
                Kategori
                <input
                  value={filters.category}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                  className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  placeholder="t.ex. frontend, försäljning, vård"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
                Endast distans
                <input
                  type="checkbox"
                  checked={filters.remoteOnly}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      remoteOnly: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-yellow-500"
                />
              </label>
            </div>

            <motion.button
              onClick={loadJobs}
              className="mt-2 flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-4 text-base font-bold text-gray-800 shadow-lg transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={status === "loading"}
              type="button"
            >
              {status === "loading" ? "Laddar..." : "Sök jobb"}
            </motion.button>
            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}
          </motion.section>

          <section className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {hasSearched
                    ? `${total.toLocaleString()} jobb`
                    : "Kom igång"}
                </p>
                <p className="text-sm text-gray-600">
                  {jobs.length} kort kvar
                </p>
              </div>
            </div>

            <div className="relative h-[520px] w-full">
              <AnimatePresence initial={false}>
                {stack.map((job, index) => (
                  <SwipeCard
                    key={job.id}
                    job={job}
                    depth={index}
                    isTop={index === 0}
                    exitDirection={index === 0 ? exitDirection : null}
                    onSwipe={handleSwipe}
                    isSwiping={isSwiping && index === 0}
                  />
                ))}
              </AnimatePresence>

              {!stack.length && hasSearched ? (
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-6xl">🎉</div>
                  <p className="text-2xl font-bold text-gray-900">
                    Klart!
                  </p>
                  <p className="text-gray-600">
                    Inga fler kort. Justera filter eller ladda om.
                  </p>
                  <motion.button
                    onClick={loadJobs}
                    className="rounded-xl bg-yellow-400 px-8 py-3 font-bold text-gray-800 shadow-lg hover:bg-yellow-500"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                  >
                    Ladda om
                  </motion.button>
                </motion.div>
              ) : null}
            </div>

            <div className="flex items-center justify-center gap-6">
              <motion.button
                onClick={() => handleSwipe("left")}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-500 bg-white text-red-500 shadow-lg hover:bg-red-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={!jobs.length || isSwiping}
                type="button"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
              <motion.button
                onClick={() => handleSwipe("right")}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 text-gray-800 shadow-xl hover:bg-yellow-500"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={!jobs.length || isSwiping}
                type="button"
              >
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
            <p className="text-center text-sm text-gray-600">
              Tryck ❤️ för att spara · ✕ för att skippa
            </p>
          </section>
        </div>
      </div>

      {/* Sidebar for saved jobs */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Sparade jobb</h2>
                  <p className="text-sm text-gray-600">{likedJobs.length} jobb</p>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {likedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💼</div>
                    <p className="text-lg font-semibold text-gray-900">Inga sparade jobb än</p>
                    <p className="text-sm text-gray-600 mt-2">Tryck på ❤️ för att spara jobb du gillar</p>
                  </div>
                ) : (
                  likedJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-yellow-400 transition cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 flex-shrink-0">
                          {job.logoUrl ? (
                            <img
                              src={job.logoUrl}
                              alt={job.employer?.name ?? "Logo"}
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 truncate">
                            {job.employer?.name ?? "Arbetsgivare"}
                          </p>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-2">
                            {job.headline ?? "Tjänst utan titel"}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            📍 {formatLocation(job.location)}
                          </p>
                          {job.url && (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-yellow-700 hover:text-yellow-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Visa annons
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
