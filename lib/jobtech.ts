const JOBTECH_BASE_URL =
  process.env.JOBTECH_BASE_URL ?? "https://jobsearch.api.jobtechdev.se";
const JOBTECH_API_KEY = process.env.JOBTECH_API_KEY ?? "";
const JOBTECH_API_KEY_HEADER = process.env.JOBTECH_API_KEY_HEADER ?? "X-API-Key";

export type JobtechEmployer = {
  name?: string;
  organization_number?: string;
  url?: string;
  email?: string;
  phone_number?: string;
  workplace?: string;
};

export type JobtechDescription = {
  text?: string;
  text_formatted?: string;
  company_information?: string;
  needs?: string;
  requirements?: string;
  conditions?: string;
};

export type JobtechWorkplaceAddress = {
  municipality?: string;
  municipality_code?: string;
  municipality_concept_id?: string;
  region?: string;
  region_code?: string;
  region_concept_id?: string;
  country?: string;
  country_code?: string;
  country_concept_id?: string;
  street_address?: string;
  postcode?: string;
  city?: string;
  coordinates?: number[];
};

export type JobtechJobAd = {
  id: string;
  headline?: string;
  employer?: JobtechEmployer;
  description?: JobtechDescription;
  workplace_address?: JobtechWorkplaceAddress;
  logo_url?: string;
  webpage_url?: string;
  application_deadline?: string;
  publication_date?: string;
};

export type JobtechSearchResponse = {
  total?: { value: number };
  hits: JobtechJobAd[];
  positions?: number;
  query_time_in_millis?: number;
  result_time_in_millis?: number;
};

export type JobLocation = {
  municipality?: string;
  region?: string;
  country?: string;
  city?: string;
  streetAddress?: string;
  coordinates?: number[];
};

export type JobCard = {
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

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (JOBTECH_API_KEY) {
    headers[JOBTECH_API_KEY_HEADER] = JOBTECH_API_KEY;
  }

  return headers;
}

export async function fetchJobSearch(
  params: URLSearchParams,
): Promise<JobtechSearchResponse> {
  const url = `${JOBTECH_BASE_URL}/search?${params.toString()}`;
  const response = await fetch(url, {
    headers: buildHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `JobSearch API error ${response.status}: ${message || "unknown error"}`,
    );
  }

  return (await response.json()) as JobtechSearchResponse;
}

export async function fetchJobById(id: string): Promise<JobtechJobAd> {
  const url = `${JOBTECH_BASE_URL}/ad/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    headers: buildHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `JobSearch API error ${response.status}: ${message || "unknown error"}`,
    );
  }

  return (await response.json()) as JobtechJobAd;
}

function buildExcerpt(text?: string): string | undefined {
  if (!text) return undefined;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 280) return normalized;
  return `${normalized.slice(0, 277)}...`;
}

export function toJobCard(
  job: JobtechJobAd,
  swipe?: "left" | "right" | null,
): JobCard {
  const address = job.workplace_address;

  return {
    id: job.id,
    headline: job.headline,
    employer: job.employer ? { name: job.employer.name } : undefined,
    location: address
      ? {
          municipality: address.municipality,
          region: address.region,
          country: address.country,
          city: address.city,
          streetAddress: address.street_address,
          coordinates: address.coordinates,
        }
      : undefined,
    logoUrl: job.logo_url,
    url: job.webpage_url,
    applicationDeadline: job.application_deadline,
    publishedAt: job.publication_date,
    excerpt: buildExcerpt(job.description?.text),
    swipe: swipe ?? null,
  };
}
