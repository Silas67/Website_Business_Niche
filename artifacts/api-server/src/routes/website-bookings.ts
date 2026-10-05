import { Router, type IRouter } from "express";
import { count, desc } from "drizzle-orm";
import {
  CreateWebsiteLeadBody,
  CreateWebsiteLeadResponse,
  GetWebsiteLeadSummaryResponse,
  ListWebsiteLeadsResponse,
} from "@workspace/api-zod";
import { db, websiteLeadsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateWebsiteLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email?.trim() || null;
  const phone = parsed.data.phone?.trim() || null;

  if (!email && !phone) {
    res.status(400).json({ error: "Add an email address or phone number." });
    return;
  }

  const [lead] = await db
    .insert(websiteLeadsTable)
    .values({
      name: parsed.data.name.trim(),
      email,
      phone,
      niche: parsed.data.niche,
    })
    .returning();

  res.status(201).json(CreateWebsiteLeadResponse.parse(lead));
});

router.get("/leads", requireAdmin, async (req, res): Promise<void> => {
  const leads = await db
    .select()
    .from(websiteLeadsTable)
    .orderBy(desc(websiteLeadsTable.createdAt), desc(websiteLeadsTable.id));

  res.json(ListWebsiteLeadsResponse.parse(leads));
});

router.get("/leads/summary", requireAdmin, async (_req, res): Promise<void> => {
  const [totalResult] = await db
    .select({ total: count() })
    .from(websiteLeadsTable);
  const byNiche = await db
    .select({ niche: websiteLeadsTable.niche, count: count() })
    .from(websiteLeadsTable)
    .groupBy(websiteLeadsTable.niche)
    .orderBy(desc(count()), websiteLeadsTable.niche);

  res.json(
    GetWebsiteLeadSummaryResponse.parse({
      total: totalResult?.total ?? 0,
      byNiche,
    }),
  );
});

export default router;
