import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://tmpxiofcuoqdhnwbsymh.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcHhpb2ZjdW9xZGhud2JzeW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTY3NjcsImV4cCI6MjA4OTczMjc2N30.WaIQZHwZ-ecoYEM8WrKw76SPv_mpF0uzqLrOA6jS14A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const Auth = {
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        await callback(event, session);
      })();
    });
  }
};

export const DB = {
  async saveDocument(documentData) {
    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateDocument(id, updates) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getDocuments(userId) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getDocument(id) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteDocument(id) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async saveTopics(topics) {
    const { data, error } = await supabase
      .from('topics')
      .insert(topics)
      .select();
    if (error) throw error;
    return data;
  },

  async saveQuestions(questions) {
    const { data, error } = await supabase
      .from('questions')
      .insert(questions)
      .select();
    if (error) throw error;
    return data;
  },

  async saveDiagrams(diagrams) {
    const { data, error } = await supabase
      .from('diagrams')
      .insert(diagrams)
      .select();
    if (error) throw error;
    return data;
  },

  async getTopics(documentId) {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('document_id', documentId)
      .order('order_index');
    if (error) throw error;
    return data;
  },

  async getQuestions(documentId) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('document_id', documentId);
    if (error) throw error;
    return data;
  },

  async getDiagrams(documentId) {
    const { data, error } = await supabase
      .from('diagrams')
      .select('*')
      .eq('document_id', documentId);
    if (error) throw error;
    return data;
  },

  async toggleBookmark(questionId, isBookmarked) {
    const { data, error } = await supabase
      .from('questions')
      .update({ is_bookmarked: isBookmarked })
      .eq('id', questionId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async toggleFavorite(documentId, isFavorite) {
    const { data, error } = await supabase
      .from('documents')
      .update({ is_favorite: isFavorite })
      .eq('id', documentId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getUserStats(userId) {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateUserStats(userId, updates) {
    const { data, error } = await supabase
      .from('user_stats')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createStudySession(sessionData) {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([sessionData])
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getStudySessions(userId, limit = 10) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*, documents(filename)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }
};
