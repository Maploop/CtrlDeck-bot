const { MognoClient, ServerApiVersion, MongoClient } = require("mongodb");
const { mongo_uri } = require("./config.json");

// WARNING: I moved the MongoDB uri to the config.json file.
var selectedCollection = "none";
const client = new MongoClient(mongo_uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const testConnection = async () => {
  try {
    await client.connect();

    await client.db("abigboi_bot").command({ ping: 1 });
    console.log("-> CONNECTED TO MONGODB (PING: OK)");
  } finally {
    await client.close();
  }
};

class MongoDocHandle {
  constructor(collection, docId) {
    this.collection = collection;
    this.docId = docId;
  }

  async getDocument() {
    try {
      await client.connect();
      const database = client.db("abigboi_bot");
      const col = database.collection(this.collection);

      const query = { id: this.docId };
      const options = {};

      const found = await col.findOne(query, options);
      return found;
    } finally {
      await client.close();
    }
  }

  async grab_all() {
    try {
      await client.connect();
      const db = client.db("abigboi_bot");
      const col = db.collection(this.collection);

      const result = await col.find().toArray();
      console.log(
        `-> ${result.length} document(s) found in collection ${this.collection}.`,
      );
      return result;
    } finally {
      await client.close();
    }
  }

  async insertIFNotExists() {
    const res = await this.getDocument();
    if (!res) {
      console.log(`-> Inserting new document with ID ${this.docId}`);
      const database = client.db("abigboi_bot");
      const col = database.collection(this.collection);

      const doc = { id: this.docId };
      const result = await col.insertOne(doc);

      console.log(`-> DONE (docId: ${this.docId})`);
    } else {
      console.log(
        `-> Document with ID ${this.docId} already exists no changes were made.`,
      );
    }
  }

  async set(key, value) {
    try {
      const db = client.db("abigboi_bot");
      const col = db.collection(this.collection);

      const filter = { id: this.docId };
      const opt = { upsert: true };

      const updateDoc = {
        $set: {
          [key]: value,
        },
      };

      const result = await col.updateOne(filter, updateDoc, opt);
      console.log(`-> ${result.modifiedCount} document(s) updated.`);
    } finally {
      await client.close();
    }
  }

  async bulkSet(valueObject) {
    try {
      const db = client.db("abigboi_bot");
      const col = db.collection(this.collection);

      const filter = { id: this.docId };
      const opt = { upsert: true };

      const result = await col.updateOne(filter, { $set: valueObject }, opt);
      console.log(`-> ${result.modifiedCount} document(s) updated.`);
    } finally {
      await client.close();
    }
  }

  async get(key) {
    try {
      const database = client.db("abigboi_bot");
      const col = database.collection(this.collection);

      const query = { id: this.docId };
      const options = {};

      const found = await col.findOne(query, options);
      return found[key];
    } finally {
      client.close();
    }
  }
}

module.exports = {
  client,
  testConnection,
  MongoDocHandle,
};
