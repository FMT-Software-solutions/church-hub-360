import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json' 
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders, 
    })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Verify the user's session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const { userId, organizationId } = await req.json()

    if (!userId || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'User ID and Organization ID are required' }),
        {
          status: 400,
          headers: corsHeaders, 
        }
      )
    }

    // Prevent users from deactivating themselves
    if (user.id === userId) {
      return new Response(
        JSON.stringify({ error: 'Cannot deactivate yourself' }),
        {
          status: 400,
          headers: corsHeaders,
        }
      )
    }

    // Check if current user has permission to deactivate users in this organization
    const { data: currentUserOrg, error: currentUserOrgError } = await supabaseAdmin
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (currentUserOrgError || !currentUserOrg) {
      return new Response(
        JSON.stringify({ error: 'You do not have access to this organization' }),
        {
          status: 403,
          headers: corsHeaders,
        }
      )
    }

    // Check if user has required role (owner, admin, or branch_admin)
    const hasPermission = ['owner', 'admin', 'branch_admin'].includes(currentUserOrg.role)

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to deactivate users in this organization' }),
        {
          status: 403,
          headers: corsHeaders,
        }
      )
    }

    // Deactivate user in the specific organization
    const { error: deactivateError } = await supabaseAdmin
      .from('user_organizations')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (deactivateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to deactivate user from organization' }),
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'User deactivated from organization successfully',
        userId: userId,
        organizationId: organizationId
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    )

  } catch (error) {
    console.error('Error in deactivate-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
})