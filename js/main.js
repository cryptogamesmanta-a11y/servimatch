// Inicializar DB

// Inicializar DB
DB.init();

const App = {
  currentRoute: 'market',
  
  init() {
    this.renderNavbar();
    this.navigate('market'); // Ruta por defecto
    window.app = this; // Exponer al scope global para los onclick de HTML
  },

  navigate(route) {
    this.currentRoute = route;
    const container = document.getElementById('app-container');
    
    // Auth Guards
    const user = DB.getCurrentUser();
    if(route === 'admin' && user?.role !== 'admin') return this.navigate('market');
    if(route === 'pro' && user?.role !== 'pro') return this.navigate('market');
    if(route === 'client' && user?.role !== 'client') return this.navigate('market');

    if (route === 'market') container.innerHTML = Views.renderMarket();
    if (route === 'pro') container.innerHTML = Views.renderPro();
    if (route === 'client') container.innerHTML = Views.renderClient();
    if (route === 'admin') container.innerHTML = Views.renderAdmin();
  },

  renderNavbar() {
    const user = DB.getCurrentUser();
    const nav = document.getElementById('nav-menu');
    
    if (!user) {
      nav.innerHTML = `
        <div class="flex gap-3">
          <button class="btn btn-outline" onclick="window.app.showLogin()">Iniciar Sesión</button>
          <button class="btn btn-primary" onclick="window.app.showRegister()">Registrarse</button>
        </div>
      `;
    } else {
      let dashRoute = 'market';
      if(user.role === 'admin') dashRoute = 'admin';
      if(user.role === 'pro') dashRoute = 'pro';
      if(user.role === 'client') dashRoute = 'client';

      nav.innerHTML = `
        <div class="flex gap-4 items-center">
          <span class="text-sm text-muted">Hola, <span class="text-primary fw-600">${user.name}</span></span>
          <button class="btn btn-outline" onclick="window.app.navigate('${dashRoute}')"><i class="bi bi-speedometer2"></i> Mi Panel</button>
          <button class="btn btn-danger" onclick="window.app.logout()"><i class="bi bi-box-arrow-right"></i> Salir</button>
        </div>
      `;
    }
  },

  // --- AUTHENTICATION ---
  showLogin() {
    const html = `
      <h2 class="mb-4">Iniciar Sesión</h2>
      <form id="form-login" onsubmit="event.preventDefault(); window.app.doLogin()">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="l-email" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" id="l-pass" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary w-full mt-4">Entrar</button>
      </form>
    `;
    this.loginModal = UI.openModal(html);
  },

  doLogin() {
    const email = document.getElementById('l-email').value;
    const pass = document.getElementById('l-pass').value;
    
    const user = DB.getUsers().find(u => u.email === email && u.password === pass);
    if (!user) {
      return UI.showToast("Credenciales incorrectas", "error");
    }
    if (user.status === 'blocked') {
      return UI.showToast("Tu cuenta está bloqueada por un administrador.", "error");
    }
    
    DB.setCurrentUser(user);
    UI.closeModal(this.loginModal);
    UI.showToast("Bienvenido " + user.name);
    this.renderNavbar();
    
    if(user.role === 'admin') this.navigate('admin');
    else if(user.role === 'pro') this.navigate('pro');
    else this.navigate('client');
  },

  logout() {
    DB.setCurrentUser(null);
    this.renderNavbar();
    this.navigate('market');
    UI.showToast("Sesión cerrada");
  },

  showRegister() {
    const html = `
      <h2 class="mb-4">Crear Cuenta</h2>
      <form id="form-register" onsubmit="event.preventDefault(); window.app.doRegister()">
        <div class="form-group">
          <label class="form-label text-primary">¿Qué quieres hacer?</label>
          <select id="r-role" class="form-control" onchange="window.app.toggleRegisterFields()">
            <option value="client">Soy Modelo (Quiero postularme a ofertas)</option>
            <option value="pro">Soy Profesional (Quiero publicar ofertas y pagar)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre Completo / Alias</label>
          <input type="text" id="r-name" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="r-email" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono (WhatsApp)</label>
          <input type="text" id="r-phone" class="form-control" required placeholder="+593 999 999 999">
        </div>
        <div class="form-group" id="wallet-group">
          <label class="form-label">Tu Billetera USDT (BEP20) <small class="text-muted">- Donde recibirás pagos</small></label>
          <input type="text" id="r-wallet" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="password" id="r-pass" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary w-full mt-4">Registrarse</button>
      </form>
    `;
    this.registerModal = UI.openModal(html);
  },

  toggleRegisterFields() {
    const role = document.getElementById('r-role').value;
    const walletGroup = document.getElementById('wallet-group');
    const walletInput = document.getElementById('r-wallet');
    
    if(role === 'client') {
      walletGroup.style.display = 'block';
      walletInput.required = true;
    } else {
      walletGroup.style.display = 'none';
      walletInput.required = false;
    }
  },

  doRegister() {
    const role = document.getElementById('r-role').value;
    const email = document.getElementById('r-email').value;
    
    if(DB.getUsers().find(u => u.email === email)) {
      return UI.showToast("El email ya está registrado", "error");
    }

    const newUser = {
      id: DB.generateId(),
      role,
      name: document.getElementById('r-name').value,
      email,
      phone: document.getElementById('r-phone').value,
      wallet: document.getElementById('r-wallet')?.value || '',
      password: document.getElementById('r-pass').value,
      status: 'active'
    };

    const users = DB.getUsers();
    users.push(newUser);
    DB.setUsers(users);
    
    UI.closeModal(this.registerModal);
    UI.showToast("Registro exitoso. Ahora inicia sesión.");
    this.showLogin();
  },

  // --- ACTIONS ---
  applyToOffer(offerId) {
    const user = DB.getCurrentUser();
    const apps = DB.getApps();
    
    if (apps.find(a => a.offerId === offerId && a.clientId === user.id)) {
      return UI.showToast("Ya te postulaste a esta oferta", "error");
    }

    apps.push({ id: DB.generateId(), offerId, clientId: user.id, status: 'pending' });
    DB.setApps(apps);
    
    UI.showToast("Te has postulado con éxito");
    this.navigate('client');
  },

  showCreateOffer() {
    const settings = DB.getSettings();
    const html = `
      <h2 class="mb-2">Publicar Nueva Oferta</h2>
      <p class="text-sm text-muted mb-4">Para publicar tu oferta al público, debes realizar el pago a la plataforma.</p>
      
      <div class="card glass mb-4" style="border-color: var(--primary)">
        <div class="text-primary fw-600 mb-1">Billetera Oficial (USDT BEP20)</div>
        <div class="copy-box">${settings.platformWallet}</div>
      </div>

      <form id="form-offer" onsubmit="event.preventDefault(); window.app.doCreateOffer()">
        <div class="form-group">
          <label class="form-label">Título de la Oferta</label>
          <input type="text" id="o-title" class="form-control" required placeholder="Ej. Masaje Relajante a Domicilio">
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea id="o-desc" class="form-control" required placeholder="Detalles del servicio..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Dirección (Referencia)</label>
          <input type="text" id="o-address" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label">Valor que pagarás (USDT)</label>
          <input type="number" id="o-price" class="form-control" required min="1" step="1" placeholder="Monto total a pagar">
        </div>
        
        <div class="form-group">
          <label class="form-label">Fotos (Opcional)</label>
          <div class="file-input-wrapper">
            <button type="button" class="btn btn-outline w-full"><i class="bi bi-camera"></i> Seleccionar Fotos</button>
            <input type="file" id="o-photos" accept="image/*" multiple onchange="window.app.previewPhotos(event)">
          </div>
          <div id="photo-preview" class="file-preview"></div>
        </div>

        <div class="form-group mt-4">
          <label class="form-label text-success"><i class="bi bi-shield-lock"></i> Hash de la Transacción (TXID)</label>
          <input type="text" id="o-hash" class="form-control" required placeholder="Pega aquí el hash de tu pago en USDT">
        </div>
        
        <button type="submit" class="btn btn-primary w-full mt-2">Enviar a Aprobación</button>
      </form>
    `;
    this.offerModal = UI.openModal(html);
    this.tempPhotos = []; // Reset photos
  },

  previewPhotos(event) {
    const files = event.target.files;
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = '';
    this.tempPhotos = [];

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        preview.appendChild(img);
        this.tempPhotos.push(e.target.result); // Save base64
      };
      reader.readAsDataURL(file);
    });
  },

  doCreateOffer() {
    const user = DB.getCurrentUser();
    const newOffer = {
      id: DB.generateId(),
      proId: user.id,
      title: document.getElementById('o-title').value,
      desc: document.getElementById('o-desc').value,
      address: document.getElementById('o-address').value,
      price: document.getElementById('o-price').value,
      hash: document.getElementById('o-hash').value,
      photos: this.tempPhotos || [],
      status: 'pending' // Admin needs to approve
    };

    const offers = DB.getOffers();
    offers.push(newOffer);
    DB.setOffers(offers);

    UI.closeModal(this.offerModal);
    UI.showToast("Oferta enviada. Un administrador verificará el hash para publicarla.");
    this.navigate('pro');
  },

  acceptClient(appId) {
    if(confirm("¿Estás seguro de aprobar a esta modelo? Podrás ver su contacto para acordar los detalles y la oferta desaparecerá del Market.")) {
      const apps = DB.getApps();
      const appIndex = apps.findIndex(a => a.id === appId);
      const offerId = apps[appIndex].offerId;
      
      // Approve this app
      apps[appIndex].status = 'accepted';
      apps[appIndex].client_confirmed = false;
      apps[appIndex].pro_confirmed = false;
      
      // Reject others for this offer
      apps.forEach(a => {
        if(a.offerId === offerId && a.id !== appId && a.status === 'pending') {
          a.status = 'rejected';
        }
      });
      DB.setApps(apps);

      // Change offer status to assigned
      const offers = DB.getOffers();
      const offerIndex = offers.findIndex(o => o.id === offerId);
      offers[offerIndex].status = 'assigned';
      DB.setOffers(offers);

      UI.showToast("Modelo aprobada con éxito. La oferta fue retirada del Market.");
      this.navigate('pro');
    }
  },

  rejectClient(appId) {
    if(confirm("¿Estás seguro de rechazar y eliminar esta postulación? La modelo no será notificada, pero desaparecerá de tu lista.")) {
      let apps = DB.getApps();
      apps = apps.filter(a => a.id !== appId);
      DB.setApps(apps);
      UI.showToast("Postulación eliminada exitosamente");
      this.navigate('pro');
    }
  },

  claimService(appId) {
    if(confirm("¿Estás seguro de reclamar? Esto significa que la modelo no llegó. La postulación será cancelada y tu oferta volverá a ser publicada en el Market.")) {
      let apps = DB.getApps();
      const app = apps.find(a => a.id === appId);
      
      // Remove this application
      apps = apps.filter(a => a.id !== appId);
      DB.setApps(apps);

      // Return offer to active
      const offers = DB.getOffers();
      const offerIndex = offers.findIndex(o => o.id === app.offerId);
      offers[offerIndex].status = 'active';
      DB.setOffers(offers);

      UI.showToast("Reclamo procesado. Tu oferta vuelve a estar Activa.");
      this.navigate('pro');
    }
  },

  confirmServicePro(appId) {
    if(confirm("¿Confirmas que se realizó el servicio? Esto se combinará con la confirmación de la modelo para liberar el pago.")) {
      const apps = DB.getApps();
      const appIndex = apps.findIndex(a => a.id === appId);
      apps[appIndex].pro_confirmed = true;
      
      if (apps[appIndex].client_confirmed) {
        apps[appIndex].status = 'completed';
        UI.showToast("¡Servicio Completado! Notificación enviada al Admin para pago.");
      } else {
        UI.showToast("Tu confirmación ha sido guardada. Esperando a la Modelo.");
      }
      
      DB.setApps(apps);
      this.navigate('pro');
    }
  },

  confirmService(appId) {
    if(confirm("¿Confirmas que recibiste el servicio? Esto se combinará con la confirmación del Profesional para que liberen tu pago.")) {
      const apps = DB.getApps();
      const appIndex = apps.findIndex(a => a.id === appId);
      apps[appIndex].client_confirmed = true;
      
      if (apps[appIndex].pro_confirmed) {
        apps[appIndex].status = 'completed';
        UI.showToast("¡Servicio Completado! Notificación enviada al Admin para pago.");
      } else {
        UI.showToast("Tu confirmación ha sido guardada. Esperando al Profesional.");
      }
      
      DB.setApps(apps);
      this.navigate('client');
    }
  },

  // --- CLIENT GALLERY ACTIONS ---
  uploadClientPhotos(event) {
    const files = event.target.files;
    const user = DB.getCurrentUser();
    
    if (!user.photos) user.photos = [];
    
    if (user.photos.length + files.length > 5) {
      return UI.showToast("Solo puedes tener un máximo de 5 fotos.", "error");
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        user.photos.push(e.target.result);
        
        // Save to DB when the last file is processed
        const users = DB.getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex].photos = user.photos;
        DB.setUsers(users);
        DB.setCurrentUser(user);
        
        // Re-render to show new photos
        this.navigate('client');
      };
      reader.readAsDataURL(file);
    });
  },

  removeClientPhoto(index) {
    if(confirm("¿Eliminar esta foto?")) {
      const user = DB.getCurrentUser();
      user.photos.splice(index, 1);
      
      const users = DB.getUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      users[userIndex].photos = user.photos;
      
      DB.setUsers(users);
      DB.setCurrentUser(user);
      this.navigate('client');
    }
  },

  viewClientGallery(clientId) {
    const client = DB.getUser(clientId);
    if (!client || !client.photos || client.photos.length === 0) return;
    
    const html = `
      <h2 class="mb-4"><i class="bi bi-images text-primary"></i> Galería de ${client.name}</h2>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${client.photos.map(p => `<img src="${p}" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-light);">`).join('')}
      </div>
    `;
    UI.openModal(html);
  },

  viewPublicProfile(proId, appId) {
    const u = DB.getUser(proId);
    const app = DB.getApps().find(a => a.id === appId);
    
    // Check if the professional has approved the application to reveal contact
    const showContact = app && app.status !== 'pending';

    const html = `
      <h2 class="mb-4">Perfil del Profesional</h2>
      <div class="card glass">
        <p class="mb-2"><strong>Nombre:</strong> ${u.name}</p>
        <p class="mb-2"><strong>Contacto:</strong> ${showContact ? `<span class="text-success"><i class="bi bi-whatsapp"></i> ${u.phone}</span>` : '<span class="text-muted"><i class="bi bi-lock-fill"></i> Oculto hasta ser aprobada</span>'}</p>
        
        ${u.photos && u.photos.length > 0 ? `
          <div class="mt-4 pt-4" style="border-top: 1px solid var(--border-light);">
            <strong class="mb-2 d-block"><i class="bi bi-images text-primary"></i> Galería Personal:</strong>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.5rem; margin-top: 1rem;">
              ${u.photos.map(p => `<img src="${p}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-light);">`).join('')}
            </div>
          </div>
        ` : '<p class="text-muted mt-3">Este profesional no ha subido fotos a su galería.</p>'}
      </div>
    `;
    UI.openModal(html);
  },

  // --- PRO GALLERY ACTIONS ---
  uploadProPhotos(event) {
    const files = event.target.files;
    const user = DB.getCurrentUser();
    
    if (!user.photos) user.photos = [];
    
    if (user.photos.length + files.length > 5) {
      return UI.showToast("Solo puedes tener un máximo de 5 fotos.", "error");
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        user.photos.push(e.target.result);
        
        // Save to DB when the last file is processed
        const users = DB.getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex].photos = user.photos;
        DB.setUsers(users);
        DB.setCurrentUser(user);
        
        // Re-render to show new photos
        this.navigate('pro');
      };
      reader.readAsDataURL(file);
    });
  },

  removeProPhoto(index) {
    if(confirm("¿Eliminar esta foto?")) {
      const user = DB.getCurrentUser();
      user.photos.splice(index, 1);
      
      const users = DB.getUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      users[userIndex].photos = user.photos;
      
      DB.setUsers(users);
      DB.setCurrentUser(user);
      this.navigate('pro');
    }
  },

  // --- ADMIN ACTIONS ---
  approveOffer(offerId) {
    const offers = DB.getOffers();
    const idx = offers.findIndex(o => o.id === offerId);
    offers[idx].status = 'active';
    DB.setOffers(offers);
    UI.showToast("Oferta aprobada y publicada en el Market");
    this.navigate('admin');
  },

  rejectOffer(offerId) {
    if(confirm("¿Estás seguro de cancelar y eliminar esta oferta? El Profesional deberá subir una nueva si se equivocó.")) {
      let offers = DB.getOffers();
      offers = offers.filter(o => o.id !== offerId);
      DB.setOffers(offers);
      UI.showToast("Oferta eliminada exitosamente");
      this.navigate('admin');
    }
  },

  confirmPayment(appId) {
    if(confirm("¿Confirmas que ya enviaste los USDT a la billetera de la modelo?")) {
      const apps = DB.getApps();
      const idx = apps.findIndex(a => a.id === appId);
      apps[idx].status = 'paid';
      DB.setApps(apps);
      UI.showToast("Pago registrado exitosamente");
      this.navigate('admin');
    }
  },

  toggleBlockUser(userId) {
    const users = DB.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    users[idx].status = users[idx].status === 'active' ? 'blocked' : 'active';
    DB.setUsers(users);
    UI.showToast(`Usuario ${users[idx].status === 'active' ? 'desbloqueado' : 'bloqueado'}`);
    this.navigate('admin');
  },

  viewUserProfile(userId) {
    const u = DB.getUser(userId);
    const html = `
      <h2 class="mb-4">Perfil de Usuario</h2>
      <div class="card glass">
        <p class="mb-2"><strong>Nombre:</strong> ${u.name}</p>
        <p class="mb-2"><strong>Email:</strong> ${u.email}</p>
        <p class="mb-2"><strong>Rol:</strong> ${u.role}</p>
        <p class="mb-2"><strong>Teléfono:</strong> ${u.phone || 'N/A'}</p>
        ${u.wallet ? `<p class="mb-2"><strong>Billetera:</strong> <br><span class="copy-box mt-1">${u.wallet}</span></p>` : ''}
        <p class="mb-2"><strong>Estado:</strong> <span class="badge ${u.status==='active'?'badge-success':'badge-danger'}">${u.status}</span></p>
        
        ${u.photos && u.photos.length > 0 ? `
          <div class="mt-4 pt-4" style="border-top: 1px solid var(--border-light);">
            <strong class="mb-2 d-block"><i class="bi bi-images text-primary"></i> Galería de Fotos:</strong>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.5rem; margin-top: 1rem;">
              ${u.photos.map(p => `<img src="${p}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-light);">`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    UI.openModal(html);
  },

  editWallet() {
    const settings = DB.getSettings();
    const user = DB.getCurrentUser();
    const html = `
      <h2 class="mb-4">Configuración General</h2>
      <form onsubmit="event.preventDefault(); window.app.saveSettings()">
        <h3 class="text-primary mb-3" style="font-size: 1rem;"><i class="bi bi-wallet2"></i> Ajustes de Pagos</h3>
        <div class="form-group">
          <label class="form-label">Billetera Oficial (USDT BEP20)</label>
          <input type="text" id="s-wallet" class="form-control" value="${settings.platformWallet}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Comisión de la Plataforma (%)</label>
          <input type="number" id="s-fee" class="form-control" value="${settings.platformFeePercent}" required min="0" max="100">
        </div>
        
        <hr style="border: none; border-top: 1px solid var(--border-light); margin: 1.5rem 0;">
        
        <h3 class="text-primary mb-3" style="font-size: 1rem;"><i class="bi bi-shield-lock"></i> Credenciales de Acceso</h3>
        <div class="form-group">
          <label class="form-label">Correo Electrónico (Login)</label>
          <input type="email" id="s-email" class="form-control" value="${user.email}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input type="text" id="s-pass" class="form-control" value="${user.password}" required>
        </div>

        <button type="submit" class="btn btn-primary w-full mt-4">Guardar Cambios</button>
      </form>
    `;
    this.settingsModal = UI.openModal(html);
  },

  saveSettings() {
    const settings = DB.getSettings();
    settings.platformWallet = document.getElementById('s-wallet').value;
    settings.platformFeePercent = document.getElementById('s-fee').value;
    DB.setSettings(settings);

    // Save Admin credentials
    const user = DB.getCurrentUser();
    user.email = document.getElementById('s-email').value;
    user.password = document.getElementById('s-pass').value;
    
    const users = DB.getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex].email = user.email;
    users[userIndex].password = user.password;
    
    DB.setUsers(users);
    DB.setCurrentUser(user);

    UI.closeModal(this.settingsModal);
    UI.showToast("Configuración y credenciales guardadas");
    this.navigate('admin'); // Refresh
  }
};

// Start application
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
