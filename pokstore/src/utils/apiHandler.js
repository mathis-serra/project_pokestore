import { supabase } from '../supabaseClient';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// More reliable connection check with multiple endpoints and faster timeout
export const checkConnection = async () => {
  // First, check navigator.onLine
  if (!navigator.onLine) {
    return false;
  }

  try {
    // Try to ping Supabase first (since it's our actual service)
    const supabaseResponse = await Promise.race([
      supabase.from('cards').select('count').limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 3000)
      )
    ]);
    
    if (supabaseResponse) {
      return true;
    }
  } catch (error) {
    // If Supabase check fails, try a simple fetch to a reliable endpoint
    try {
      const response = await Promise.race([
        fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-cache'
        }),
        fetch('https://www.cloudflare.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-cache'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        )
      ]);
      
      return response.type === 'opaque' || response.status === 200;
    } catch {
      // If both checks fail, but navigator.onLine is true, give benefit of the doubt
      return navigator.onLine;
    }
  }
  
  return navigator.onLine;
};

export const handleApiCall = async (operation, params = {}, retryCount = 0) => {
  try {
    // Quick online check before attempting operation
    if (!navigator.onLine) {
      throw new Error('Pas de connexion internet. Veuillez vérifier votre connexion.');
    }

    const response = await operation(params);
    
    if (response.error) {
      // Handle specific Supabase errors
      if (response.error.code === 'PGRST301') {
        throw new Error('La session a expiré. Veuillez vous reconnecter.');
      }
      
      if (response.error.code === '23505') {
        throw new Error('Cette entrée existe déjà.');
      }
      
      // Network related errors
      if (response.error.message?.includes('Failed to fetch')) {
        if (retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY * Math.pow(2, retryCount));
          return handleApiCall(operation, params, retryCount + 1);
        }
        throw new Error('Impossible de se connecter au serveur. Veuillez réessayer.');
      }
      
      throw response.error;
    }
    
    return response;
  } catch (error) {
    if (error.message?.includes('JWT expired')) {
      // Handle expired token
      await supabase.auth.signOut();
      throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
    }
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      if (retryCount < MAX_RETRIES) {
        await sleep(RETRY_DELAY * Math.pow(2, retryCount));
        return handleApiCall(operation, params, retryCount + 1);
      }
      throw new Error('Problème de connexion. Veuillez réessayer.');
    }
    
    throw error;
  }
};

export const isOnline = () => {
  return navigator.onLine;
};

export const handleConnectionError = async () => {
  const online = await checkConnection();
  if (!online) {
    throw new Error('Problème de connexion au serveur. Veuillez réessayer.');
  }
}; 