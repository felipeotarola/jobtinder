import { NextRequest, NextResponse } from "next/server";

import { fetchJobById, toJobCard } from "@/lib/jobtech";
import { getJobById, saveJobs, saveSwipe } from "@/lib/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SwipeDirection = "left" | "right";

function parseDirection(value: unknown): SwipeDirection | null {
  if (value === "left" || value === "right") return value;
  return null;
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const body = await request.json().catch(() => null);
  const direction = parseDirection(body?.direction);

  if (!direction) {
    return NextResponse.json(
      { error: "direction must be 'left' or 'right'" },
      { status: 400 },
    );
  }

  const jobId = context.params.id;
  let job = getJobById(jobId);

  if (!job) {
    try {
      job = await fetchJobById(jobId);
      saveJobs([job]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "JobSearch error";
      const status = message.includes("404") ? 404 : 502;
      return NextResponse.json(
        { error: status === 404 ? "Job not found in JobSearch API" : message },
        { status },
      );
    }
  }

  saveSwipe(jobId, direction);

  return NextResponse.json({
    job: toJobCard(job, direction),
    direction,
  });
}
