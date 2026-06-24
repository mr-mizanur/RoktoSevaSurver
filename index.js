import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import { toNodeHandler } from "better-auth/node";
import { betterAuth } from "better-auth";
import Stripe from "stripe";
dotenv.config();
process.env.BETTER_AUTH_URL = process.env.BETTER_SERVER || "http://localhost:5000";
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
 origin: ["http://localhost:3000", "https://rokto-seva.vercel.app"],
 credentials: true
}));
app.use(express.json());

if (!process.env.MONGODB_URI) {
 console.error(" Error: MONGODB_URI is missing!");
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

app.use("/api/auth", toNodeHandler(auth));

app.get("/", (req, res) => {
 res.json({
     status: "online",
     architecture: "Express + Better Auth + MongoDB",
     better_auth_url: process.env.BETTER_AUTH_URL,
     message: "Welcome to RoktoSeva Futuristic Backend Server!"
 });
});

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
         requesterEmail
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

app.get("/api/donor/my-requests", async (req, res) => {
 try {
     const { email } = req.query;
  
     if (!email) {
         return res.status(400).json({ success: false, message: "Email parameter is required to identify nodes." });
     }

     const bloodRequestCollection = db.collection("blood_requests");
  
   
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

//app.patch("/api/posts/blood-request/:id/status", async (req, res) => {
// try {
//     const { id } = req.params;
//     const { status, donorName, donorEmail } = req.body;
//     const bloodRequestCollection = db.collection("blood_requests");
//  
//     
//     const result = await bloodRequestCollection.updateOne(
//         { _id: id }, 
//         {
//             $set: {
//                 status: status,
//                 donorName: donorName || null,
//                 donorEmail: donorEmail || null
//             }
//         }
//     );
//
//     if (result.matchedCount === 0) {
//         return res.status(404).json({ success: false, message: "Request ID not found!" });
//     }
//
//     return res.json({ success: true, message: "Success!" });
// } catch (error) {
//     return res.status(500).json({ success: false, message: "Update Error" });
// }
//});

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


app.get("/api/admin/stats", async (req, res) => {
  try {
      const totalUsers = await db.collection("user").countDocuments();
      const totalRequests = await db.collection("blood_requests").countDocuments();
    
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

app.get("/api/admin/all-users", async (req, res) => {
  const users = await db.collection("user").find({}).toArray();
  res.json({ success: true, data: users });
});

app.patch("/api/admin/update-user/:id", async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;
  await db.collection("user").updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, status } }
  );
  res.json({ success: true });
});

app.get("/api/admin/all-requests", async (req, res) => {
  const requests = await db.collection("blood_requests").find({}).toArray();
  res.json({ success: true, data: requests });
});

app.patch("/api/admin/update-request-status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await db.collection("blood_requests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
  );
  res.json({ success: true });
});

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


app.get("/api/donor/recent-requests", async (req, res) => {
   try {
       const { email } = req.query;
       const data = await db.collection("blood_requests")
           .find({ requesterEmail: email })
           .sort({ createdAt: -1 })
           .limit(3)
           .toArray();
       res.json({ success: true, data });
   } catch (error) {
       res.status(500).json({ success: false, message: "Database Fetch Error" });
   }
});

app.get("/api/donors/search", async (req, res) => {
    try {
        const { bloodGroup, district, upazila } = req.query;
        let query = { status: "active" }; 

        if (bloodGroup) query.bloodGroup = bloodGroup;
       
        if (district) query.district = { $regex: new RegExp(district, "i") };
        if (upazila) query.upazila = { $regex: new RegExp(upazila, "i") };

        const donors = await db.collection("user").find(query).toArray();
        res.json({ success: true, data: donors });
    } catch (error) {
        res.status(500).json({ success: false, message: "Search Error" });
    }
});


app.get("/api/donor/my-donations", async (req, res) => {
 try {
     const { email } = req.query;
     if (!email) return res.status(400).json({ success: false, message: "Email required" });

     const bloodRequestCollection = db.collection("blood_requests");
  
     
     const myDonations = await bloodRequestCollection
         .find({ donorEmail: email })
         .sort({ createdAt: -1 })
         .toArray();

     return res.json({ success: true, data: myDonations });
 } catch (error) {
     return res.status(500).json({ success: false, message: "Database Fetch Error" });
 }
});




// ১. PATCH রাউট (স্ট্যাটাস আপডেটের জন্য)
app.patch("/api/posts/blood-request/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, donorName, donorEmail } = req.body;
    
    // এখানে new ObjectId(id) ব্যবহার করা বাধ্যতামূলক
    const result = await db.collection("blood_requests").updateOne(
      { _id: new ObjectId(id) }, 
      {
        $set: {
          status: status,
          donorName: donorName || null,
          donorEmail: donorEmail || null
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Request ID not found!" });
    }

    return res.json({ success: true, message: "Success!" });
  } catch (error) {
    console.error("Patch Error:", error);
    return res.status(500).json({ success: false, message: "Update Error" });
  }
});

// ২. GET রাউট (ডিটেইলস দেখার জন্য)
app.get("/api/posts/blood-request/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // এখানেও new ObjectId(id) ব্যবহার করা বাধ্যতামূলক
    const request = await db.collection("blood_requests").findOne({ _id: new ObjectId(id) });

    if (!request) {
      return res.status(404).json({ success: false, message: "Request ID not found!" });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




app.get("/api/stats", async (req, res) => {
  try {
    const db = client.db("roktoseva"); 
    
    const donors = await db.collection("user").countDocuments({ role: "donor" });
    const successfulDonations = await db.collection("blood_requests").countDocuments({ status: "done" });
    const pendingRequests = await db.collection("blood_requests").countDocuments({ status: "pending" });

    res.json({
      success: true,
      data: {
        activeDonors: donors, 
        livesImpacted: successfulDonations,
        pendingRequests: pendingRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading stats" });
  }
});





app.get("/api/all-donations", async (req, res) => {
  try {
  
    const fundsCollection = db.collection("funds");
   
   
    const allDonations = await fundsCollection.find({}).sort({ _id: -1 }).toArray();
    
  
    const formattedData = allDonations.map(d => ({
        
        userEmail: d.userEmail || "Anonymous",
       
        amount: d.amount ? parseInt(d.amount) : 0
    }));

   
    res.json({ 
        success: true, 
        count: formattedData.length,
        data: formattedData 
    });
  } catch (error) {
  
    console.error("Error fetching donations:", error);
    res.status(500).json({ 
        success: false, 
        message: "Error fetching donations from database" 
    });
  }
});












app.listen(PORT, () => {
 console.log(`===================================================`);
 console.log(`ROKTOSEVA EXPRESS SERVER CORE IS LIVE!`);
 console.log(`Running on: http://localhost:${PORT}`);
 console.log(`===================================================`);

})


export default app;