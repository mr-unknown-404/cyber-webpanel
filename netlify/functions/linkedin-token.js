const { MongoClient } = require('mongodb');

let client;
async function getSettingsCollection() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
  }
  const db = client.db(process.env.DB_NAME);
  return db.collection('generalSettings');
}

exports.handler = async (event) => {
  const settings = await getSettingsCollection();

  try {
    if (event.httpMethod === 'GET') {
      const doc = await settings.findOne({});
      return {
        statusCode: 200,
        body: JSON.stringify({ linkedinToken: doc?.linkedinToken || '' }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { linkedinToken } = JSON.parse(event.body);
      if (!linkedinToken) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing token' }) };
      }

      const existing = await settings.findOne({});
      if (existing) {
        await settings.updateOne({ _id: existing._id }, { $set: { linkedinToken } });
      } else {
        await settings.insertOne({ linkedinToken });
      }

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
