require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = process.env.DBURI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


dbName = "Account"
collectionName = "Users"

async function addUser(user) {
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        const existingUser = await collection.findOne({ email: user.email });
        if (existingUser) {
            console.log("Email is already used.");
            return;
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;

        const result = await collection.insertOne(user);
        console.log(`New user inserted with _id: ${result.insertedId}`);
    } finally {
        await client.close();
    }
}

async function accessUser(email, password) {
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        const user = await collection.findOne({ email });
        if (!user) {
            console.log("No user found with the provided email.");
            return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            console.log("User authenticated successfully.");
            return user;
        } else {
            console.log("Incorrect password.");
            return null;
        }
    } finally {
        await client.close();
    }
}

async function checkEmailExists(email) {
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        const existingUser = await collection.findOne({ email });
        return existingUser ? true : false;
    } finally {
        await client.close();
    }
}



module.exports = {
    addUser,
    accessUser,
    checkEmailExists
};