import "dotenv/config"; // Cleaner dotenv usage
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

// ✅ Verify environment variables
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nao";

if (!uri) {
  console.error("❌ MONGODB_URI is not defined in your .env.local");
  process.exit(1);
}

const usersFile = path.join(process.cwd(), "users.json");

async function migrate() {
  try {
    // ✅ Check if users.json exists
    if (!fs.existsSync(usersFile)) {
      throw new Error("❌ users.json not found in project root.");
    }

    const raw = fs.readFileSync(usersFile, "utf8");
    const users = JSON.parse(raw);

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    const userDocs = Array.isArray(users) ? users : Object.values(users);
    if (userDocs.length === 0) {
      throw new Error("❌ No user records found in users.json.");
    }

    const result = await db.collection("users").insertMany(userDocs as any[]);
    console.log(`✅ Migrated ${result.insertedCount} users into '${dbName}.users'`);
    await client.close();
  } catch (error) {
    console.error("🚨 Migration failed:", error);
    process.exit(1);
  }
}

migrate();
