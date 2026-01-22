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
    description: "Product, data, engineering",
  },
  {
    id: "design",
    label: "Design",
    query: "design ux ui product",
    tone: "bg-[#6f1d1b] text-white",
    description: "UX, UI, creative",
  },
  {
    id: "sales",
    label: "Sales",
    query: "sales account business",
    tone: "bg-[#1d3557] text-white",
    description: "Sales, account, growth",
  },
  {
    id: "health",
    label: "Health",
    query: "nurse care medical health",
    tone: "bg-[#283618] text-white",
    description: "Care and wellbeing",
  },
  {
    id: "trades",
    label: "Trades",
    query: "electrician carpenter mechanic",
    tone: "bg-[#5f370e] text-white",
    description: "Skilled trades",
  },
];

const SWIPE_THRESHOLD = 120;

function formatLocation(location?: JobLocation): string {
  if (!location) return "Location not specified";
  const parts = [
    location.city,
    location.municipality,
    location.region,
    location.country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location not specified";
}

function formatDate(value?: string): string {
  if (!value) return "Open";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Open";
  return parsed.toLocaleDateString("en-SE", {
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
      className="absolute inset-0 flex h-full w-full flex-col gap-6 rounded-[32px] border border-black/10 bg-white/90 p-8 shadow-[0_30px_60px_-40px_rgba(32,26,23,0.7)] backdrop-blur"
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
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-black/50">
            {job.employer?.name ?? "Employer"}
          </p>
          <h2 className="font-display text-3xl text-[#1b1a17]">
            {job.headline ?? "Untitled role"}
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
          {job.logoUrl ? (
            <img
              src={job.logoUrl}
              alt={job.employer?.name ?? "Logo"}
              className="h-8 w-8 object-contain"
            />
          ) : (
            <span className="text-xs font-semibold text-black/50">LOGO</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-black/60">
        <span className="rounded-full border border-black/10 px-3 py-1">
          {formatLocation(job.location)}
        </span>
        <span className="rounded-full border border-black/10 px-3 py-1">
          Apply by {formatDate(job.applicationDeadline)}
        </span>
      </div>

      <p className="text-sm leading-7 text-black/70">
        {job.excerpt ??
          "No description snippet available. Open the listing for full details."}
      </p>

      <div className="mt-auto flex items-center justify-between">
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-black"
          >
            View listing
          </a>
        ) : (
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-black/40">
            No listing url
          </span>
        )}
        <span className="text-xs uppercase tracking-[0.2em] text-black/50">
          Published {formatDate(job.publishedAt)}
        </span>
      </div>

      {isTop ? (
        <>
          {/* Full card overlay for Save */}
          <motion.div
            className="absolute inset-0 rounded-[32px] bg-[#2f5233]/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={isSwiping && exitDirection === "right" ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          {/* Full card overlay for Pass */}
          <motion.div
            className="absolute inset-0 rounded-[32px] bg-[#7b2d26]/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={isSwiping && exitDirection === "left" ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className="absolute left-8 top-8 rounded-full border border-[#2f5233] bg-[#eff7ed] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f5233]"
            style={{ opacity: likeOpacity }}
            animate={isSwiping && exitDirection === "right" ? { opacity: 1 } : {}}
          >
            Save
          </motion.div>
          <motion.div
            className="absolute right-8 top-8 rounded-full border border-[#7b2d26] bg-[#fbf1ee] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7b2d26]"
            style={{ opacity: passOpacity }}
            animate={isSwiping && exitDirection === "left" ? { opacity: 1 } : {}}
          >
            Pass
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

  useEffect(() => {
    fetchLikedCount();
  }, [fetchLikedCount]);

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8d9b8,_transparent_55%),radial-gradient(circle_at_bottom,_#d2ebe7,_transparent_60%)]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-black/40">
              Jobsearch tinder
            </p>
            <h1 className="font-display text-4xl text-[#1b1a17] sm:text-5xl">
              Swipe into your next role
            </h1>
            <p className="mt-2 text-sm text-black/60">
              Live listings from Arbetsformedlingen.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm shadow-sm backdrop-blur">
            <span className="text-xs uppercase tracking-[0.2em] text-black/50">
              Saved
            </span>
            <span className="text-lg font-semibold text-[#1b1a17]">
              {likedCount}
            </span>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr]">
          <motion.section
            className="flex flex-col gap-6 rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_20px_40px_-30px_rgba(32,26,23,0.6)] backdrop-blur"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
          >
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-black/60">
                Branch
              </h2>
              <p className="text-sm text-black/60">
                Pick a track to anchor the search.
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
                    className={`relative overflow-hidden rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      isActive
                        ? "text-white"
                        : "bg-white text-black/60 hover:text-black"
                    }`}
                    type="button"
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="branch-pill"
                        className={`absolute inset-0 ${branch.tone}`}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      />
                    ) : null}
                    <span className="relative z-10">{branch.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">
              {activeBranch?.description}
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm text-black/70">
                Keywords
                <input
                  value={filters.keywords}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      keywords: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-black/30"
                  placeholder="e.g. product, python, payroll"
                />
              </label>
              <label className="grid gap-2 text-sm text-black/70">
                Location
                <input
                  value={filters.location}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-black/30"
                  placeholder="e.g. Stockholm, remote"
                />
              </label>
              <label className="grid gap-2 text-sm text-black/70">
                Category
                <input
                  value={filters.category}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-black/30"
                  placeholder="e.g. frontend, sales, care"
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">
                Remote only
                <input
                  type="checkbox"
                  checked={filters.remoteOnly}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      remoteOnly: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-black"
                />
              </label>
            </div>

            <motion.button
              onClick={loadJobs}
              className="mt-2 flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-black/20 transition disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={status === "loading"}
              type="button"
            >
              {status === "loading" ? "Loading cards" : "Find jobs"}
            </motion.button>
            {error ? (
              <p className="text-sm text-[#7b2d26]">{error}</p>
            ) : null}
          </motion.section>

          <section className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                  Results
                </p>
                <p className="text-lg text-black/70">
                  {hasSearched
                    ? `${total.toLocaleString()} roles matched`
                    : "Set your filters to start."}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-black/50">
                <span>{jobs.length} in deck</span>
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
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-black/20 bg-white/70 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="font-display text-2xl text-[#1b1a17]">
                    No more cards
                  </p>
                  <p className="text-sm text-black/60">
                    Tweak the filters or pull a fresh deck.
                  </p>
                  <motion.button
                    onClick={loadJobs}
                    className="rounded-full border border-black/10 bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                  >
                    Reload deck
                  </motion.button>
                </motion.div>
              ) : null}
            </div>

            <div className="flex items-center justify-center gap-4">
              <motion.button
                onClick={() => handleSwipe("left")}
                className="flex h-12 w-32 items-center justify-center rounded-full border border-black/10 bg-white text-xs font-semibold uppercase tracking-[0.3em] text-black/70 shadow-sm"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                disabled={!jobs.length || isSwiping}
                type="button"
              >
                Pass
              </motion.button>
              <motion.button
                onClick={() => handleSwipe("right")}
                className="flex h-12 w-32 items-center justify-center rounded-full bg-black text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-black/20"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                disabled={!jobs.length || isSwiping}
                type="button"
              >
                Save
              </motion.button>
            </div>
            <p className="text-center text-xs uppercase tracking-[0.2em] text-black/50">
              Swipe right to save · left to dismiss
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
