const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleWare
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://tech-assignment-131b7.web.app",
      "https://tech-assignment-131b7.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

const verifyUser = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send("unauthorized user");
  }

  jwt.verify(token, process.env.USER_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send("unauthorized user");
    }

    req.user = decoded;
    next();
  });
};

// mongodb stored

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ekltq6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const assignmentCollection = client.db("Tech-Assignment").collection("assignments");
    const submittedCollection = client.db("Tech-Assignment").collection("submitted");

    app.post("/assignments", verifyUser, async (req, res) => {
      if (req.user.email !== req.body.publisher.email) {
        return res.status(403).send("forbidden User");
      }

      const assignment = req.body;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });

    app.get("/assignments", async (req, res) => {
      const pages = parseInt(req.query.pages);
      const size = parseInt(req.query.size);
      const difficultyLevel = req.query.level;

      let query = {};
      if (difficultyLevel) query = { level: difficultyLevel };

      const result = await assignmentCollection
        .find(query)
        .skip(pages * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/count", async (req, res) => {
      const difficultyLevel = req.query.level;

      let query = {};
      if (difficultyLevel) query = { level: difficultyLevel };

      const totalItems = await assignmentCollection.countDocuments(query);

      res.send({ totalItems });
    });

    app.get("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);

      res.send(result);
    });

    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          description: item.description,
          dueDate: item.dueDate,
          level: item.level,
          marks: item.marks,
          thumbnail: item.thumbnail,
          title: item.title,
        },
      };

      const result = await assignmentCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);

      res.send(result);
    });

    /* ======================= for Submitted  Collection =====================*/
    app.post("/submitted", verifyUser, async (req, res) => {
      if (req.user.email !== req.body.examinee.email) {
        return res.status(403).send("forbidden User");
      }
      const assignment = req.body;
      const result = await submittedCollection.insertOne(assignment);
      res.send(result);
    });

    app.get("/pending", async (req, res) => {
      const query = { status: { $eq: "pending" } };
      const result = await submittedCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/pending/:email", verifyUser, async (req, res) => {
      if (req.user.email !== req.params.email) {
        return res.status(403).send("forbidden User");
      }

      const email = req.params.email;

      const query = { "examinee.email": email };
      const result = await submittedCollection.find(query).toArray();

      res.send(result);
    });

    app.put("/marked/:id", verifyUser, async (req, res) => {
      console.log(req.query.email);
      if (req.user.email !== req.body.examiner) {
        return res.status(403).send("forbidden User");
      }

      const id = req.params.id;
      const item = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          obtainedMarks: item.obtainedMarks,
          feedBack: item.feedBack,
          status: item.status,
          examiner: item.examiner,
          examinerName: item.examinerName,
        },
      };

      const result = await submittedCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    /*=================JWT ==================== */

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.USER_SECRET_KEY, { expiresIn: "1d" });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`Server is Running.`);
});

app.listen(port, () => {
  console.log(`The Port is Running on: ${port}`);
});
