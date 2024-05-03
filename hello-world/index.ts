// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from './cors.ts';

console.log(`Function "select-from-table-with-auth-rls" up and running!`);

Deno.serve(async (req: Request) => {
  try {
    // This is needed if you're planning to invoke your function from a browser.
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? 'https://fflcmvlwyzivjsgqxlzw.supabase.co',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbGNtdmx3eXppdmpzZ3F4bHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzODQzMzQsImV4cCI6MjAyOTk2MDMzNH0.HVHh7QM0w57rLTzDayn1ktEss_wrSi1ruOuhBxxSdQM',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      {
        global:{
          headers: { Authorization: req.headers.get('Authorization') || '' },
        }
      }
    );

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');

    // Now we can get the session or user object
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    console.log(req.headers);

    // And we can run queries in the context of our authenticated user
    const { data, error } = await supabaseClient.from('shoppingcart').select('*');
    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'
*/
