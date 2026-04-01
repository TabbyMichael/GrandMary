import express from 'express';
import { validateTributeSubmission, validatePagination } from '../middleware/validation.js';
import { getClientInfo } from '../utils/helpers.js';
import { supabase } from '../supabase-config.js';

const router = express.Router();

// GET /api/tributes - Fetch approved tributes with pagination
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page, limit, status } = req.pagination;
    const offset = (page - 1) * limit;

    // Build query based on status
    let query = supabase
      .from('tributes')
      .select('*', { count: 'exact' });

    if (status === 'approved') {
      query = query.eq('status', 'approved');
    } else if (status === 'pending') {
      query = query.eq('status', 'pending');
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: tributes, error, count } = await query;

    if (error) {
      console.error('Error fetching tributes:', error);
      return res.status(500).json({ error: 'Failed to fetch tributes' });
    }

    // Format response to match expected structure
    const formattedTributes = tributes.map(tribute => ({
      id: tribute.id,
      name: tribute.author_name || tribute.name,
      relationship: tribute.author_relationship || tribute.relationship,
      message: tribute.message,
      date: new Date(tribute.created_at).toISOString().split('T')[0],
      created_at: tribute.created_at
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    res.json({
      tributes: formattedTributes,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error in tributes endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tributes - Submit a new tribute
router.post('/', validateTributeSubmission, async (req, res) => {
  try {
    const { name, relationship, message, email } = req.body;
    const clientInfo = getClientInfo(req);

    // Insert tribute into Supabase
    const { data, error } = await supabase
      .from('tributes')
      .insert({
        author_name: name,
        author_relationship: relationship,
        author_email: email || null,
        author_ip: clientInfo.ip,
        message: message,
        is_public: true,
        status: 'pending', // Pending approval
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting tribute:', error);
      return res.status(500).json({ error: 'Failed to submit tribute' });
    }

    // Log analytics event (optional - you can create an analytics table in Supabase too)
    try {
      await supabase
        .from('analytics')
        .insert({
          event_type: 'tribute_submitted',
          event_data: { tributeId: data.id },
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          created_at: new Date().toISOString()
        });
    } catch (analyticsError) {
      console.error('Error logging analytics:', analyticsError);
      // Don't fail the main request if analytics fails
    }

    res.status(201).json({
      message: 'Tribute submitted successfully. It will be visible once approved.',
      tributeId: data.id,
      status: 'pending_approval'
    });
  } catch (error) {
    console.error('Error submitting tribute:', error);
    res.status(500).json({ error: 'Failed to submit tribute' });
  }
});

// GET /api/tributes/stats - Get tribute statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total tributes
    const { count: totalCount, error: totalError } = await supabase
      .from('tributes')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error getting total count:', totalError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get approved tributes
    const { count: approvedCount, error: approvedError } = await supabase
      .from('tributes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    if (approvedError) {
      console.error('Error getting approved count:', approvedError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get pending tributes
    const { count: pendingCount, error: pendingError } = await supabase
      .from('tributes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error getting pending count:', pendingError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Get latest submission date
    const { data: latestTribute, error: latestError } = await supabase
      .from('tributes')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const latestDate = latestTribute ? latestTribute.created_at : null;

    res.json({
      totalTributes: totalCount || 0,
      approvedTributes: approvedCount || 0,
      pendingTributes: pendingCount || 0,
      latestSubmissionDate: latestDate,
    });
  } catch (error) {
    console.error('Error fetching tribute stats:', error);
    res.status(500).json({ error: 'Failed to fetch tribute statistics' });
  }
});

export default router;
