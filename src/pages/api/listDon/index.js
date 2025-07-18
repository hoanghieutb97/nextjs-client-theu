import { getDB } from '../../../utils/database';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const db = await getDB();
      const listDonCollection = db.collection('listDon');

      const { status } = req.query;
      
      let query = {};
      
      // Nếu có query parameter status, filter theo status đó
      if (status) {
        query.status = status;
      }

      const items = await listDonCollection.find(query).toArray();
      
      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
        filteredBy: status || 'all'
      });
    } catch (error) {
      console.error('Error fetching listDon items:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const db = await getDB();
      const listDonCollection = db.collection('listDon');

      const newItem = {
        ...req.body,
        createdAt: new Date()
      };

      const result = await listDonCollection.insertOne(newItem);
      
      res.status(201).json({
        success: true,
        data: { _id: result.insertedId, ...newItem }
      });
    } catch (error) {
      console.error('Error creating listDon item:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 