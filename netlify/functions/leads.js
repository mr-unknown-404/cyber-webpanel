const { MongoClient, ObjectId } = require('mongodb');

let client;
async function getCollections() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
  }
  const db = client.db(process.env.DB_NAME);
  return db.collection(process.env.COLLECTION);
}

exports.handler = async (event) => {
  const leads = await getCollections();

  const id = event.path.split('/').pop();

  try {
    if (event.httpMethod === 'GET') {
      const all = await leads.find().toArray();
      return { statusCode: 200, body: JSON.stringify(all) };
    }

    if (event.httpMethod === 'PUT') {
      const updated = JSON.parse(event.body);
      delete updated._id;
      await leads.updateOne({ _id: new ObjectId(id) }, { $set: updated });
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (event.httpMethod === 'DELETE') {
      await leads.deleteOne({ _id: new ObjectId(id) });
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
