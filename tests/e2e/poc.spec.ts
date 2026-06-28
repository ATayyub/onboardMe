import { test, expect, BrowserContext } from "@playwright/test";

const RUN_ID = Date.now();
const EMAIL = `e2e-${RUN_ID}@example.com`;
const PASSWORD = "E2ETest2026!";

let ctx: BrowserContext;
let flowId = "";

test.describe.serial("POC Checklist", () => {
  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/signup");
    await page.getByPlaceholder("you@example.com").fill(EMAIL);
    await page.getByPlaceholder("At least 8 characters").fill(PASSWORD);
    await page.getByPlaceholder("Confirm your password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/dashboard");
    await page.close();
  });

  test.afterAll(async () => {
    await ctx.close();
  });

  test("1 — org can sign up and log in", async () => {
    const page = await ctx.newPage();
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your flows", level: 2 })).toBeVisible();
    await page.close();
  });

  test("2 — flow can be created, edited, and published", async () => {
    const page = await ctx.newPage();
    await page.goto("/dashboard");

    await page.getByPlaceholder(/Product Onboarding/).fill("E2E Test Flow");
    await page.getByRole("button", { name: "Create" }).click();

    const flowLink = page.getByRole("link", { name: /E2E Test Flow/ });
    await expect(flowLink).toBeVisible();
    const href = await flowLink.getAttribute("href");
    flowId = href!.split("/flows/")[1];

    await page.goto(`/flows/${flowId}`);
    await page.getByRole("button", { name: "+ Add Step" }).click();
    await page.getByRole("heading", { name: "New Step" }).click();
    await page.getByPlaceholder("Step title").fill("Welcome!");
    await page.getByRole("button", { name: "Done Editing" }).click();

    await page.getByRole("button", { name: "Publish Flow" }).click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByText("Live")).toBeVisible();
    await page.close();
  });

  test("3 — SDK renders a published flow on an external page", async () => {
    const page = await ctx.newPage();
    await page.goto("/test.html");
    await page.getByPlaceholder("Enter Flow ID").fill(flowId);
    await page.getByRole("button", { name: "Load Flow" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Welcome!" })).toBeVisible();
    await expect(dialog.getByText("Step 1 of 1")).toBeVisible();

    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).not.toBeVisible();
    await page.close();
  });

  test("4 — analytics events appear in the dashboard", async () => {
    const page = await ctx.newPage();
    await page.goto(`/flows/${flowId}`);
    await page.getByRole("button", { name: "Analytics" }).click();
    await expect(page.getByText("flow_started")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("flow_completed")).toBeVisible();
    await page.close();
  });

  test("5 — all API routes return correct shapes", async () => {
    const page = await ctx.newPage();
    await page.goto("/dashboard");

    // Public: GET /api/sdk/[flowId]/config — no auth, must have CORS header
    const config = await page.request.get(`/api/sdk/${flowId}/config`);
    expect(config.status()).toBe(200);
    const configBody = await config.json();
    expect(configBody).toMatchObject({ id: flowId, config: expect.any(Array) });
    expect(config.headers()["access-control-allow-origin"]).toBe("*");

    // Public: POST /api/sdk/[flowId]/events — no auth required
    const event = await page.request.post(`/api/sdk/${flowId}/events`, {
      data: { eventType: "flow_started", userId: "api-route-test" },
    });
    expect(event.status()).toBe(201);

    // Auth-gated: GET /api/flows
    const flows = await page.request.get("/api/flows");
    expect(flows.status()).toBe(200);
    expect(Array.isArray(await flows.json())).toBe(true);

    // Auth-gated: GET /api/flows/[id]
    const flowDetail = await page.request.get(`/api/flows/${flowId}`);
    expect(flowDetail.status()).toBe(200);
    const fd = await flowDetail.json();
    expect(fd).toMatchObject({ id: flowId, name: "E2E Test Flow" });

    // Auth-gated: PUT /api/flows/[id]
    const updated = await page.request.put(`/api/flows/${flowId}`, {
      data: { name: "E2E Test Flow" },
    });
    expect(updated.status()).toBe(200);

    // Auth-gated: POST /api/flows/[id]/publish
    const publish = await page.request.post(`/api/flows/${flowId}/publish`, {
      data: { config: [{ id: "1", title: "Welcome!", description: "" }] },
    });
    expect(publish.status()).toBe(201);

    // Auth-gated: GET /api/dashboard/analytics?flowId=
    const analytics = await page.request.get(`/api/dashboard/analytics?flowId=${flowId}`);
    expect(analytics.status()).toBe(200);
    const ad = await analytics.json();
    expect(ad).toHaveProperty("summary");
    expect(ad).toHaveProperty("events");

    await page.close();
  });
});
