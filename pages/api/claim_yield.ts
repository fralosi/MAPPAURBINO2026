import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

// Handler API per accredito profitti asset immobiliare
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  const { user_id, asset_id } = req.body

  // Controllo parametri
  if (!user_id || !asset_id) {
    return res.status(400).json({ error: 'Missing user_id or asset_id' })
  }

  try {
    // Recupera relazione asset posseduto
    const { data: userAsset, error: uaError } = await supabase
      .from('user_assets')
      .select('id, last_yield_claimed_at, level')
      .eq('user_id', user_id)
      .eq('asset_id', asset_id)
      .single()
    if (uaError || !userAsset) {
      return res.status(404).json({ error: 'Asset non posseduto' })
    }

    // Recupera rendimento base asset
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('hourly_yield')
      .eq('id', asset_id)
      .single()
    if (assetError || !asset) {
      return res.status(404).json({ error: 'Asset non trovato' })
    }

    // Calcola tempo passato dall’ultima claim
    const now = new Date()
    const lastClaimed = new Date(userAsset.last_yield_claimed_at)
    const elapsedSeconds = Math.floor((now.getTime() - lastClaimed.getTime()) / 1000)
    if (elapsedSeconds < 60) {
      return res.status(429).json({ error: 'Claim troppo frequente, attendi...' })
    }

    // Calcolo rendimento: proporzionale al tempo passato, livello asset (semplificato: yield * ore * level)
    const hours = elapsedSeconds / 3600
    const yieldEarned = Math.floor(hours * asset.hourly_yield * (userAsset.level || 1))

    if (yieldEarned <= 0) {
      return res.status(204).json({ earned: 0, message: 'Nessun profitto accumulato.' })
    }

    // Accredita profitto all’utente e aggiorna last_yield_claimed_at
    const updates = [
      supabase
        .from('users')
        .update({ balance: supabase.rpc('increment_balance', { user_id, inc: yieldEarned }) })
        .eq('id', user_id),
      supabase
        .from('user_assets')
        .update({ last_yield_claimed_at: now.toISOString() })
        .eq('id', userAsset.id),
      supabase
        .from('transactions')
        .insert({
          user_id,
          amount: yieldEarned,
          type: 'yield',
          metadata: { asset_id, elapsedSeconds },
          created_at: now.toISOString()
        })
    ]

    const [balRes, uaRes, txRes] = await Promise.all(updates)

    // Verifica errori
    if (balRes.error || uaRes.error || txRes.error) {
      return res.status(500).json({
        error: 'Errore nell’accredito profitti',
        details: { bal: balRes.error, ua: uaRes.error, tx: txRes.error }
      })
    }

    return res.status(200).json({ earned: yieldEarned })
  } catch (err) {
    return res.status(500).json({ error: 'Errore server', details: String(err) })
  }
}
