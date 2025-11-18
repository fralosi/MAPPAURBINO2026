import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

// Handler API per vendita asset immobiliare (marketplace)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  const { user_id, asset_id } = req.body

  if (!user_id || !asset_id) {
    return res.status(400).json({ error: 'Missing user_id or asset_id' })
  }

  try {
    // Verifica possesso asset
    const { data: userAsset, error: uaError } = await supabase
      .from('user_assets')
      .select('id, level, purchased_at')
      .eq('user_id', user_id)
      .eq('asset_id', asset_id)
      .single()
    if (uaError || !userAsset) {
      return res.status(404).json({ error: 'Asset non posseduto' })
    }

    // Recupera dettagli asset
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('base_price')
      .eq('id', asset_id)
      .single()
    if (assetError || !asset) {
      return res.status(404).json({ error: 'Asset non trovato' })
    }

    // Calcola importo di vendita (es: 90% del prezzo d’acquisto, opzione migliorabile)
    const sellValue = Math.floor(Number(asset.base_price) * 0.9)

    // Atomicità: Elimina asset da user, accredita saldo, registra transazione
    const deletes = [
      // Elimina relazione user_asset
      supabase
        .from('user_assets')
        .delete()
        .eq('user_id', user_id)
        .eq('asset_id', asset_id),
      // Aggiorna saldo utente
      supabase
        .from('users')
        .update({ balance: supabase.rpc('increment_balance', { user_id, inc: sellValue }) })
        .eq('id', user_id),
      // Registra transazione
      supabase
        .from('transactions')
        .insert({
          user_id,
          amount: sellValue,
          type: 'sale',
          metadata: { asset_id, original_price: asset.base_price },
          created_at: new Date().toISOString()
        })
    ]
    const [delRes, balRes, txRes] = await Promise.all(deletes)

    // Gestione errori
    if (delRes.error || balRes.error || txRes.error) {
      return res.status(500).json({
        error: 'Errore nella vendita',
        details: { del: delRes.error, bal: balRes.error, tx: txRes.error }
      })
    }

    return res.status(200).json({ success: true, amount: sellValue })
  } catch (err) {
    return res.status(500).json({ error: 'Errore server', details: String(err) })
  }
}
