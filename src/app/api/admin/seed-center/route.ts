import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: { mode?: string; side?: string; a?: number; b?: number; count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const script = path.join(process.cwd(), "scripts", "seed-random-pixels.mjs");

  if (body.mode === "add") {
    const side = (body.side ?? "a").toLowerCase();
    if (side !== "a" && side !== "b") {
      return NextResponse.json({ error: "side must be a or b." }, { status: 400 });
    }
    const count = Math.floor(Number(body.a ?? body.count));
    if (!Number.isFinite(count) || count < 1) {
      return NextResponse.json({ error: "Provide positive a or count for pixels to add." }, { status: 400 });
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [script, "add", side, String(count)],
        {
          cwd: process.cwd(),
          env: process.env,
          timeout: 280_000,
          maxBuffer: 10 * 1024 * 1024,
        },
      );

      return NextResponse.json({
        ok: true,
        mode: "add",
        side,
        added: count,
        stdout: stdout.trim(),
        stderr: stderr.trim() || undefined,
      });
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      console.error("seed-center add failed:", err);
      return NextResponse.json(
        {
          error: "Add pixels failed.",
          detail: err.message,
          stdout: err.stdout?.trim(),
          stderr: err.stderr?.trim(),
        },
        { status: 500 },
      );
    }
  }

  const a = Math.floor(Number(body.a));
  const b = Math.floor(Number(body.b));
  if (!Number.isFinite(a) || a < 1 || !Number.isFinite(b) || b < 1) {
    return NextResponse.json(
      { error: "Provide positive integers a (Kamal) and b (Cockroach), or mode add." },
      { status: 400 },
    );
  }

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [script, String(a), String(b)], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 280_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    return NextResponse.json({
      ok: true,
      kamal: a,
      cockroach: b,
      stdout: stdout.trim(),
      stderr: stderr.trim() || undefined,
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    console.error("seed-center failed:", err);
    return NextResponse.json(
      {
        error: "Seed failed.",
        detail: err.message,
        stdout: err.stdout?.trim(),
        stderr: err.stderr?.trim(),
      },
      { status: 500 },
    );
  }
}
