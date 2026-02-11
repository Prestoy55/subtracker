import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch latest rates from Frankfurter API (free, no key needed)
        const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=NOK,EUR')
        const data = await response.json()

        const usdToNok = data.rates.NOK
        const eurToNok = usdToNok / data.rates.EUR // Calculate EUR to NOK via USD base

        const updates = [
            { code: 'USD', rate_to_nok: usdToNok, updated_at: new Date().toISOString() },
            { code: 'EUR', rate_to_nok: eurToNok, updated_at: new Date().toISOString() }
        ]

        const { error } = await supabaseClient
            .from('exchange_rates')
            .upsert(updates)

        if (error) throw error

        return new Response(JSON.stringify({ success: true, rates: updates }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
