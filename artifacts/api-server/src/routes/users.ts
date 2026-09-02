import { Router } from "express";
import { db, users } from "@workspace/db";

const router = Router();

// Create a new user
router.post("/", async (req, res) => {
  try {
    const { id, name, email, phone, role, district } = req.body;

    if (!id || !name || !email || !role) {
      return res.status(400).json({
        error: "id, name, email and role are required",
      });
    }

    const [user] = await db
      .insert(users)
      .values({
        id,
        name,
        email,
        phone: phone || null,
        role,
        district: district || null,
      })
      .returning();

    return res.status(201).json(user);
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error?.code === "23505") {
      return res.status(409).json({
        error: "A user with this email already exists",
      });
    }

    return res.status(500).json({
      error: "Failed to create user",
    });
  }
});

// Get all users
router.get("/", async (_req, res) => {
  try {
    const result = await db.select().from(users);
    return res.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

export default router;
