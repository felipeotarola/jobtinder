import db from "./db";
import type { JobtechJobAd } from "./jobtech";

const insertJob = db.prepare(`
  INSERT INTO jobs (
    id,
    headline,
    employer_name,
    location,
    logo_url,
    webpage_url,
    published_at,
    data_json,
    fetched_at
  ) VALUES (
    @id,
    @headline,
    @employer_name,
    @location,
    @logo_url,
    @webpage_url,
    @published_at,
    @data_json,
    @fetched_at
  )
  ON CONFLICT(id) DO UPDATE SET
    headline = excluded.headline,
    employer_name = excluded.employer_name,
    location = excluded.location,
    logo_url = excluded.logo_url,
    webpage_url = excluded.webpage_url,
    published_at = excluded.published_at,
    data_json = excluded.data_json,
    fetched_at = excluded.fetched_at
`);

const upsertSwipe = db.prepare(`
  INSERT INTO swipes (job_id, direction, swiped_at)
  VALUES (@job_id, @direction, @swiped_at)
  ON CONFLICT(job_id) DO UPDATE SET
    direction = excluded.direction,
    swiped_at = excluded.swiped_at
`);

const upsertSearchCache = db.prepare(`
  INSERT INTO search_cache (query_hash, query, job_ids, total, fetched_at)
  VALUES (@query_hash, @query, @job_ids, @total, @fetched_at)
  ON CONFLICT(query_hash) DO UPDATE SET
    query = excluded.query,
    job_ids = excluded.job_ids,
    total = excluded.total,
    fetched_at = excluded.fetched_at
`);

export function saveJobs(jobs: JobtechJobAd[], fetchedAt = Date.now()): void {
  const transaction = db.transaction((items: JobtechJobAd[]) => {
    for (const job of items) {
      const address = job.workplace_address;
      const location = [
        address?.city,
        address?.municipality,
        address?.region,
        address?.country,
      ]
        .filter(Boolean)
        .join(", ");

      insertJob.run({
        id: job.id,
        headline: job.headline ?? null,
        employer_name: job.employer?.name ?? null,
        location: location || null,
        logo_url: job.logo_url ?? null,
        webpage_url: job.webpage_url ?? null,
        published_at: job.publication_date ?? null,
        data_json: JSON.stringify(job),
        fetched_at: fetchedAt,
      });
    }
  });

  transaction(jobs);
}

export function saveSwipe(
  jobId: string,
  direction: "left" | "right",
  swipedAt = Date.now(),
): void {
  upsertSwipe.run({
    job_id: jobId,
    direction,
    swiped_at: swipedAt,
  });
}

export function getSwipeMap(
  jobIds: string[],
): Map<string, "left" | "right"> {
  if (jobIds.length === 0) return new Map();
  const placeholders = jobIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT job_id, direction FROM swipes WHERE job_id IN (${placeholders})`,
    )
    .all(...jobIds) as { job_id: string; direction: "left" | "right" }[];

  return new Map(rows.map((row) => [row.job_id, row.direction]));
}

export function getJobsByIds(jobIds: string[]): JobtechJobAd[] {
  if (jobIds.length === 0) return [];
  const placeholders = jobIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT id, data_json FROM jobs WHERE id IN (${placeholders})`,
    )
    .all(...jobIds) as { id: string; data_json: string }[];

  const map = new Map(
    rows.map((row) => [row.id, JSON.parse(row.data_json) as JobtechJobAd]),
  );

  return jobIds.map((id) => map.get(id)).filter(Boolean) as JobtechJobAd[];
}

export function getJobById(id: string): JobtechJobAd | null {
  const row = db
    .prepare("SELECT data_json FROM jobs WHERE id = ?")
    .get(id) as { data_json: string } | undefined;

  if (!row) return null;
  return JSON.parse(row.data_json) as JobtechJobAd;
}

export function saveSearchCache(
  queryHash: string,
  query: string,
  jobIds: string[],
  total: number,
  fetchedAt = Date.now(),
): void {
  upsertSearchCache.run({
    query_hash: queryHash,
    query,
    job_ids: JSON.stringify(jobIds),
    total,
    fetched_at: fetchedAt,
  });
}

export function getCachedSearch(
  queryHash: string,
  maxAgeMs: number,
): { jobIds: string[]; total: number; fetchedAt: number } | null {
  const row = db
    .prepare(
      "SELECT job_ids, total, fetched_at FROM search_cache WHERE query_hash = ?",
    )
    .get(queryHash) as
    | { job_ids: string; total: number; fetched_at: number }
    | undefined;

  if (!row) return null;
  if (Date.now() - row.fetched_at > maxAgeMs) return null;

  return {
    jobIds: JSON.parse(row.job_ids) as string[],
    total: row.total,
    fetchedAt: row.fetched_at,
  };
}

export function getLikedJobs(): {
  jobs: JobtechJobAd[];
  likedAt: Map<string, number>;
} {
  const rows = db
    .prepare(
      `SELECT jobs.id, jobs.data_json, swipes.swiped_at
       FROM swipes
       JOIN jobs ON jobs.id = swipes.job_id
       WHERE swipes.direction = 'right'
       ORDER BY swipes.swiped_at DESC`,
    )
    .all() as { id: string; data_json: string; swiped_at: number }[];

  const likedAt = new Map(rows.map((row) => [row.id, row.swiped_at]));
  const jobs = rows.map((row) => JSON.parse(row.data_json) as JobtechJobAd);

  return { jobs, likedAt };
}
