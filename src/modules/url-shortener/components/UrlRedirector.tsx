import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { Loader2 } from 'lucide-react';

export function UrlRedirector() {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveAndRedirect() {
      if (!code) {
        setError('Invalid URL');
        return;
      }

      try {
        // Call the RPC function to atomically resolve the URL and increment the click counter
        const { data: longUrl, error: rpcError } = await supabase
          .rpc('resolve_short_url', { p_code: code });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        if (!longUrl) {
          setError('Link not found or has expired.');
          return;
        }

        // Redirect the user
        window.location.replace(longUrl);

      } catch (err: any) {
        console.error('Failed to resolve short URL:', err);
        setError('Something went wrong. The link might be broken.');
      }
    }

    resolveAndRedirect();
  }, [code]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={() => window.location.replace('/')}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold">Redirecting you...</h2>
      <p className="text-muted-foreground text-sm mt-2">Please wait while we take you to your destination.</p>
    </div>
  );
}
