import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { targetUserId, title, body, data } = await req.json();

    if (!targetUserId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: targetUserId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push tokens for target user
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .eq('user_id', targetUserId);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push tokens found for user', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications via Expo Push API
    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const expoPushResult = await expoPushResponse.json();

    // Clean up invalid tokens
    if (expoPushResult.data) {
      const invalidTokens: string[] = [];
      expoPushResult.data.forEach((result: any, index: number) => {
        if (result.status === 'error' && result.details?.error === 'DeviceNotRegistered') {
          invalidTokens.push(tokens[index].token);
        }
      });

      if (invalidTokens.length > 0) {
        await supabaseAdmin
          .from('push_tokens')
          .delete()
          .in('token', invalidTokens);
        console.log(`Cleaned up ${invalidTokens.length} invalid push tokens`);
      }
    }

    return new Response(
      JSON.stringify({ message: 'Push notifications sent', sent: messages.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Push notification error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
