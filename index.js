const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.user_Name}:${process.env.user_Password}@travel-bangla-cluster-0.xlzl5.mongodb.net/?retryWrites=true&w=majority&appName=travel-bangla-cluster-0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB!");

        const database = client.db("travelBangla");
        const travelDetails = database.collection("travelDetails");

        // Get all travlPost details
        app.get('/travelPostDetails',async (req, res) => {
            const cursor = await travelDetails.find().toArray();
            res.send(cursor)

        })


        // API to insert travel post with expiry time
        app.post('/travelpostadd', async (req, res) => {
            const { expirySeconds, ...traveldetails } = req.body;

            const document = {
                ...traveldetails,
                createdAt: new Date(),
                deleteAt: new Date(Date.now() + expirySeconds * 1000)
            };

            console.log("Travel Post:", document);
            const result = await travelDetails.insertOne(document);
            res.send(result);
        });

        // Function to delete expired documents every minute
        async function deleteExpiredDocuments() {
            try {
                const now = new Date();
                const result = await travelDetails.deleteMany({ deleteAt: { $lte: now } });

                if (result.deletedCount > 0) {
                    console.log(`Deleted ${result.deletedCount} expired travel posts.`);
                }
            } catch (error) {
                console.error("Error deleting expired documents:", error);
            }
        }

        // Run the cleanup job every minute
        setInterval(deleteExpiredDocuments, 60000);

    } finally {
        // Keep connection open
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Travel-Bangla is running!');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
