const express = require("express");
const app = express();
const cors = require("cors");
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

    app.post("/assignments", async (req, res) => {
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
    app.post("/submitted", async (req, res) => {
      const assignment = req.body;
      const result = await submittedCollection.insertOne(assignment);
      res.send(result);
    });

    app.get("/pending", async (req, res) => {
      const query = { status: { $eq: "pending" } };
      const result = await submittedCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/pending/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "examinee.email": email };
      const result = await submittedCollection.find(query).toArray();

      res.send(result);
    });

    app.put("/marked/:id", async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          obtainedMarks: item.obtainedMarks,
          feedBack: item.feedBack,
          status: item.status,
        },
      };

      const result = await submittedCollection.updateOne(query, updateDoc, options);
      res.send(result);
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
