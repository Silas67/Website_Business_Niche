import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: "Sign in to access the admin inbox." });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    req.log.error("ADMIN_EMAIL is not configured");
    res.status(503).json({ error: "Admin access is not configured." });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress.trim().toLowerCase();

    if (email !== adminEmail) {
      res.status(403).json({ error: "This account cannot access the admin inbox." });
      return;
    }

    next();
  } catch (error) {
    req.log.error({ err: error }, "Could not verify admin access");
    next(error);
  }
}
