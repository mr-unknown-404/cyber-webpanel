import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION = process.env.COLLECTION;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let db, leads, settings;
MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db(DB_NAME);
    leads = db.collection(COLLECTION);
    settings = db.collection('generalSettings');
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Get all leads
app.get('/api/leads', async (req, res) => {
  const allLeads = await leads.find().toArray();
  res.json(allLeads);
});

// Update a lead
app.put('/api/leads/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = { ...req.body };
  delete updatedData._id;

  const result = await leads.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );
  res.json(result);
});

// Delete a lead
app.delete('/api/leads/:id', async (req, res) => {
  const id = req.params.id;
  const result = await leads.deleteOne({ _id: new ObjectId(id) });
  res.json(result);
});

// GET LinkedIn Token
app.get('/api/settings/linkedin-token', async (req, res) => {
  try {
    const doc = await settings.findOne({});
    res.json({ linkedinToken: doc?.linkedinToken || '' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// POST LinkedIn Token
app.post('/api/settings/linkedin-token', async (req, res) => {
  const { linkedinToken } = req.body;
  if (!linkedinToken) return res.status(400).json({ error: 'Missing token' });

  try {
    const existing = await settings.findOne({});
    if (existing) {
      await settings.updateOne({ _id: existing._id }, { $set: { linkedinToken } });
    } else {
      await settings.insertOne({ linkedinToken });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save token' });
  }
});