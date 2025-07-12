import { getDB } from '../../../utils/database';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = await getDB();
    const { id } = req.query;

    if (req.method === 'GET') {
      // Tìm item theo _id
      const item = await db.collection('listDon').findOne({ _id: new ObjectId(id) });
      
      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      return res.status(200).json({ success: true, data: item });
    }

    if (req.method === 'PUT') {
      // Cập nhật item theo _id
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };
      
      const result = await db.collection('listDon').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Item updated successfully',
        modifiedCount: result.modifiedCount 
      });
    }

    if (req.method === 'DELETE') {
      // Xóa item theo _id
      const result = await db.collection('listDon').deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Item deleted successfully' 
      });
    }

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ success: false, error: 'Database error' });
  }
} 