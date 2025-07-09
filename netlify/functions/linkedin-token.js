// netlify/functions/linkedin-token.js
const { MongoClient } = require('mongodb');

exports.handler = async function (event, context) {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();
  const settings = db.collection("settings");

  if (event.httpMethod === "GET") {
    const token = await settings.findOne({ key: "linkedinToken" });
    return {
      statusCode: 200,
      body: JSON.stringify({ linkedinToken: token?.value || "" })
    };
  }

  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body);
    await settings.updateOne(
      { key: "linkedinToken" },
      { $set: { value: body.linkedinToken } },
      { upsert: true }
    );
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
