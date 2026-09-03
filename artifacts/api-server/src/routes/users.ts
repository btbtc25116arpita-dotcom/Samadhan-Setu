import { Router } from "express";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
function verifyPassword(password: string, storedPassword: string): boolean {
  const [salt, storedHash] = storedPassword.split(":");

  if (!salt || !storedHash) return false;

  const hash = scryptSync(password, salt, 64).toString("hex");

  return hash === storedHash;
}
import { db, users } from "@workspace/db";

const router = Router();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

// Create a new user
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      district,
      organizationName,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: "name, email, password and role are required",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const allowedRoles = [
      "citizen",
      "student",
      "industry",
      "government",
      "panchayat_ulb",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role",
      });
    }

    const id = randomUUID();
    const passwordHash = hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        id,
        name,
        email,
        phone: phone || null,
        role,
        district: district || null,
        passwordHash,
        organizationName: organizationName || null,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        district: users.district,
        organizationName: users.organizationName,
        verified: users.verified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

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
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        district: users.district,
        organizationName: users.organizationName,
        verified: users.verified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    return res.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

export default router;
