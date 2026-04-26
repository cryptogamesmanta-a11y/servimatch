// db.js - Gestión de estado y LocalStorage

const defaultAdmin = {
  id: 'admin_1',
  name: 'Dueño Sistema',
  email: 'admin@admin.com',
  password: 'admin',
  role: 'admin',
  status: 'active',
  phone: '0000000000'
};

const defaultSettings = {
  platformWallet: '0x7797d868b3668e367b2ee27f041d11a274b9abe8',
  platformFeePercent: 10
};

const DB = {
  init() {
    if (!localStorage.getItem('sm_users')) {
      localStorage.setItem('sm_users', JSON.stringify([defaultAdmin]));
      localStorage.setItem('sm_offers', JSON.stringify([])); // {id, proId, title, desc, address, price, hash, photos:[], status: 'pending'|'active'}
      localStorage.setItem('sm_apps', JSON.stringify([])); // {id, offerId, clientId, status: 'pending'|'accepted'|'completed'|'paid'}
      localStorage.setItem('sm_settings', JSON.stringify(defaultSettings));
    }
  },

  // GETTERS
  getUsers: () => JSON.parse(localStorage.getItem('sm_users')),
  getOffers: () => JSON.parse(localStorage.getItem('sm_offers')),
  getApps: () => JSON.parse(localStorage.getItem('sm_apps')),
  getSettings: () => JSON.parse(localStorage.getItem('sm_settings')),

  // SETTERS
  setUsers: (data) => localStorage.setItem('sm_users', JSON.stringify(data)),
  setOffers: (data) => localStorage.setItem('sm_offers', JSON.stringify(data)),
  setApps: (data) => localStorage.setItem('sm_apps', JSON.stringify(data)),
  setSettings: (data) => localStorage.setItem('sm_settings', JSON.stringify(data)),

  // HELPERS
  generateId: () => Math.random().toString(36).substr(2, 9),
  
  getUser: (id) => DB.getUsers().find(u => u.id === id),
  getOffer: (id) => DB.getOffers().find(o => o.id === id),

  getCurrentUser: () => JSON.parse(sessionStorage.getItem('sm_currentUser') || 'null'),
  setCurrentUser: (user) => {
    if (user) sessionStorage.setItem('sm_currentUser', JSON.stringify(user));
    else sessionStorage.removeItem('sm_currentUser');
  }
};
