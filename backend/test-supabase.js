import { createClient } from '@supabase/supabase-js';

// Test Supabase connection
const supabaseUrl = 'https://vyoplbhgbczrqbpishee.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5b3BsYmhnYmN6cnFicGlzaGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTk5OTksImV4cCI6MjA5MDIzNTk5OX0.K6IcJ9q0zPDwMqfZER8ZMF6ssiscIKQAncxWIQuF6Nk';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey);

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test a simple query
  const { data, error } = await supabase.from('tributes').select('count').limit(1);
  
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log('Supabase connection successful:', data);
  }
} catch (err) {
  console.error('Connection error:', err.message);
}
