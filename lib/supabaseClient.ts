import { createClient } from '@supabase/supabase-js'

// Leggi le chiavi e l’URL dal file .env.local (process.env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY as string

// Istanzia il client Supabase, pronto all’uso in tutta l’app
export const supabase = createClient(supabaseUrl, supabaseKey)
