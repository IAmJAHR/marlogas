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
        // Supabase stores timestamps, so we need to filter by range for the whole day
        const startDate = `${date}T00:00:00`;
        const endDate = `${date}T23:59:59`;

        const { data, error } = await this.supabase
            .from('despachos')
            .select('*')
            .gte('creado_en', startDate)
            .lte('creado_en', endDate)
            .order('creado_en', { ascending: false });

        if (error) throw error;
        return data;
    }
}

export default DespachoService;
