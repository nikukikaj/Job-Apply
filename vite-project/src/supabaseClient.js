// File: src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trxvorwjnqxfgnlidkfo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeHZvcndqbnF4ZmdubGlka2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNzgyNjUsImV4cCI6MjA2MjY1NDI2NX0.J7I_WbEso0dgeY1ocDCMhQxyhLM6JHFpubOyH6EZlpc';
export const supabase = createClient(supabaseUrl, supabaseKey);
