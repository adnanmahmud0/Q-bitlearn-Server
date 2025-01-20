const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
    // await client.connect();

    const userCollection = client.db("edurock").collection("user");

    const courses = client.db("edurock").collection("classes");

    const teacher = client.db("edurock").collection("teacher");

    const payment = client.db("edurock").collection("payment");

    const rating = client.db("edurock").collection("rating");

    const assignment = client.db("edurock").collection("assignment");

    const submitedAssingment = client.db("edurock").collection("submitedAssingment");

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'Admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next()
    }

    const verifyTeacher = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isTeacher = user?.role === 'Teacher';
      if (!isTeacher) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next()
    }

    const verifyUser = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isUser = user?.role === 'User';
      if (!isUser) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next()
    }

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.get('/users', async (req, res) => {
      const { search, page = 1, limit = 10 } = req.query;
      console.log(search, page, limit);

      const query = {
        email: {
          $regex: search,
          $options: "i",
        },
      };

      const users = await userCollection
        .find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .toArray();

      const totalUsers = await userCollection.countDocuments(query);

      res.send({
        users,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: parseInt(page),
      });
    });


    app.get('/user', async (req, res) => {
      // Assuming email is passed via query string, e.g., /user?email=example@gmail.com
      const email = req.query.email;
      // Find a single user by email
      const user = await userCollection.findOne({ email: email });
      // Send only the role
      res.send(user.role);
    });

    app.get('/numberUsers', async (req, res) => {
      try {
        const result = await userCollection.countDocuments();
        res.status(200).send({ count: result });
      } catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).send({ error: 'Failed to fetch user count' });
      }
    });
    app.get('/numberClasses', async (req, res) => {
      try {
        const result = await courses.countDocuments();
        res.status(200).send({ count: result });
      } catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).send({ error: 'Failed to fetch user count' });
      }
    });

    app.get('/numberEnroll', async (req, res) => {
      try {
        const result = await payment.countDocuments();
        res.status(200).send({ count: result });
      } catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).send({ error: 'Failed to fetch user count' });
      }
    });

    app.get('/numberTeacher', async (req, res) => {
      try {
        const result = await teacher.countDocuments();
        res.status(200).send({ count: result });
      } catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).send({ error: 'Failed to fetch user count' });
      }
    });



    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.params.email) {
        return res.status(403).send({ message: 'unauthorize access' })
      }
      console.log(email)
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'Admin';
      }
      console.log(admin);
      res.send({ admin })
    })

    app.get('/users/teacher/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.params.email) {
        return res.status(403).send({ message: 'unauthorize access' })
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let teacher = false;
      if (user) {
        teacher = user?.role === 'Teacher';
      }
      res.send({ teacher })
    })

    app.get('/users/user/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const userDocument = await userCollection.findOne(query);
      const user = userDocument?.role === 'User';
      console.log(user);
      res.send({ user });
    });

    app.get('/user', verifyToken, async (req, res) => {
      const email = req.query.email; // Extract 'email' from the query parameters
      const query = { email };
      const existingUser = await userCollection.findOne(query);
      res.send(existingUser);
    })

    app.put('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;

      // Update user role in the database
      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );
      res.send(result);
    });

    app.put('/teacherUsers', verifyToken, verifyAdmin, async (req, res) => {
      const { email } = req.query; // Extract email from query parameters
      const { role } = req.body;  // Extract role from request body

      // Update user role in the database
      const result = await userCollection.updateOne(
        { email }, // Match by email
        { $set: { role } } // Update the role
      );
    });


    app.get('/classes', async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
        const skip = (page - 1) * limit; // Calculate the number of documents to skip
        const query = { "status": "approved" }; // Filter for approved classes
        const totalItems = await courses.countDocuments(query); // Get total number of approved classes
        const classes = await courses.find(query).skip(skip).limit(limit).toArray(); // Fetch paginated approved classes

        res.json({
          query: query,
          data: classes,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch classes" });
      }
    });



    app.get('/mostEnrollClasses', async (req, res) => {
      const result = await courses.find()
        .sort({ "totalEnrollment": -1 })  // Sort by totalEnrollment in descending order
        .limit(6)  // Limit to 6 records
        .toArray();
      res.send(result);
    });


    app.get('/adminClasses', verifyToken, verifyAdmin, async (req, res) => {
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = parseInt(req.query.limit) || 10; // Default limit
      const skip = (page - 1) * limit; // Calculate the documents to skip

      // Query to exclude rejected classes
      const query = { status: { $ne: "reject" } };

      // Sort by status: "pending" first, others next
      const sortCondition = {
        status: { $eq: "pending" } // Use MongoDB's `$eq` for sorting
      };

      const total = await courses.countDocuments(query); // Total number of documents excluding rejected ones
      const result = await courses
        .find(query)
        .sort({ status: -1 }) // Sort so "pending" comes first
        .skip(skip)
        .limit(limit)
        .toArray(); // Paginated data with sorting

      res.send({
        classes: result, // Paginated classes
        total, // Total number of classes
      });
    });

    app.get('/MyClasses', verifyToken, verifyTeacher, async (req, res) => {
      try {
        const { email } = req.query;
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
        const skip = (page - 1) * limit;

        // Adjusted query based on schema
        const query = { "teacher.email": email }; // Update to match your schema

        // Count total documents matching the query
        const total = await courses.countDocuments(query);

        // Fetch the paginated result
        const result = await courses
          .find(query)
          .sort({ status: -1 }) // Optional: Modify based on requirements
          .skip(skip)
          .limit(limit)
          .toArray();

        // Return paginated data
        res.send({
          classes: result, // Array of classes
          total,           // Total number of classes matching query
        });
      } catch (error) {
        console.error("Error fetching classes:", error.message);
        res.status(500).send({ error: "An error occurred while fetching classes." });
      }
    });


    app.delete('/deleteMyClasses/:id', verifyToken, verifyTeacher, async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const result = await courses.deleteOne(filter);
      res.send(result);
    });


    app.patch('/adminClasses/approve/:id', verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: { status: 'approved' } };
      const result = await courses.updateOne(filter, update);
      res.send(result);
    });

    app.patch('/adminClasses/disapprove/:id', verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: { status: 'reject' } };
      const result = await courses.updateOne(filter, update);
      res.send(result);
    });

    app.get('/class/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await courses.findOne(query);
      res.send(result);
    });

    app.put('/class/:id', verifyToken, verifyTeacher, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      // Create the query object to find the class by its ID
      const query = { _id: new ObjectId(id) };


      const result = await courses.updateOne(query, {
        $set: updatedData,
      });

      res.send({ message: 'Class updated successfully', data: updatedData });

    });

    app.patch('/class/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = await courses.findOne(filter);
      const enrol = data.totalEnrollment;
      const newEnrol = enrol + 1;
      const result = await courses.updateOne(
        filter,
        { $set: { totalEnrollment: newEnrol } }
      );
      res.send(result);
    })


    app.post('/class', verifyToken, verifyTeacher, async (req, res) => {
      const item = req.body;
      const result = await courses.insertOne(item);
      res.send(result);
    })

    app.post('/teacher', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await teacher.insertOne(item);
      res.send(result);
    });

    app.get('/teacher', verifyToken, verifyAdmin, async (req, res) => {
      const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10
  
      const skip = (page - 1) * limit;
      const teachers = await teacher.find().skip(skip).limit(parseInt(limit)).toArray();
      const totalTeachers = await teacher.countDocuments(); // Get the total number of teachers
  
      res.send({
          teachers,
          totalPages: Math.ceil(totalTeachers / limit), // Calculate the total pages
          currentPage: page
      });
  });
  

    app.patch('/teacher/approve/:id', verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: { status: 'Approved' } };
      const result = await teacher.updateOne(filter, update);
      res.send(result);
    });

    app.patch('/teacher/disapprove/:id', verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: { status: 'Reject' } };
      const result = await teacher.updateOne(filter, update);
      res.send(result);
    });

    app.get('/assignment/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const query = { "classId": id };
      const result = await assignment.find(query).toArray();
      res.send(result);
    });

    app.post('/assignment', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await assignment.insertOne(item);
      res.send(result);
    })

    app.delete('/assignment/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await assignment.deleteOne(filter);
      res.send(result);
    });

    app.put('/assignment/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedAssignment = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedAssignment,
      };
      const result = await assignment.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post('/submit-assignment', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await submitedAssingment.insertOne(item);
      res.send(result);
    })

    app.get('/total-submit-assignment/:id', async (req, res) => {
      const { id } = req.params;
      const query = { "courseId": id };
      // Get the count of submissions
      const count = await submitedAssingment.countDocuments(query);
      // Return only the count
      res.send({ count });
    });

    app.get('/total-submit-userAssignment/:id', async (req, res) => {
      const { id } = req.params;
      const query = { "assignmentId": id };
      // Get the count of submissions
      const count = await submitedAssingment.countDocuments(query);
      // Return only the count
      res.send({ count });
    });

    app.post('/payment', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await payment.insertOne(item);
      res.send(result);
    });

    app.get('/enrolled-class', verifyToken, verifyUser, async (req, res) => {
      const email = req.query.email;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const skip = (page - 1) * limit;
      const totalPayments = await payment.find({ email }).count();
      const paymentDataArray = await payment.find({ email }).skip(skip).limit(limit).toArray();
      const classIds = paymentDataArray.map(payment => payment.classId);
      const result = await courses.find({ _id: { $in: classIds.map(id => new ObjectId(id)) } }).toArray();

      res.send({
        data: result,
        totalPages: Math.ceil(totalPayments / limit),
        currentPage: page
      });
    });


    app.post('/rating', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await rating.insertOne(item);
      res.send(result);
    });

    app.get('/rating', async (req, res) => {
      const result = await rating.find().toArray();
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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