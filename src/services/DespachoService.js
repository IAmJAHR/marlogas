import AuthService from './AuthService';

class DespachoService {
    constructor() {
        if (DespachoService.instance) {
            return DespachoService.instance;
        }
        this.supabase = AuthService.getInstance().getSupabase();
        DespachoService.instance = this;
    }

    static getInstance() {
        if (!DespachoService.instance) {
            DespachoService.instance = new DespachoService();
        }
        return DespachoService.instance;
    }

    async createDespacho(despacho) {
        const { error } = await this.supabase
            .from('despachos')
            .insert([despacho]);

        if (error) throw error;
        return true;
    }

    async getDespachosByDate(date) {
        const { data, error } = await this.supabase
            .from('despachos')
            .select('*')
            .eq('fecha_despacho', date)
            .order('creado_en', { ascending: false });

        if (error) throw error;
        return data;
    }
}

export default DespachoService;
