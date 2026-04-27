import { sendEmail } from "@casella/email";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { enqueueNotification } from "../enqueue";

vi.mock("server-only", () => ({}));

const insertValues = vi.fn(async () => undefined);

vi.mock("@casella/db", () => ({
  getDb: () => ({ insert: () => ({ values: insertValues }) }),
  schema: { notifications: {}, employees: {} },
  eq: vi.fn(),
}));

vi.mock("@casella/email", () => ({
  sendEmail: vi.fn(async () => undefined),
}));

vi.mock("../preferences", () => ({
  shouldSendEmail: vi.fn(async () => true),
  DEFAULT_EMAIL_PREFS: {},
}));

describe("enqueueNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendEmail when emailable + employeeId + emailRender provided", async () => {
    await enqueueNotification({
      userId: "u1",
      employeeId: "e1",
      type: "leave.approved",
      payload: { leaveId: "l1" },
      emailRender: () => ({
        to: "x@y.com",
        subject: "S",
        text: "T",
        html: "<p>T</p>",
      }),
    });
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("skips email when no emailRender", async () => {
    await enqueueNotification({
      userId: "u1",
      type: "leave.approved",
      payload: {},
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("inserts in-app notification regardless of email", async () => {
    await enqueueNotification({
      userId: "u1",
      type: "leave.submitted",
      payload: {},
    });
    expect(insertValues).toHaveBeenCalledOnce();
  });
});
