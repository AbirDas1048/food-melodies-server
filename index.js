const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.imn2pwq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//     const collection = client.db("test").collection("devices");
//     // perform actions on the collection object
//     client.close();
// });

async function run() {
    try {
        const serviceCollection = client.db("foodMelodies").collection("services");
        const reviewCollection = client.db("foodMelodies").collection("reviews");
        //const d = new ISODate();
        // let date = new Date().toISOString();
        // let isoDate = new Date(date);
        // console.log(date, isoDate);

        app.get('/services', async (req, res) => {
            const limit = parseInt(req.query.limit);
            //const size = parseInt(req.query.size);
            //console.log(limit);
            const query = {};
            let services = [];
            const options = {
                // sort matched documents in descending order by rating
                sort: { "createdAt": -1 },
                // Include only the `title` and `imdb` fields in the returned document
                //projection: { _id: 0, title: 1, imdb: 1 },
            };
            const cursor = serviceCollection.find(query, options);
            if (limit) {
                services = await cursor.skip(0).limit(limit).toArray();
            } else {
                services = await cursor.toArray();
            }

            // const count = await productCollection.estimatedDocumentCount();
            res.send(services);

        })

        app.post('/service', async (req, res) => {
            const data = req.body;

            let date = new Date().toISOString();
            let createdAt = new Date(date);
            let updatedAt = new Date(date);

            const service = { ...data, createdAt, updatedAt }
            //console.log(service);
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        app.get('/service/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const details = await serviceCollection.findOne(query);

            const reviewQuery = {serviceId: id };
            const reviewOptions = {
                sort: { "createdAt": -1 },
            };
            //const reviewDetails = await serviceCollection.findOne(query);
            const cursor = reviewCollection.find(reviewQuery, reviewOptions);
            const reviews = await cursor.toArray();
            res.send({details, reviews});

        });

        app.post('/review', async (req, res) => {
            const data = req.body;

            //const ratings = parseFloat(data.ratings);

            let date = new Date().toISOString();
            let createdAt = new Date(date);
            let updatedAt = new Date(date);

            const review = { ...data, createdAt, updatedAt }
            //console.log(review);
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.get('/myReviews', async (req, res) => {
            const email = req.query.email;
            //const size = parseInt(req.query.size);
            //console.log(email);
            const query = {
                userEmail: email
            };
            const options = {
                // sort matched documents in descending order by rating
                sort: { "createdAt": -1 },
                // Include only the `title` and `imdb` fields in the returned document
                //projection: { _id: 0, title: 1, imdb: 1 },
            };
            const cursor = reviewCollection.find(query, options);
            const reviews = await cursor.toArray();
            res.send(reviews);

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