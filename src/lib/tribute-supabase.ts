import { supabase } from './supabase-client';

// Tribute service functions
export const tributeService = {
  // Get all approved tributes
  async getTributes() {
    const { data, error } = await supabase
      .from('tributes')
      .select(`
        *,
        tribute_reactions(count)
      `)
      .eq('status', 'approved')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tributes:', error);
      throw error;
    }

    // Transform the data to include reaction counts
    return (data || []).map(tribute => ({
      ...tribute,
      reaction_count: tribute.tribute_reactions?.[0]?.count || 0
    }));
  },

  // Add new tribute
  async addTribute(tributeData: {
    author_name: string;
    author_relationship?: string;
    author_email?: string;
    message: string;
    is_public?: boolean;
  }) {
    const { data, error } = await supabase
      .from('tributes')
      .insert([{
        ...tributeData,
        status: 'pending', // Requires admin approval
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding tribute:', error);
      throw error;
    }

    return data;
  },

  // Add reaction to tribute
  async addReaction(tributeId: string, reactionData: {
    reaction_type: string;
    reactor_name: string;
    reactor_email?: string;
    reactor_ip?: string;
  }) {
    const { data, error } = await supabase
      .from('tribute_reactions')
      .upsert([{
        tribute_id: tributeId,
        ...reactionData,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }

    return data;
  },

  // Get tribute statistics
  async getTributeStats() {
    const { data, error } = await supabase
      .from('tributes')
      .select(`
        count(*) as total_tributes,
        count(CASE WHEN status = 'approved' THEN 1 END) as approved_tributes,
        count(CASE WHEN status = 'pending' THEN 1 END) as pending_tributes,
        count(DISTINCT author_ip) as unique_authors
      `)
      .single();

    if (error) {
      console.error('Error fetching tribute stats:', error);
      throw error;
    }

    return data;
  }
};

export default tributeService;
