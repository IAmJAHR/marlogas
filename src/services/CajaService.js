import AuthService from './AuthService';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';

class CajaService {
    constructor() {
        if (CajaService.instance) {
            return CajaService.instance;
        }
        this.db = AuthService.getInstance().getDb();
        this.cajasRef = collection(this.db, 'cajas');
        CajaService.instance = this;
    }

    static getInstance() {
        if (!CajaService.instance) {
            CajaService.instance = new CajaService();
        }
        return CajaService.instance;
    }

    async checkCajaDelDia(fecha) {
        const q = query(this.cajasRef, where('fecha', '==', fecha), where('status', '==', 'aperturada'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }
        
        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() };
    }

    async aperturarCaja(montoInicial) {
        const fecha = new Date().toISOString().split('T')[0];
        const docRef = await addDoc(this.cajasRef, {
            fecha: fecha,
            monto_inicial: montoInicial,
            status: 'aperturada'
        });
        
        return { id: docRef.id, fecha: fecha, monto_inicial: montoInicial, status: 'aperturada' };
    }

    async cerrarCaja(id, datosCierre) {
        const cajaDocRef = doc(this.db, 'cajas', id);
        await updateDoc(cajaDocRef, {
            total: datosCierre.total,
            yape: datosCierre.yape,
            efectivo: datosCierre.efectivo,
            status: 'cerrada'
        });
        
        const updatedDoc = await getDoc(cajaDocRef);
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }
}

export default CajaService;
