import { getDB } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const db = await getDB();
      const usersCollection = db.collection('users');

      const users = await usersCollection.find({}).toArray();
      
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const db = await getDB();
      const usersCollection = db.collection('users');

      const newUser = {
        ...req.body,
        createdAt: new Date()
      };

      const result = await usersCollection.insertOne(newUser);
      
      res.status(201).json({
        success: true,
        data: { _id: result.insertedId, ...newUser }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 