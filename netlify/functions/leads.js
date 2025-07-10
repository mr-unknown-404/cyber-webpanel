const { MongoClient, ObjectId } = require('mongodb');

let client;

async function getCollection() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
  }
  const db = client.db(process.env.DB_NAME);
  return db.collection(process.env.COLLECTION);
}

exports.handler = async (event) => {
  const leads = await getCollection();
  const id = event.path.split('/').pop();

  try {
    // ✅ GET: With pagination, filters, search
    if (event.httpMethod === 'GET') {
      const url = new URL(event.rawUrl || `http://localhost${event.path}?${event.queryStringParameters}`);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const city = url.searchParams.get('city');
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');

      const filters = {};

      if (city) filters.city = city;
      if (status) filters.status = status;
      if (search) {
        const srNoParsed = parseInt(search);
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { companyname: { $regex: search, $options: 'i' } },
          ...(isNaN(srNoParsed) ? [] : [{ SrNo: srNoParsed }])
        ];
      }

      const skip = (page - 1) * limit;
      const total = await leads.countDocuments(filters);
      const data = await leads.find(filters).skip(skip).limit(limit).toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({ total, data })
      };
    }

    // ✅ PUT: Update a lead by _id
    if (event.httpMethod === 'PUT') {
      const updated = JSON.parse(event.body);
      delete updated._id;
      await leads.updateOne({ _id: new ObjectId(id) }, { $set: updated });
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    // ✅ DELETE: Remove a lead by _id
    if (event.httpMethod === 'DELETE') {
      await leads.deleteOne({ _id: new ObjectId(id) });
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('Netlify function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
