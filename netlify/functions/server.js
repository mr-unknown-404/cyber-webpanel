import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

const app = express();
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION = process.env.COLLECTION;

let db, leads;

// Connect to MongoDB
MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    leads = db.collection(COLLECTION);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if connection fails
  });

app.use(bodyParser.json());

// GET - Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    const allLeads = await leads.find().toArray();
    res.status(200).json(allLeads);
  } catch (error) {
    console.error('Error retrieving leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// PUT - Update a lead
app.put('/api/leads/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = { ...req.body };
  delete updatedData._id; // Remove _id from update data

  try {
    const result = await leads.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE - Delete a lead
app.delete('/api/leads/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await leads.deleteOne({ _id: new ObjectId(id) });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Netlify function handler for all requests
export const handler = async (event, context) => {
  // Modify the event to act like an Express request
  const req = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers,
    body: JSON.parse(event.body),
    queryStringParameters: event.queryStringParameters,
    pathParameters: event.pathParameters,
  };

  const res = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(body) {
      this.body = JSON.stringify(body);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
  };

  // Let express handle the request/response
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          statusCode: res.statusCode,
          body: res.body,
          headers: res.headers,
        });
      }
    });
  });
};
