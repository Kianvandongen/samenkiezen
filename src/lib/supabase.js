import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://kpmunscfyxwqoitemgno.supabase.co';
const KEY = 'sb_publishable_ea8j_b6qvq69w0pedNCp1Q_igvTYoo0';

export const sb = createClient(SUPABASE_URL, KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
