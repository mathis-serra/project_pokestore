import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htleoiizvywpuywnkicl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bGVvaWl6dnl3cHV5d25raWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDU0MzAsImV4cCI6MjA1OTc4MTQzMH0.7t3sP2-6b8IOfS-8e5ujmgC3VLT2PM2dyF_W1pYysWA'; // trouvé dans "Project Settings > API"

export const supabase = createClient(supabaseUrl, supabaseKey);