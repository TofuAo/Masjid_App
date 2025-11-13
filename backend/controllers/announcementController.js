import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import {
  createAnnouncementRecord,
  updateAnnouncementRecord,
  deleteAnnouncementRecord
} from '../services/announcementService.js';

export const getAllAnnouncements = async (req, res) => {
  try {
    const { status, target_audience, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT a.*, u.nama as author_nama
      FROM announcements a
      JOIN users u ON a.author_ic = u.ic
      WHERE 1=1
    `;
    const queryParams = [];

    // Filter by status
    if (status) {
      query += ` AND a.status = ?`;
      queryParams.push(status);
    } else {
      // Default: only show published announcements for non-admin users
      if (req.user?.role !== 'admin') {
        query += ` AND a.status = 'published'`;
      }
    }

    // Filter by target audience - show all announcements that match user's role
    if (target_audience) {
      query += ` AND (a.target_audience = ? OR a.target_audience = 'all')`;
      queryParams.push(target_audience);
    } else if (req.user?.role) {
      const userRole = req.user.role;
      if (userRole === 'student') {
        query += ` AND (a.target_audience = 'all' OR a.target_audience = 'students')`;
      } else if (userRole === 'teacher') {
        query += ` AND (a.target_audience = 'all' OR a.target_audience = 'teachers')`;
      } else if (userRole === 'pic') {
        query += ` AND (a.target_audience = 'all' OR a.target_audience = 'pic' OR a.target_audience = 'admin')`;
      } else if (userRole === 'admin') {
        // Admins see all announcements regardless of target_audience
      }
    } else {
      query += ` AND a.target_audience = 'all'`;
    }

    // Filter by date - only exclude expired announcements (end_date < NOW())
    // Show all others including future ones (start_date > NOW())
    if (req.user?.role !== 'admin') {
      // Only filter out expired announcements, show all others
      query += ` AND (a.end_date IS NULL OR a.end_date >= NOW())`;
    }

    // Pagination
    const safeLimit = Math.max(1, parseInt(limit));
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ` ORDER BY a.priority DESC, a.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [announcements] = await pool.execute(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM announcements a
      WHERE 1=1
    `;
    const countParams = [];

    if (status && req.user?.role === 'admin') {
      countQuery += ` AND a.status = ?`;
      countParams.push(status);
    } else if (req.user?.role !== 'admin') {
      countQuery += ` AND a.status = 'published'`;
    }

    if (target_audience) {
      countQuery += ` AND (a.target_audience = ? OR a.target_audience = 'all')`;
      countParams.push(target_audience);
    } else if (req.user?.role) {
      const userRole = req.user.role;
      if (userRole === 'student') {
        countQuery += ` AND (a.target_audience = 'all' OR a.target_audience = 'students')`;
      } else if (userRole === 'teacher') {
        countQuery += ` AND (a.target_audience = 'all' OR a.target_audience = 'teachers')`;
      } else if (userRole === 'pic') {
        countQuery += ` AND (a.target_audience = 'all' OR a.target_audience = 'pic' OR a.target_audience = 'admin')`;
      } else if (userRole === 'admin') {
        // Admins see all, no filter needed
      }
    }

    if (req.user?.role !== 'admin') {
      // Only filter out expired announcements
      countQuery += ` AND (a.end_date IS NULL OR a.end_date >= NOW())`;
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: announcements,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [announcements] = await pool.execute(`
      SELECT a.*, u.nama as author_nama
      FROM announcements a
      JOIN users u ON a.author_ic = u.ic
      WHERE a.id = ?
    `, [id]);

    if (announcements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user can view this announcement
    const announcement = announcements[0];
    if (req.user?.role !== 'admin') {
      if (announcement.status !== 'published') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      const userRole = req.user.role;
      if (announcement.target_audience !== 'all' && 
          announcement.target_audience !== userRole + 's') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const result = await createAnnouncementRecord(
      {
      title, 
      content, 
        status,
        priority,
        target_audience,
        start_date,
        end_date
      },
      { actorIc: req.user.ic }
    );

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: result.announcement,
      undoToken: result.undoToken,
      undoExpiresAt: result.undoExpiresAt
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, content, status, priority, target_audience, start_date, end_date } = req.body;

    // Check if announcement exists
    try {
      const result = await updateAnnouncementRecord(
        id,
        {
      title, 
      content, 
      status, 
      priority, 
      target_audience, 
          start_date,
          end_date
        },
        { actorIc: req.user.ic }
      );

    res.json({
      success: true,
      message: 'Announcement updated successfully',
        data: result.announcement,
        undoToken: result.undoToken,
        undoExpiresAt: result.undoExpiresAt
      });
    } catch (err) {
      if (err.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const result = await deleteAnnouncementRecord(
        id,
        { actorIc: req.user.ic }
      );

      res.json({
        success: true,
        message: 'Announcement deleted successfully',
        undoToken: result.undoToken,
        undoExpiresAt: result.undoExpiresAt
      });
    } catch (err) {
      if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
      throw err;
    }
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

