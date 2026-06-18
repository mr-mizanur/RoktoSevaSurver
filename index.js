//import express from "express";
//import cors from "cors";
//import dotenv from "dotenv";
//import { MongoClient, ObjectId } from "mongodb";
//import { toNodeHandler } from "better-auth/node";
//import { betterAuth } from "better-auth";
//
//dotenv.config();
//
//process.env.BETTER_AUTH_URL = process.env.BETTER_SERVER || "http://localhost:5000";
//
//const app = express();
//const PORT = process.env.PORT || 5000;
//
//app.use(cors({
//    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
//    credentials: true
//}));
//app.use(express.json());
//
//if (!process.env.MONGODB_URI) {
//    console.error("MONGODB_URI is missing!");
//    process.exit(1);
//}
//
//const client = new MongoClient(process.env.MONGODB_URI);
//const db = client.db("roktoseva");
//
//export const auth = betterAuth({
//    database: { db: db, type: "mongodb" },
//    emailAndPassword: { enabled: true },
//   user: {
//    additionalFields: {
//        bloodGroup: { type: "string" },
//        district: { type: "string" },
//           upazila: { type: "string" },
//           role: { type: "string", defaultValue: "donor" },
//           status: { type: "string", defaultValue: "active" }
//        }
//    }
//});
//
//app.use("/api/auth", toNodeHandler(auth));
//
//app.get("/", (req, res) => {
//    res.json({
//        status: "online",
//    architecture: "Express + Better Auth + MongoDB",
//       message: "Welcome to RoktoSeva Backend Server!"
//    });
//});
//
//app.get("/api/user/profile", async (req, res) => {
//    try {
//        const session = await auth.api.getSession({ headers: req.headers });
//    if (!session || !session.user) {
//        return res.status(401).json({ success: false, message: "Unauthorized!" });
//    }
//        return res.json({ success: true, user: session.user });
//    } catch (error) {
//        return res.status(500).json({ success: false, message: "Internal Server Error" });
//}
//});
//
//app.post("/api/posts/blood-request", async (req, res) => {
//    try {
//        const { requesterEmail } = req.body;
//    if (!requesterEmail) {
//        return res.status(400).json({ success: false, message: "Requester email is mandatory!" });
//    }
//        const newRequest = { ...req.body, status: "pending", donorName: null, donorEmail: null, createdAt: new Date() };
//       const result = await db.collection("blood_requests").insertOne(newRequest);
//       return res.status(201).json({ success: true, message: "Request created!", requestId: result.insertedId });
//    } catch (error) {
//        return res.status(500).json({ success: false, message: "Database Error" });
//}
//});
//
//app.get("/api/donor/recent-requests", async (req, res) => {
//    try {
//        const data = await db.collection("blood_requests").find({}).sort({ createdAt: -1 }).limit(3).toArray();
//    res.json({ success: true, data });
//    } catch (error) {
//        res.status(500).json({ success: false, message: "Database Fetch Error" });
//}
//});
//
//app.get("/api/posts/all-requests/pending", async (req, res) => {
//    try {
//        const data = await db.collection("blood_requests").find({ status: "pending" }).sort({ createdAt: -1 }).toArray();
//    res.json({ success: true, count: data.length, data });
//    } catch (error) {
//        res.status(500).json({ success: false, message: "Database Error" });
//}
//});
//
//app.get("/api/donor/my-requests", async (req, res) => {
//    try {
//        const { email } = req.query;
//    if (!email) {
//        return res.status(400).json({ success: false, message: "Email parameter is required!" });
//    }
//        const data = await db.collection("blood_requests").find({ requesterEmail: email }).sort({ createdAt: -1 }).toArray();
//       res.json({ success: true, data });
//    } catch (error) {
//        res.status(500).json({ success: false, message: "Database Error" });
//}
//});
//
//app.patch("/api/posts/blood-request/:id/status", async (req, res) => {
//    try {
//        const { id } = req.params;
//    const { status, donorName, donorEmail } = req.body;
//       await db.collection("blood_requests").updateOne(
//        { _id: new ObjectId(id) },
//        { $set: { status, donorName: donorName || null, donorEmail: donorEmail || null } }
//        );
//        res.json({ success: true, message: "Status updated!" });
//    } catch (error) {
//        res.status(500).json({ success: false, message: "Update Error" });
//}
//});
//
//app.delete("/api/posts/blood-request/:id", async (req, res) => {
//    try {
//        const { id } = req.params;
//    await db.collection("blood_requests").deleteOne({ _id: new ObjectId(id) });
//       res.json({ success: true, message: "Request deleted!" });
//    } catch (error) {
//        res.status(500).json({ success: false, message: "Delete Error" });
//}
//});
//
//app.get("/api/admin/all-users", async (req, res) => {
//    try {
//        const data = await db.collection("user").find({}).toArray();
//       res.json({ success: true, count: data.length, data });
//    } catch (error) {
//    res.status(500).json({ success: false, message: "Database Error" });
//    }
//});
//
//app.patch("/api/admin/update-user/:id", async (req, res) => {
//    try {
//    const { id } = req.params;
//       const { role, status } = req.body;
//       await db.collection("user").updateOne({ _id: new ObjectId(id) }, { $set: { role, status } });
//       res.json({ success: true });
//    } catch (error) {
//    res.status(500).json({ success: false, message: "Update Error" });
//    }
//});
//
//app.get("/api/admin/all-requests", async (req, res) => {
//    try {
//    const data = await db.collection("blood_requests").find({}).toArray();
//       res.json({ success: true, data });
//    } catch (error) {
//    res.status(500).json({ success: false, message: "Database Error" });
//    }
//});
//
//app.patch("/api/admin/update-request-status/:id", async (req, res) => {
//    try {
//    const { id } = req.params;
//       const { status } = req.body;
//       await db.collection("blood_requests").updateOne({ _id: new ObjectId(id) }, { $set: { status } });
//       res.json({ success: true });
//    } catch (error) {
//    res.status(500).json({ success: false, message: "Update Error" });
//    }
//});
//
//app.delete("/api/admin/request/:id", async (req, res) => {
//    try {
//    const { id } = req.params;
//       await db.collection("blood_requests").deleteOne({ _id: new ObjectId(id) });
//       res.json({ success: true, message: "Request deleted!" });
//    } catch (error) {
//    res.status(500).json({ success: false, message: "Delete Error" });
//    }
//});
//
//app.put("/api/admin/request/:id", async (req, res) => {
//    try {
//    const { id } = req.params;
//       const updateData = { ...req.body };
//       delete updateData._id;
//       const result = await db.collection("blood_requests").updateOne({ _id: new ObjectId(id) }, { $set: updateData });
//       if (result.matchedCount === 0) {
//        return res.status(404).json({ success: false, message: "Request not found" });
//        }
//       res.json({ success: true, message: "Updated successfully" });
//    } catch (error) {
//    res.status(500).json({ success: false, message: error.message });
//    }
//});
//
//app.patch("/api/user/update/:id", async (req, res) => {
//    try {
//    const { id } = req.params;
//       const { name, bloodGroup, district, upazila } = req.body;
//       await db.collection("user").updateOne({ _id: new ObjectId(id) }, { $set: { name, bloodGroup, district, upazila } });
//       res.json({ success: true });
//    } catch (error) {
//    res.status(500).json({ success: false, message: "Update Error" });
//    }
//});
//
//app.get("/api/admin/stats", async (req, res) => {
//    try {
//    const totalUsers = await db.collection("user").countDocuments();
//       const totalRequests = await db.collection("blood_requests").countDocuments();
//       res.json({ success: true, stats: { totalUsers, totalRequests } });
//    } catch (error) {
//    res.status(500).json({ success: false, message: "Error fetching stats" });
//    }
//});
//
//app.listen(PORT, () => {
//    console.log(`Server running on port ${PORT}`);
//});
//
//
//// Vercel-এর জন্য এক্সপোর্ট করা
//export default app;


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import { toNodeHandler } from "better-auth/node";
import { betterAuth } from "better-auth";
import Stripe from "stripe";

// 🍃 Environment Variables লোড করা
dotenv.config();

// Better Auth-এর ইন্টারনাল লাইব্রেরির জন্য রুট ইউআরএল ম্যাপিং
process.env.BETTER_AUTH_URL = process.env.BETTER_SERVER || "http://localhost:5000";

const app = express();
const PORT = process.env.PORT || 5000;

// 🔒 CORS কনফিগারেশন
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// ==========================================
// 🍃 MONGODB CLIENT & BETTER AUTH SETUP
// ==========================================
if (!process.env.MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is missing!");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("roktoseva");

export const auth = betterAuth({
  database: {
      db: db,
      type: "mongodb"
  },
  emailAndPassword: {
      enabled: true
  },
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

// 🎯 BETTER AUTH MIDDLEWARE ROUTE
app.use("/api/auth", toNodeHandler(auth));

// ==========================================
// 🩸 CORE ROKTOSEVA ROUTE (PIN TEST)
// ==========================================
app.get("/", (req, res) => {
  res.json({
      status: "online",
      architecture: "Express + Better Auth + MongoDB",
      better_auth_url: process.env.BETTER_AUTH_URL,
      message: "Welcome to RoktoSeva Futuristic Backend Server!"
  });
});

// ==========================================
// 👤 GET LOGGED IN USER PROFILE
// ==========================================
app.get("/api/user/profile", async (req, res) => {
  try {
      const session = await auth.api.getSession({
          headers: req.headers
      });

      if (!session || !session.user) {
          return res.status(401).json({
              success: false,
              message: "Unauthorized! No active session found."
          });
      }

      return res.json({ success: true, user: session.user });
  } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ==========================================
// 👥 GET ALL USERS DATA (ADMIN)
// ==========================================
app.get("/api/admin/all-users", async (req, res) => {
  try {
      const usersCollection = db.collection("user");
      const allUsers = await usersCollection.find({}).toArray();

      return res.json({
          success: true,
          count: allUsers.length,
          data: allUsers
      });
  } catch (error) {
      console.error("Error fetching all users:", error);
      return res.status(500).json({ success: false, message: "Database Error" });
  }
});

// ==========================================
// 🩸 DONOR FEEDS & REQUESTS API ENDPOINTS
// ==========================================

// ১. নতুন ব্লাড রিকোয়েস্ট তৈরি (requesterEmail ট্র্যাকিং সহ ফিক্সড)
app.post("/api/posts/blood-request", async (req, res) => {
  try {
      const {
          patientName,
          bloodGroup,
          hospital,
          district,
          upazila,
          contactNumber,
          dateNeeded,
          donationTime,
          details,
          requesterEmail // 💡 ফ্রন্টএন্ড থেকে পাঠানো ইউজারের লাইভ ইমেইল
      } = req.body;

      if (!requesterEmail) {
          return res.status(400).json({ success: false, message: "Requester email is mandatory for tracking!" });
      }

      const bloodRequestCollection = db.collection("blood_requests");
    
      const newRequest = {
          patientName,
          bloodGroup,
          hospital,
          district,
          upazila,
          contactNumber,
          dateNeeded,
          donationTime,
          details,
          requesterEmail,
          status: "pending",
          donorName: null,
          donorEmail: null,
          createdAt: new Date()
      };

      const result = await bloodRequestCollection.insertOne(newRequest);
      return res.status(201).json({ success: true, message: "Donation request saved successfully!", requestId: result.insertedId });
  } catch (error) {
      console.error("Database Insert Error:", error);
      return res.status(500).json({ success: false, message: "Database Error" });
  }
});

// ২. সব ব্লাড রিকোয়েস্ট গেট করার রুট (লেটেস্ট ৩টি হোমপেজ/ফিডের জন্য)
app.get("/api/donor/recent-requests", async (req, res) => {
  try {
      const bloodRequestCollection = db.collection("blood_requests");
    
      const recentRequests = await bloodRequestCollection
          .find({})
          .sort({ createdAt: -1 })
          .limit(3)
          .toArray();

      return res.json({ success: true, data: recentRequests });
  } catch (error) {
      return res.status(500).json({ success: false, message: "Database Fetch Error" });
  }
});

// ৩. শুধুমাত্র পেন্ডিং রিকোয়েস্টগুলো খোঁজার এন্ডপয়েন্ট
app.get("/api/posts/all-requests/pending", async (req, res) => {
  try {
      const bloodRequestCollection = db.collection("blood_requests");
      const pendingRequests = await bloodRequestCollection
          .find({ status: "pending" })
          .sort({ createdAt: -1 })
          .toArray();

      return res.json({
          success: true,
          count: pendingRequests.length,
          data: pendingRequests
      });
  } catch (error) {
      console.error("Error fetching pending requests:", error);
      return res.status(500).json({ success: false, message: "Database Error" });
  }
});

// ৪. 👤 নির্দিষ্ট লগইন করা ইউজারের নিজের তৈরি করা সব ব্লাড রিকোয়েস্ট ফেচিং (FIXED)
app.get("/api/donor/my-requests", async (req, res) => {
  try {
      const { email } = req.query; // ফ্রন্টএন্ড থেকে কোয়েরি হিসেবে পাঠানো ইমেইল
    
      if (!email) {
          return res.status(400).json({ success: false, message: "Email parameter is required to identify nodes." });
      }

      const bloodRequestCollection = db.collection("blood_requests");
    
      // requesterEmail ফিল্ডের সাথে ম্যাচ করে ওনারশিপ ভেরিফাই করা হচ্ছে
      const myRequests = await bloodRequestCollection
          .find({ requesterEmail: email })
          .sort({ createdAt: -1 })
          .toArray();

      return res.json({ success: true, data: myRequests });
  } catch (error) {
      console.error("Error fetching user requests:", error);
      return res.status(500).json({ success: false, message: "Database Error" });
  }
});

// ৫. ডোনারের মাধ্যমে স্ট্যাটাস এবং ডোনার ম্যাট্রিক্স আপডেট রুট
app.patch("/api/posts/blood-request/:id/status", async (req, res) => {
  try {
      const { id } = req.params;
      const { status, donorName, donorEmail } = req.body;
      const bloodRequestCollection = db.collection("blood_requests");
    
      await bloodRequestCollection.updateOne(
          { _id: new ObjectId(id) },
          {
              $set: {
                  status: status,
                  donorName: donorName || null,
                  donorEmail: donorEmail || null
              }
          }
      );

      return res.json({ success: true, message: "Status & Donor profile successfully locked into grid!" });
  } catch (error) {
      return res.status(500).json({ success: false, message: "Update Error" });
  }
});

// ৬. রিকোয়েস্ট ডিলিট করার রুট
app.delete("/api/posts/blood-request/:id", async (req, res) => {
  try {
      const { id } = req.params;
      const bloodRequestCollection = db.collection("blood_requests");

      await bloodRequestCollection.deleteOne({ _id: new ObjectId(id) });
      return res.json({ success: true, message: "Request deleted successfully from core database!" });
  } catch (error) {
      return res.status(500).json({ success: false, message: "Delete Error" });
  }
});


// ১. রিকোয়েস্ট ক্রিয়েট রুট (requesterEmail সহ)
app.post("/api/posts/blood-request", async (req, res) => {
  try {
      const { patientName, bloodGroup, hospital, district, upazila, contactNumber, dateNeeded, donationTime, details, requesterEmail } = req.body;
      const result = await db.collection("blood_requests").insertOne({
          patientName, bloodGroup, hospital, district, upazila, contactNumber, dateNeeded, donationTime, details,
          requesterEmail, // ডাটাবেজে ওনারশিপ ট্র্যাক করার জন্য
          status: "pending",
          createdAt: new Date()
      });
      res.status(201).json({ success: true, message: "Request created!" });
  } catch (error) { res.status(500).json({ success: false, message: "Error" }); }
});

// ২. মাই রিকোয়েস্ট ফেচ রুট (নির্দিষ্ট ইমেইলের রিকোয়েস্ট)
app.get("/api/donor/my-requests", async (req, res) => {
  try {
      const { email } = req.query;
      const myRequests = await db.collection("blood_requests")
          .find({ requesterEmail: email })
          .sort({ createdAt: -1 })
          .toArray();
      res.json({ success: true, data: myRequests });
  } catch (error) { res.status(500).json({ success: false, message: "Error" }); }
});

app.get("/api/admin/stats", async (req, res) => {
   try {
       const totalUsers = await db.collection("user").countDocuments();
       const totalRequests = await db.collection("blood_requests").countDocuments();
       // ফান্ডিং এর জন্য কালেকশন নাম 'funds' হলে এটি ব্যবহার করুন
       const totalFunding = await db.collection("funds").aggregate([
           { $group: { _id: null, total: { $sum: "$amount" } } }
       ]).toArray();

       res.json({
           success: true,
           stats: {
               totalUsers,
               totalRequests,
               totalFunding: totalFunding[0]?.total || 0
           }
       });
   } catch (error) {
       res.status(500).json({ success: false, message: "Error fetching stats" });
   }
});



// ১. সব ইউজার গেট করা
app.get("/api/admin/all-users", async (req, res) => {
   const users = await db.collection("user").find({}).toArray();
   res.json({ success: true, data: users });
});

// ২. ইউজার আপডেট করা (Role বা Status)
app.patch("/api/admin/update-user/:id", async (req, res) => {
   const { id } = req.params;
   const { role, status } = req.body;
   await db.collection("user").updateOne(
       { _id: new ObjectId(id) },
       { $set: { role, status } }
   );
   res.json({ success: true });
});




// সব রিকোয়েস্ট দেখা (অ্যাডমিন এবং ভলান্টিয়ার উভয়ের জন্য)
app.get("/api/admin/all-requests", async (req, res) => {
   const requests = await db.collection("blood_requests").find({}).toArray();
   res.json({ success: true, data: requests });
});

// রিকোয়েস্টের স্ট্যাটাস আপডেট করা (ভলান্টিয়ারদের জন্য)
app.patch("/api/admin/update-request-status/:id", async (req, res) => {
   const { id } = req.params;
   const { status } = req.body;
   await db.collection("blood_requests").updateOne(
       { _id: new ObjectId(id) },
       { $set: { status } }
   );
   res.json({ success: true });
});


// অ্যাডমিন রিকোয়েস্ট ডিলিট করতে পারবে
app.delete("/api/admin/request/:id", async (req, res) => {
   const { id } = req.params;
   await db.collection("blood_requests").deleteOne({ _id: new ObjectId(id) });
   res.json({ success: true, message: "Request deleted successfully" });
});



app.patch("/api/user/update/:id", async (req, res) => {
   const { id } = req.params;
   const { name, bloodGroup, district, upazila } = req.body;
   await db.collection("user").updateOne(
       { _id: new ObjectId(id) },
       { $set: { name, bloodGroup, district, upazila } }
   );
   res.json({ success: true });
});





app.put("/api/admin/request/:id", async (req, res) => {
   const { id } = req.params;
   const updateData = req.body;

   // ১. আপডেট ডেটা থেকে _id থাকলে সেটি সরিয়ে দিন
   delete updateData._id;

   try {
       const result = await db.collection("blood_requests").updateOne(
           { _id: new ObjectId(id) },
           { $set: updateData }
       );
      
       if (result.matchedCount === 0) {
           return res.status(404).json({ success: false, message: "Request not found" });
       }
      
       res.json({ success: true, message: "Updated successfully" });
   } catch (error) {
       res.status(500).json({ success: false, message: error.message });
   }
});









// ==========================================
// 🚀 SERVER LISTENING
// ==========================================
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`ROKTOSEVA EXPRESS SERVER CORE IS LIVE!`);
  console.log(`Running on: http://localhost:${PORT}`);
  console.log(`===================================================`);
})






export default app;