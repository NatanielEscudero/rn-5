
// src/config/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://urzwbkxldwccggjqifyp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyendia3hsZHdjY2dnanFpZnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTU5NDAsImV4cCI6MjA3NzgzMTk0MH0.A3h1-zsTCuC6npoIAKC8kc36xzIRn-62hcR14xHZ9VA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
    debug: false // Cambiar a true si necesitas debug
  }
})