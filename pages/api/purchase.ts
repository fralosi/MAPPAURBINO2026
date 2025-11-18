import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

// Handler API per acquisto asset immobiliare
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
    // Ottieni dettagli asset dalla tabella
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id, base_price')
      .eq('id', asset_id)
      .single()
    if (assetError || !asset) {
      return res.status(404).json({ error: 'Asset non trovato' })
    }

    // Controllo se utente ha già asset
    const { data: existing } = await supabase
      .from('user_assets')
      .select('id')
      .eq('user_id', user_id)
      .eq('asset_id', asset_id)
      .maybeSingle()
    if (existing) {
      return res.status(409).json({ error: 'Asset già posseduto' })
    }

    // Leggi saldo utente
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, balance')
      .eq('id', user_id)
      .single()
    if (userError || !user) {
      return res.status(404).json({ error: 'Utente non trovato' })
    }
    if (Number(user.balance) < Number(asset.base_price)) {
      return res.status(402).json({ error: 'Fondi insufficienti' })
    }

    // Inizia transazione atomica
    const updates = [
      // Aggiorna saldo
      supabase
        .from('users')
        .update({ balance: Number(user.balance) - Number(asset.base_price) })
        .eq('id', user_id),
      // Inserisci asset acquistato
      supabase
        .from('user_assets')
        .insert({
          user_id,
          asset_id,
          purchased_at: new Date().toISOString(),
          level: 1
        }),
      // Registra transazione
      supabase
        .from('transactions')
        .insert({
          user_id,
          amount: -Number(asset.base_price),
          type: 'purchase',
          metadata: { asset_id },
          created_at: new Date().toISOString()
        })
    ]
    // Esegui tutte le operazioni
    const [balanceRes, assetRes, txRes] = await Promise.all(updates)

    // Verifica errori
    if (balanceRes.error || assetRes.error || txRes.error) {
      return res.status(500).json({
        error: 'Errore nell’acquisto',
        details: { balance: balanceRes.error, asset: assetRes.error, tx: txRes.error }
      })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Errore server', details: String(err) })
  }
}
