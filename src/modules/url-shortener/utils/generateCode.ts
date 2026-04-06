/**
 * Generates a random alphanumeric string (Base62) of the specified length.
 * Designed to be URL safe and collision-resistant for short URLs.
 */
export function generateShortCode(length: number = 7): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}
