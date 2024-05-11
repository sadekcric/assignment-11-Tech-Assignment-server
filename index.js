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

    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);

      res.send(result);
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`Server is Running.`);
});

app.listen(port, () => {
  console.log(`The Port is Running on: ${port}`);
});
