const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.imn2pwq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db("foodMelodies").collection("services");
        const reviewCollection = client.db("foodMelodies").collection("reviews");


        app.post('/jwt', (req, res) => {
            const user = req.body;
            //console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
        })

        app.get('/services', async (req, res) => {

            const limit = parseInt(req.query.limit);

            const query = {};

            let services = [];

            const options = {
                sort: { "createdAt": -1 },
            };

            const cursor = serviceCollection.find(query, options);

            if (limit) {
                services = await cursor.skip(0).limit(limit).toArray();
            } else {
                services = await cursor.toArray();
            }

            res.send(services);

        })

        app.post('/service', async (req, res) => {
            const data = req.body;

            let date = new Date().toISOString();
            let createdAt = new Date(date);
            let updatedAt = new Date(date);

            const service = { ...data, createdAt, updatedAt }
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        app.get('/service/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const details = await serviceCollection.findOne(query);

            const reviewQuery = { serviceId: id };
            const reviewOptions = {
                sort: { "createdAt": -1 },
            };
            const cursor = reviewCollection.find(reviewQuery, reviewOptions);
            const reviews = await cursor.toArray();
            res.send({ details, reviews });

        });

        app.post('/review', verifyToken, async (req, res) => {
            const data = req.body;

            let date = new Date().toISOString();
            let createdAt = new Date(date);
            let updatedAt = new Date(date);

            const review = { ...data, createdAt, updatedAt }

            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.get('/myReviews', verifyToken, async (req, res) => {
            const decoded = req.decoded;

            const email = req.query.email;

            if (decoded.email !== email) {
                res.status(403).send({ message: 'Unauthorized access' });
            }

            const query = {
                userEmail: email
            };
            const options = {
                sort: { "createdAt": -1 },
            };
            const cursor = reviewCollection.find(query, options);
            const reviews = await cursor.toArray();
            res.send(reviews);

        })

        app.get('/getReview/:id', async (req, res) => {
            const id = req.params.id;

            const query = {
                _id: ObjectId(id)
            };

            const review = await reviewCollection.findOne(query);

            res.send(review);

        })

        app.patch('/review/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedReview = req.body;
            const reviewDes = updatedReview.reviewDes;
            const ratings = updatedReview.ratings;

            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    reviewDes: reviewDes,
                    ratings: ratings
                }
            }
            const result = await reviewCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        app.delete('/review/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })

    } finally {
        //await client.close(); 
    }
}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('Food Melodies server is running');
})

app.listen(port, () => {
    console.log(`Food Melodies server running on ${port}`);
})