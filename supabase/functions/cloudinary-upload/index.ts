import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate Cloudinary signature for secure uploads
function generateCloudinarySignature(params: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  const stringToSign = `${sortedParams}${apiSecret}`
  
  // Simple hash function for Cloudinary signature
  const encoder = new TextEncoder()
  const data = encoder.encode(stringToSign)
  return crypto.subtle.digest('SHA-1', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  })
}

async function uploadToCloudinary(file: File, folder: string = 'uploads'): Promise<string> {
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary configuration missing')
  }

  // Basic file validation
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size exceeds 10MB limit')
  }

  const timestamp = Math.round(Date.now() / 1000).toString()
  const publicId = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const params = {
    timestamp,
    public_id: publicId,
    folder
  }

  const signature = await generateCloudinarySignature(params, apiSecret)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('timestamp', timestamp)
  formData.append('public_id', publicId)
  formData.append('folder', folder)
  formData.append('api_key', apiKey)
  formData.append('signature', signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudinary upload failed: ${errorText}`)
  }

  const result = await response.json()
  return result.secure_url
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header - required for all requests
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Check if this is an authenticated request or anon key request
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const isAnonRequest = authHeader === `Bearer ${anonKey}`
    
    let authenticatedUser = null
    
    if (!isAnonRequest) {
      // For authenticated requests, verify the user's session
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        anonKey,
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
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      authenticatedUser = user
    }
    // For anon requests, we allow the request to proceed without user verification

    // Parse multipart form data
    const formData = await req.formData()
    const folder = (formData.get('folder') as string) || 'uploads'
    const imageFile = formData.get('imageFile') as File

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Basic file size validation (10MB limit)
    if (imageFile.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(imageFile, folder)

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        uploadMethod: 'cloudinary'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in cloudinary-upload:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})