import { test, expect, type Page } from "@playwright/test"

// Seller screens built from the design cards, in mock mode (seller/public/dev-mock.js). Runs at 375, 768 and 1280.
async function open(page: Page, url: string, qs = "as=store&role=owner") {
  const errors: string[] = []
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
  await page.goto(`${url}${url.includes("?") ? "&" : "?"}${qs}`)
  await page.waitForLoadState("networkidle")
  await page.locator("main").first().waitFor()
  return errors
}
const width = (info: { project: { use: { viewport?: { width: number } | null } } }) => info.project.use.viewport!.width

test("Home: Needs you and today's earnings for an owner", async ({ page }) => {
  await open(page, "/")
  await expect(page.getByRole("heading", { name: "Needs you" })).toBeVisible()
  await expect(page.getByText("Accept 3 new orders")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Today's earnings" })).toBeVisible()
  await expect(page.getByText("Gross sales")).toBeVisible()
})

test("Home: staff do not see earnings or document rows", async ({ page }) => {
  await open(page, "/", "as=store&role=staff")
  await expect(page.getByRole("heading", { name: "Needs you" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Today's earnings" })).toHaveCount(0)
  await expect(page.getByText("Upload the renewed document")).toHaveCount(0)
  await open(page, "/", "as=store&role=owner")
})

test("Home: paused store shows Resume selling and zero counts", async ({ page }) => {
  await open(page, "/", "as=store&status=paused")
  await expect(page.getByRole("button", { name: "Resume selling" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Needs you" })).toHaveCount(0)
  await open(page, "/", "as=store&status=live")
})

test("Home: draft shows the setup checklist with progress", async ({ page }) => {
  await open(page, "/", "as=store&status=draft")
  await expect(page.getByRole("progressbar")).toBeVisible()
  await expect(page.getByRole("link", { name: /Continue setup/ }).first()).toBeVisible()
  await open(page, "/", "as=store&status=live")
})

test("Orders: board on desktop, tabs on phones; warning and overdue timers in words", async ({ page }, info) => {
  await open(page, "/orders")
  if (width(info) >= 1024) {
    for (const name of ["New", "Accepted", "Preparing"]) await expect(page.getByRole("region", { name })).toBeVisible()
  } else {
    await expect(page.getByRole("tab", { name: /^New/ })).toBeVisible()
  }
  await expect(page.locator('[data-state="warning"]').first()).toContainText(/Due in \d min/)
  await expect(page.locator('[data-state="overdue"]').first()).toContainText(/Overdue by/)
})

test("Order detail: two columns from 1024px, one-row action bar on phones, refund amount in the reject sheet", async ({ page }, info) => {
  await open(page, "/orders/o2")
  const accept = page.getByRole("button", { name: "Accept", exact: true })
  const reject = page.getByRole("button", { name: "Reject", exact: true })
  await expect(accept).toBeVisible()
  if (width(info) < 768) {
    const a = await accept.boundingBox(), r = await reject.boundingBox()
    expect(Math.abs(a!.y - r!.y)).toBeLessThan(4)
  }
  if (width(info) >= 1024) {
    const items = await page.getByRole("heading", { name: "Items" }).boundingBox()
    const customer = await page.getByRole("heading", { name: "Customer", exact: true }).boundingBox()
    expect(customer!.x).toBeGreaterThan(items!.x + 300)
  }
  await reject.click()
  await expect(page.getByText(/refunded .*1,250/)).toBeVisible()
})

test("Earnings: fee rule name and reversed state on the statement", async ({ page }) => {
  await open(page, "/earnings")
  await expect(page.getByText("Food 8%").locator("visible=true").first()).toBeVisible()
  await expect(page.getByText("Reversed").locator("visible=true").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Withdraw" })).toBeVisible()
})

test("Payout methods: Default badge and a disabled Ciuna Send row", async ({ page }) => {
  await open(page, "/earnings/methods")
  await expect(page.getByText("Default", { exact: true })).toBeVisible()
  await expect(page.getByText("Withdraw via Ciuna Send")).toBeVisible()
  await expect(page.getByText("Coming soon")).toBeVisible()
})

test("Product editor: two columns on desktop, Visibility card", async ({ page }, info) => {
  await open(page, "/catalog/p1")
  await expect(page.getByRole("heading", { name: "Visibility" })).toBeVisible()
  await expect(page.getByText("Visible in your store")).toBeVisible()
  if (width(info) >= 1024) {
    const basics = await page.getByRole("heading", { name: "Basics" }).boundingBox()
    const stock = await page.getByRole("heading", { name: "Stock" }).boundingBox()
    expect(stock!.x).toBeGreaterThan(basics!.x + 300)
  }
})

test("Messages: split view on desktop keeps the list while a thread is open", async ({ page }, info) => {
  await open(page, "/messages")
  if (width(info) >= 1024) {
    await page.getByRole("link", { name: "Amara Okafor" }).click()
    await expect(page).toHaveURL(/\/messages\/o1/)
    await expect(page.getByRole("link", { name: "Ivan Petrov" })).toBeVisible()
    await expect(page.getByPlaceholder("Write a message")).toBeVisible()
  } else {
    await page.getByRole("link", { name: "Amara Okafor" }).click()
    await expect(page).toHaveURL(/\/messages\/o1/)
    await expect(page.getByRole("link", { name: "Ivan Petrov" })).toBeHidden()
  }
})

test("Reviews: edit window and locked note", async ({ page }) => {
  await open(page, "/reviews")
  await expect(page.getByText(/You can edit this reply for \d+ more hours/)).toBeVisible()
  await expect(page.getByText("This reply can no longer be edited.")).toBeVisible()
})

test("More: grouped rows, Earnings and Reviews reachable on phones", async ({ page }, info) => {
  await open(page, "/more")
  await expect(page.getByRole("heading", { name: "Business" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible()
  if (width(info) < 768) {
    await expect(page.locator('main a[href="/earnings"]')).toBeVisible()
    await expect(page.locator('main a[href="/reviews"]')).toBeVisible()
  }
})

test("Shell: top bar with account menu on desktop only", async ({ page }, info) => {
  await open(page, "/")
  const bar = page.getByRole("button", { name: "Account menu" })
  if (width(info) >= 768) {
    await expect(bar).toBeVisible()
    await bar.click()
    await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible()
  } else {
    await expect(bar).toBeHidden()
  }
})
