require("dotenv").config({ path: ".env.local" });

import { MongoClient } from "mongodb";
const fs = require("fs");
const path = require("path");

// Debug: Print loaded env variables
console.log("Loaded MONGODB_URI:", process.env.MONGODB_URI);
console.log("Loaded MONGODB_DB:", process.env.MONGODB_DB);

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set in environment variables");
const dbName = process.env.MONGODB_DB || "nao";
const usersFile = path.join(process.cwd(), "users.json");

async function migrate() {
  if (!fs.existsSync(usersFile)) throw new Error("users.json not found");
  const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const userDocs = Array.isArray(users) ? users : Object.values(users);
  if (!userDocs.length) throw new Error("No users to migrate.");
  await db.collection("users").insertMany(userDocs as any[]);
  console.log(`Migrated ${userDocs.length} users.`);
  await client.close();
}
migrate().catch(e => {
  console.error(e);
  process.exit(1);
});