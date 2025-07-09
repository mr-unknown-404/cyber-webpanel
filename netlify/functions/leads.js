// netlify/functions/leads.js
const { MongoClient, ObjectId } = require('mongodb');

exports.handler = async function (event, context) {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();
  const leads = db.collection("leads");

  if (event.httpMethod === "GET") {
    const result = await leads.find({}).toArray();
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  }

  if (event.httpMethod === "PUT") {
    const id = event.path.split("/").pop();
    const body = JSON.parse(event.body);
    await leads.updateOne({ _id: new ObjectId(id) }, { $set: body });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (event.httpMethod === "DELETE") {
    const id = event.path.split("/").pop();
    await leads.deleteOne({ _id: new ObjectId(id) });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
