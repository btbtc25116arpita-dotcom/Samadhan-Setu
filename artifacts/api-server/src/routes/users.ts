import { Router } from "express";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { db, users } from "@workspace/db";

const router = Router();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedPassword: string): boolean {
  const [salt, storedHash] = storedPassword.split(":");

  if (!salt || !storedHash) return false;

  const hash = scryptSync(password, salt, 64).toString("hex");

  return hash === storedHash;
}

// REGISTER
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
      "faculty",
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

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Email/mobile and password are required",
      });
    }

    const allUsers = await db
      .select()
      .from(users);

    const user = allUsers.find(
      (u) =>
        u.email.toLowerCase() === String(identifier).toLowerCase() ||
        u.phone === String(identifier)
    );

    if (!user) {
      return res.status(401).json({
        error: "Invalid email/mobile or password",
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        error: "This account does not have a password. Please register again.",
      });
    }

    const valid = verifyPassword(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid email/mobile or password",
      });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      district: user.district,
      organizationName: user.organizationName,
      verified: user.verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error logging in:", error);

    return res.status(500).json({
      error: "Failed to login",
    });
  }
});

// GET USERS
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
