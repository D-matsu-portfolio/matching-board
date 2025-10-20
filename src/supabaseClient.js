import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'URL'
const supabaseAnonKey = 'ANON_KEY'

export const supabase = createClinet(supabaseUrl, supabaseAnonKey)