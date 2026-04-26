// db.js - Firebase Firestore Backend
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

// 1. Firebase Configuration (from user)
const firebaseConfig = {
  apiKey: "AIzaSyDEDsCpkZM8MT0EIIFFTWerGrDIlIwMViE",
  authDomain: "servimatch-7aa56.firebaseapp.com",
  projectId: "servimatch-7aa56",
  storageBucket: "servimatch-7aa56.firebasestorage.app",
  messagingSenderId: "292420348628",
  appId: "1:292420348628:web:f7fa5919395681c482e941"
};

// 2. Initialize Firebase (Compat)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

// 3. Local Cache for Synchronous reads
window.sm_cache = {
  users: [],
  offers: [],
  apps: [],
  settings: defaultSettings,
  initialized: false
};

// 4. DB API
const DB = {
  init() {
    // Escuchar configuraciones globales
    firestore.collection('config').doc('settings').onSnapshot(doc => {
      if(doc.exists) {
        window.sm_cache.settings = doc.data();
      } else {
        firestore.collection('config').doc('settings').set(defaultSettings);
      }
      if(window.app && window.sm_cache.initialized) window.app.navigate(window.app.currentRoute);
    });

    const collections = ['users', 'offers', 'apps'];
    let loaded = 0;

    collections.forEach(coll => {
      firestore.collection(coll).onSnapshot(snapshot => {
        window.sm_cache[coll] = snapshot.docs.map(doc => doc.data());
        
        // Cargar admin por defecto si está vacío
        if (coll === 'users' && window.sm_cache.users.length === 0 && snapshot.docs.length === 0) {
           DB.setUsers([defaultAdmin]);
        }
        
        // Refrescar UI si ya arrancó la app
        if(window.app && window.sm_cache.initialized) {
          window.app.navigate(window.app.currentRoute);
        }

        // Marcar como inicializado cuando cargan las 3 colecciones base
        loaded++;
        if (loaded >= 3 && !window.sm_cache.initialized) {
           window.sm_cache.initialized = true;
           if(window.app) window.app.navigate(window.app.currentRoute);
        }
      });
    });
  },

  // GETTERS (Lectura síncrona desde caché)
  getUsers: () => window.sm_cache.users || [],
  getOffers: () => window.sm_cache.offers || [],
  getApps: () => window.sm_cache.apps || [],
  getSettings: () => window.sm_cache.settings || defaultSettings,

  // SETTERS (Escritura asíncrona hacia Firestore)
  async setUsers(newArray) { await this._syncCollection('users', newArray); },
  async setOffers(newArray) { await this._syncCollection('offers', newArray); },
  async setApps(newArray) { await this._syncCollection('apps', newArray); },
  async setSettings(data) {
    await firestore.collection('config').doc('settings').set(data);
  },

  // Magia de sincronización que compara arrays y actualiza Firestore sin romper la lógica original
  async _syncCollection(collName, newArray) {
    const currentArray = window.sm_cache[collName] || [];
    const newIds = newArray.map(item => item.id);
    const oldIds = currentArray.map(item => item.id);

    // Eager update para que la UI se actualice inmediatamente sin esperar al servidor
    window.sm_cache[collName] = [...newArray];

    const batch = firestore.batch();
    
    // Upsert (Insertar o Actualizar)
    newArray.forEach(item => {
      const docRef = firestore.collection(collName).doc(item.id.toString());
      batch.set(docRef, item);
    });

    // Eliminar los que ya no están en el array
    oldIds.forEach(id => {
      if(!newIds.includes(id)) {
        const docRef = firestore.collection(collName).doc(id.toString());
        batch.delete(docRef);
      }
    });

    try {
      await batch.commit();
    } catch(err) {
      console.error("Error al sincronizar con Firestore:", err);
      if(window.UI) window.UI.showToast("Error de conexión con la base de datos", "error");
    }
  },

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
