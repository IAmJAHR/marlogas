import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

class AuthService {
    constructor() {
        if (AuthService.instance) {
            return AuthService.instance;
        }
        AuthService.instance = this;
    }

    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async login(username, password) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username), where('password', '==', password));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }
        
        const userData = querySnapshot.docs[0].data();
        // Save to local storage to persist session
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    }

    async getSession() {
        const user = localStorage.getItem('user');
        if (user) {
            return { data: { session: { user: JSON.parse(user) } } };
        }
        return { data: { session: null } };
    }

    async logout() {
        localStorage.removeItem('user');
    }

    getDb() {
        return db;
    }
}

export default AuthService;
