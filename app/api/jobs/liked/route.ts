import { NextResponse } from "next/server";

import { toJobCard } from "@/lib/jobtech";
import { getLikedJobs } from "@/lib/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { jobs, likedAt } = getLikedJobs();
  const cards = jobs.map((job) => ({
    ...toJobCard(job, "right"),
    likedAt: likedAt.get(job.id) ?? null,
  }));

  return NextResponse.json({
    count: cards.length,
    jobs: cards,
  });
}
