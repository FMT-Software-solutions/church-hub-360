import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { generateShortCode } from '../utils/generateCode';
import { baseUrl } from '@/constants/urls';

interface ShortenUrlOptions {
  longUrl: string;
  organizationId: string;
}

export function useUrlShortener() {
  return useMutation({
    mutationFn: async ({ longUrl, organizationId }: ShortenUrlOptions) => {
      // Validate URL (basic check)
      let finalUrl = longUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }

      const code = generateShortCode();

      const { data, error } = await supabase
        .from('short_urls')
        .insert({
          organization_id: organizationId,
          code,
          long_url: finalUrl,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }


      const isHashRouter = window.location.hash.includes('#/');

      const shortUrl = isHashRouter
        ? `${baseUrl}/#/s/${code}`
        : `${baseUrl}/s/${code}`;

      return {
        ...data,
        shortUrl,
      };
    },
  });
}
