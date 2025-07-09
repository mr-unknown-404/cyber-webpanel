import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION = process.env.COLLECTION;

let db, leads;

MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db(DB_NAME);
    leads = db.collection(COLLECTION);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

export async function handler(event, context) {
  const { httpMethod, path } = event;
  
  if (path === '/api/leads' && httpMethod === 'GET') {
    // Get all leads
    try {
      const allLeads = await leads.find().toArray();
      return {
        statusCode: 200,
        body: JSON.stringify(allLeads)
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch leads' })
      };
    }
  }

  if (path.startsWith('/api/leads') && httpMethod === 'PUT') {
    // Update a lead
    const leadId = path.split('/')[3]; // Extracting lead id from URL
    const updatedData = JSON.parse(event.body);
    delete updatedData._id;

    try {
      const result = await leads.updateOne(
        { _id: new ObjectId(leadId) },
        { $set: updatedData }
      );
      return {
        statusCode: 200,
        body: JSON.stringify(result)
      };
    } catch (error) {
      console.error('Error updating lead:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update lead' })
      };
    }
  }

  if (path.startsWith('/api/leads') && httpMethod === 'DELETE') {
    // Delete a lead
    const leadId = path.split('/')[3]; // Extracting lead id from URL

    try {
      const result = await leads.deleteOne({ _id: new ObjectId(leadId) });
      return {
        statusCode: 200,
        body: JSON.stringify(result)
      };
    } catch (error) {
      console.error('Error deleting lead:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to delete lead' })
      };
    }
  }

  // If no route matches, return 404
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not Found' })
  };
}
