import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import { toNodeHandler } from "better-auth/node";
import { betterAuth } from "better-auth";

dotenv.config();

process.env.BETTER_AUTH_URL = process.env.BETTER_SERVER || "http://localhost:5000";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
   origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
   credentials: true
}));
app.use(express.json());

if (!process.env.MONGODB_URI) {
   console.error("MONGODB_URI is missing!");
   process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("roktoseva");

export const auth = betterAuth({
   database: { db: db, type: "mongodb" },
   emailAndPassword: { enabled: true },
   user: {
       additionalFields: {
           bloodGroup: { type: "string" },
           district: { type: "string" },
           upazila: { type: "string" },
           role: { type: "string", defaultValue: "donor" },
           status: { type: "string", defaultValue: "active" }
       }
   }
});

app.use("/api/auth", toNodeHandler(auth));

app.get("/", (req, res) => {
   res.json({
       status: "online",
       architecture: "Express + Better Auth + MongoDB",
       message: "Welcome to RoktoSeva Backend Server!"
   });
});

app.get("/api/user/profile", async (req, res) => {
   try {
       const session = await auth.api.getSession({ headers: req.headers });
       if (!session || !session.user) {
           return res.status(401).json({ success: false, message: "Unauthorized!" });
       }
       return res.json({ success: true, user: session.user });
   } catch (error) {
       return res.status(500).json({ success: false, message: "Internal Server Error" });
   }
});

app.post("/api/posts/blood-request", async (req, res) => {
   try {
       const { requesterEmail } = req.body;
       if (!requesterEmail) {
           return res.status(400).json({ success: false, message: "Requester email is mandatory!" });
       }
       const newRequest = { ...req.body, status: "pending", donorName: null, donorEmail: null, createdAt: new Date() };
       const result = await db.collection("blood_requests").insertOne(newRequest);
       return res.status(201).json({ success: true, message: "Request created!", requestId: result.insertedId });
   } catch (error) {
       return res.status(500).json({ success: false, message: "Database Error" });
   }
});

app.get("/api/donor/recent-requests", async (req, res) => {
   try {
       const data = await db.collection("blood_requests").find({}).sort({ createdAt: -1 }).limit(3).toArray();
       res.json({ success: true, data });
   } catch (error) {
       res.status(500).json({ success: false, message: "Database Fetch Error" });
   }
});

app.get("/api/posts/all-requests/pending", async (req, res) => {
   try {
       const data = await db.collection("blood_requests").find({ status: "pending" }).sort({ createdAt: -1 }).toArray();
       res.json({ success: true, count: data.length, data });
   } catch (error) {
       res.status(500).json({ success: false, message: "Database Error" });
   }
});

app.get("/api/donor/my-requests", async (req, res) => {
   try {
       const { email } = req.query;
       if (!email) {
           return res.status(400).json({ success: false, message: "Email parameter is required!" });
       }
       const data = await db.collection("blood_requests").find({ requesterEmail: email }).sort({ createdAt: -1 }).toArray();
       res.json({ success: true, data });
   } catch (error) {
       res.status(500).json({ success: false, message: "Database Error" });
   }
});

app.patch("/api/posts/blood-request/:id/status", async (req, res) => {
   try {
       const { id } = req.params;
       const { status, donorName, donorEmail } = req.body;
       await db.collection("blood_requests").updateOne(
           { _id: new ObjectId(id) },
           { $set: { status, donorName: donorName || null, donorEmail: donorEmail || null } }
       );
       res.json({ success: true, message: "Status updated!" });
   } catch (error) {
       res.status(500).json({ success: false, message: "Update Error" });
   }
});

app.delete("/api/posts/blood-request/:id", async (req, res) => {
   try {
       const { id } = req.params;
       await db.collection("blood_requests").deleteOne({ _id: new ObjectId(id) });
       res.json({ success: true, message: "Request deleted!" });
   } catch (error) {
       res.status(500).json({ success: false, message: "Delete Error" });
   }
});

app.get("/api/admin/all-users", async (req, res) => {
   try {
       const data = await db.collection("user").find({}).toArray();
       res.json({ success: true, count: data.length, data });
   } catch (error) {
       res.status(500).json({ success: false, message: "Database Error" });
   }
});

app.patch("/api/admin/update-user/:id", async (req, res) => {
   try {
       const { id } = req.params;
       const { role, status } = req.body;
       await db.collection("user").updateOne({ _id: new ObjectId(id) }, { $set: { role, status } });
       res.json({ success: true });
   } catch (error) {
       res.status(500).json({ success: false, message: "Update Error" });
   }
});

app.get("/api/admin/all-requests", async (req, res) => {
   try {
       const data = await db.collection("blood_requests").find({}).toArray();
       res.json({ success: true, data });
   } catch (error) {
       res.status(500).json({ success: false, message: "Database Error" });
   }
});

app.patch("/api/admin/update-request-status/:id", async (req, res) => {
   try {
       const { id } = req.params;
       const { status } = req.body;
       await db.collection("blood_requests").updateOne({ _id: new ObjectId(id) }, { $set: { status } });
       res.json({ success: true });
   } catch (error) {
       res.status(500).json({ success: false, message: "Update Error" });
   }
});

app.delete("/api/admin/request/:id", async (req, res) => {
   try {
       const { id } = req.params;
       await db.collection("blood_requests").deleteOne({ _id: new ObjectId(id) });
       res.json({ success: true, message: "Request deleted!" });
   } catch (error) {
       res.status(500).json({ success: false, message: "Delete Error" });
   }
});

app.put("/api/admin/request/:id", async (req, res) => {
   try {
       const { id } = req.params;
       const updateData = { ...req.body };
       delete updateData._id;
       const result = await db.collection("blood_requests").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
       if (result.matchedCount === 0) {
           return res.status(404).json({ success: false, message: "Request not found" });
       }
       res.json({ success: true, message: "Updated successfully" });
   } catch (error) {
       res.status(500).json({ success: false, message: error.message });
   }
});

app.patch("/api/user/update/:id", async (req, res) => {
   try {
       const { id } = req.params;
       const { name, bloodGroup, district, upazila } = req.body;
       await db.collection("user").updateOne({ _id: new ObjectId(id) }, { $set: { name, bloodGroup, district, upazila } });
       res.json({ success: true });
   } catch (error) {
       res.status(500).json({ success: false, message: "Update Error" });
   }
});

app.get("/api/admin/stats", async (req, res) => {
   try {
       const totalUsers = await db.collection("user").countDocuments();
       const totalRequests = await db.collection("blood_requests").countDocuments();
       res.json({ success: true, stats: { totalUsers, totalRequests } });
   } catch (error) {
       res.status(500).json({ success: false, message: "Error fetching stats" });
   }
});

app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});


// Vercel-এর জন্য এক্সপোর্ট করা
export default app;