import AuthService from './AuthService';
// import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

class DespachoService {
    constructor() {
        if (DespachoService.instance) {
            return DespachoService.instance;
        }
        this.db = AuthService.getInstance().getDb();
        this.despachosRef = collection(this.db, 'despachos');
        DespachoService.instance = this;
    }

    static getInstance() {
        if (!DespachoService.instance) {
            DespachoService.instance = new DespachoService();
        }
        return DespachoService.instance;
    }

    async createDespacho(despacho) {
        const despachoData = {
            ...despacho,
            creado_en: despacho.creado_en || new Date().toISOString()
        };
        await addDoc(this.despachosRef, despachoData);
        return true;
    }

    async getDespachosByDate(date) {
        // Firestore requires an index if we order by a different field than the one in 'where'
        // Let's fetch by date and then sort in memory to avoid needing to create composite indexes immediately
        const q = query(this.despachosRef, where('fecha_despacho', '==', date));
        const querySnapshot = await getDocs(q);
        
        let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // order by creado_en desc
        data.sort((a, b) => {
            const dateA = new Date(a.creado_en || 0).getTime();
            const dateB = new Date(b.creado_en || 0).getTime();
            return dateB - dateA;
        });
        
        return data;
    }
}

export default DespachoService;
