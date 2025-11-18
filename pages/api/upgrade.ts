import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

// Handler API per upgrade asset immobiliare
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  const { user_id, asset_id } = req.body

  if (!user_id || !asset_id) {
    return res.status(400).json({ error: 'Missing user_id or asset_id' })
  }

  try {
    // Ottieni asset posseduto
    const { data: ua, error: uaError } = await supabase
      .from('user_assets')
      .select('id, level')
      .eq('user_id', user_id)
      .eq('asset_id', asset_id)
      .single()
    if (uaError || !ua) {
      return res.status(404).json({ error: 'Asset non posseduto' })
    }

    // Specifica logica di costo upgrade (es: base 50, aumenta con livello)
    const upgradeCost = 50 + ua.level * 25

    // Verifica saldo utente
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, balance')
      .eq('id', user_id)
      .single()
    if (userError || !user) {
      return res.status(404).json({ error: 'Utente non trovato' })
    }
    if (Number(user.balance) < upgradeCost) {
      return res.status(402).json({ error: 'Fondi insufficienti per upgrade' })
    }

    // Aggiorna livello asset, scala saldo, registra transazione
    const upgrades = [
      supabase
        .from('user_assets')
        .update({ level: ua.level + 1 })
        .eq('id', ua.id),
      supabase
        .from('users')
        .update({ balance: Number(user.balance) - upgradeCost })
        .eq('id', user_id),
      supabase
        .from('transactions')
        .insert({
          user_id,
          amount: -upgradeCost,
          type: 'upgrade',
          metadata: { asset_id, old_level: ua.level, new_level: ua.level + 1 },
          created_at: new Date().toISOString()
        })
    ]
    const [uaRes, balRes, txRes] = await Promise.all(upgrades)

    if (uaRes.error || balRes.error || txRes.error) {
      return res.status(500).json({
        error: 'Errore nell’upgrade asset',
        details: { ua: uaRes.error, bal: balRes.error, tx: txRes.error }
      })
    }

    return res.status(200).json({ success: true, newLevel: ua.level + 1 })
  } catch (err) {
    return res.status(500).json({ error: 'Errore server', details: String(err) })
  }
}
