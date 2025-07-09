const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let client;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
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
        body: JSON.stringify({ success: false, error: 'Invalid credentials' })
      };
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Invalid credentials' })
      };
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { uname: user.uname, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, token })
    };

  } catch (err) {
    console.error('Login error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Server error' })
    };
  }
};
