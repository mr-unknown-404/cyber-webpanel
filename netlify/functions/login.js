const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

let client;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { uname, password } = JSON.parse(event.body);
    if (!uname || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing credentials' })
      };
    }

    if (!client) {
      client = new MongoClient(process.env.MONGO_URI);
      await client.connect();
    }

    const db = client.db(process.env.DB_NAME);
    const users = db.collection('users');

    const user = await users.findOne({ uname });
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'User not found' })
      };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Incorrect password' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: { uname: user.uname } })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  }
};
