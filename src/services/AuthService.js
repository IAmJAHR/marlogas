import { createClient } from '@supabase/supabase-js';

class AuthService {
    constructor() {
        if (AuthService.instance) {
            return AuthService.instance;
        }

        const supabaseUrl = 'https://ccwfuxcnfqxetturkufs.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd2Z1eGNuZnF4ZXR0dXJrdWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTkzMTUsImV4cCI6MjA4MDQzNTMxNX0._yulZSjt_DMKABf27rZNNMFbw_Nmkau5hvLCE6UQjkQ';

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
