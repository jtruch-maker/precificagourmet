import { User, AuthResponse } from '../types';

const STORAGE_KEY_USERS = 'app_users_db';
const STORAGE_KEY_TOKEN = 'app_auth_token';

// Simula um delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  // Simula Endpoint: POST /register
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    await delay(800);
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      throw new Error('E-mail já cadastrado.');
    }

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password, // Em produção, NUNCA salve senhas em texto puro
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    const token = btoa(JSON.stringify({ id: newUser.id, email: newUser.email, exp: Date.now() + 3600000 }));
    
    const userReturn = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    
    return { user: userReturn, token };
  },

  // Simula Endpoint: POST /login
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay(800);
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    // Cria um "JWT" fake (apenas base64 para simulação)
    const token = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 3600000 }));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token
    };
  },

  // Simula validação de sessão ao recarregar página
  async getProfile(): Promise<User | null> {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!token) return null;

    try {
      // Decode fake JWT
      const payload = JSON.parse(atob(token));
      
      // Valida expiração
      if (payload.exp < Date.now()) {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        return null;
      }

      const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
      const user = users.find((u: any) => u.id === payload.id);
      
      if (!user) return null;
      
      return { id: user.id, name: user.name, email: user.email };
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
};
