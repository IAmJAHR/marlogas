import { createClient } from '@supabase/supabase-js';

class AuthService {
    constructor() {
        if (AuthService.instance) {
            return AuthService.instance;
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        AuthService.instance = this;
    }

    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async login(username, password) {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error) throw error;
        return data;
    }

    async getSession() {
        return this.supabase.auth.getSession();
    }

    getSupabase() {
        return this.supabase;
    }
}

export default AuthService;
