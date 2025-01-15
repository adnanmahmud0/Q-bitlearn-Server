const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());
//*******************************************************************************


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@adnan.f8a3c.mongodb.net/?retryWrites=true&w=majority&appName=adnan`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("edurock").collection("user");

    const courses = client.db("edurock").collection("classes");

    const teacher = client.db("edurock").collection("teacher");

    app.post('/user', async (req, res) => {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result);
    })

    app.get('/classes', async (req, res) => {
        const result = await courses.find().toArray();
        res.send(result);
    });

    app.get('/class/:id', async (req, res) => {

        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await courses.findOne(query);
        res.send(result);
    });

    app.post('/teacher', async (req, res) => {
        const item = req.body;
        const result = await teacher.insertOne(item);
        res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// ******************************************************************************

app.get('/', (req, res) => {
    res.send('edurock server is on')
})

app.listen(port, () => {
    console.log(`edurock is sitting on port ${port}`);
})