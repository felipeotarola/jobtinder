import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import type { JobtechSearchResponse } from "@/lib/jobtech";
import { toJobCard, fetchJobSearch } from "@/lib/jobtech";
import {
  getCachedSearch,
  getJobsByIds,
  getSwipeMap,
  saveJobs,
  saveSearchCache,
} from "@/lib/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function clampLimit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

function toNumber(value: string | null, fallback = 0): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function buildCanonicalQuery(params: URLSearchParams): string {
  const entries = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return new URLSearchParams(entries).toString();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const keywords = searchParams.get("q") ?? searchParams.get("keywords");
  const location = searchParams.get("location");
  const category = searchParams.get("category");
  const categoryId =
    searchParams.get("categoryId") ?? searchParams.get("occupationField");
  const region = searchParams.get("region");
  const municipality = searchParams.get("municipality");
  const country = searchParams.get("country");
  const remote = searchParams.get("remote");

  const limit = clampLimit(toNumber(searchParams.get("limit"), DEFAULT_LIMIT));
  const offset = Math.max(0, toNumber(searchParams.get("offset"), 0));

  const queryParts = [keywords, location, category].filter(Boolean);
  const jobtechParams = new URLSearchParams();

  if (queryParts.length > 0) {
    jobtechParams.set("q", queryParts.join(" "));
  }

  if (categoryId) {
    jobtechParams.set("occupation-field", categoryId);
  }

  if (region) jobtechParams.set("region", region);
  if (municipality) jobtechParams.set("municipality", municipality);
  if (country) jobtechParams.set("country", country);
  if (remote) jobtechParams.set("remote", remote);

  jobtechParams.set("limit", limit.toString());
  if (offset > 0) jobtechParams.set("offset", offset.toString());

  const resdet = searchParams.get("resdet") ?? "full";
  jobtechParams.set("resdet", resdet);

  // Stable ordering keeps cache keys consistent across equivalent requests.
  const canonicalQuery = buildCanonicalQuery(jobtechParams);
  const queryHash = createHash("sha256").update(canonicalQuery).digest("hex");

  const ttlSeconds = toNumber(
    process.env.JOB_CACHE_TTL_SECONDS ?? "300",
    300,
  );
  const cached = getCachedSearch(queryHash, Math.max(0, ttlSeconds) * 1000);

  if (cached) {
    const cachedJobs = getJobsByIds(cached.jobIds);
    if (cachedJobs.length === cached.jobIds.length) {
      const swipeMap = getSwipeMap(cached.jobIds);
      const cards = cachedJobs.map((job) =>
        toJobCard(job, swipeMap.get(job.id) ?? null),
      );

      return NextResponse.json({
        source: "jobtech",
        cached: true,
        total: cached.total,
        count: cards.length,
        jobs: cards,
        query: {
          keywords,
          location,
          category,
          categoryId,
          region,
          municipality,
          country,
          remote,
          limit,
          offset,
        },
      });
    }
  }

  let data: JobtechSearchResponse;
  try {
    data = await fetchJobSearch(jobtechParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JobSearch error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  const jobs = data.hits ?? [];
  const now = Date.now();
  const jobIds = jobs.map((job) => job.id);

  saveJobs(jobs, now);
  saveSearchCache(
    queryHash,
    canonicalQuery,
    jobIds,
    data.total?.value ?? jobs.length,
    now,
  );

  const swipeMap = getSwipeMap(jobIds);
  const cards = jobs.map((job) => toJobCard(job, swipeMap.get(job.id) ?? null));

  return NextResponse.json({
    source: "jobtech",
    cached: false,
    total: data.total?.value ?? jobs.length,
    count: cards.length,
    jobs: cards,
    query: {
      keywords,
      location,
      category,
      categoryId,
      region,
      municipality,
      country,
      remote,
      limit,
      offset,
    },
  });
}
