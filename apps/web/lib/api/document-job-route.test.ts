import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const auth = vi.fn();
  const requireOwnedDocumentJob = vi.fn();
  const requireSuperAdminManagedDocumentJob = vi.fn();

  return {
    auth,
    requireOwnedDocumentJob,
    requireSuperAdminManagedDocumentJob,
  };
});

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/guards/resources", () => ({
  requireOwnedDocumentJob: mocks.requireOwnedDocumentJob,
  requireSuperAdminManagedDocumentJob: mocks.requireSuperAdminManagedDocumentJob,
}));

let GET: typeof import("../../app/api/document-jobs/[jobId]/route").GET;

beforeAll(async () => {
  ({ GET } = await import("../../app/api/document-jobs/[jobId]/route"));
});

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.requireOwnedDocumentJob.mockReset();
  mocks.requireSuperAdminManagedDocumentJob.mockReset();
});

describe("GET /api/document-jobs/[jobId]", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/document-jobs/job-1"), {
      params: Promise.resolve({ jobId: "job-1" }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns the owned job for the workspace owner", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", isSuperAdmin: false },
    });
    mocks.requireOwnedDocumentJob.mockResolvedValue({
      id: "job-1",
      status: "running",
    });

    const response = await GET(new Request("http://localhost/api/document-jobs/job-1"), {
      params: Promise.resolve({ jobId: "job-1" }),
    });
    const body = (await response.json()) as { job: { id: string; status: string } };

    expect(response.status).toBe(200);
    expect(body.job).toEqual({
      id: "job-1",
      status: "running",
    });
    expect(mocks.requireSuperAdminManagedDocumentJob).not.toHaveBeenCalled();
  });

  it("allows super admins to read jobs for managed global libraries", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", isSuperAdmin: true },
    });
    mocks.requireOwnedDocumentJob.mockResolvedValue(null);
    mocks.requireSuperAdminManagedDocumentJob.mockResolvedValue({
      id: "job-2",
      status: "failed",
    });

    const response = await GET(new Request("http://localhost/api/document-jobs/job-2"), {
      params: Promise.resolve({ jobId: "job-2" }),
    });
    const body = (await response.json()) as { job: { id: string; status: string } };

    expect(response.status).toBe(200);
    expect(body.job).toEqual({
      id: "job-2",
      status: "failed",
    });
    expect(mocks.requireSuperAdminManagedDocumentJob).toHaveBeenCalledWith("job-2");
  });

  it("returns 404 for non-admin users when the job is not theirs", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-2", isSuperAdmin: false },
    });
    mocks.requireOwnedDocumentJob.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/document-jobs/job-3"), {
      params: Promise.resolve({ jobId: "job-3" }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(404);
    expect(body.error).toBe("Job not found");
    expect(mocks.requireSuperAdminManagedDocumentJob).not.toHaveBeenCalled();
  });
});
