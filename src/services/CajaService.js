import AuthService from './AuthService';

class CajaService {
    constructor() {
        if (CajaService.instance) {
            return CajaService.instance;
        }
        this.supabase = AuthService.getInstance().getSupabase();
        CajaService.instance = this;
    }

    static getInstance() {
        if (!CajaService.instance) {
            CajaService.instance = new CajaService();
        }
        return CajaService.instance;
    }

    async checkCajaDelDia(fecha) {
        const { data, error } = await this.supabase
            .from('cajas')
            .select('*')
            .eq('fecha', fecha)
            .eq('status', 'aperturada')
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    async aperturarCaja(montoInicial) {
        const fecha = new Date().toISOString().split('T')[0];
        const { data, error } = await this.supabase
            .from('cajas')
            .insert([{
                fecha: fecha,
                monto_inicial: montoInicial,
                status: 'aperturada'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async cerrarCaja(id, datosCierre) {
        const { data, error } = await this.supabase
            .from('cajas')
            .update({
                total: datosCierre.total,
                yape: datosCierre.yape,
                efectivo: datosCierre.efectivo,
                status: 'cerrada'
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export default CajaService;
