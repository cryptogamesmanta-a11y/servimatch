const Views = {
  
  // --- Nivel 2: MARKET (Público) ---
  renderMarket() {
    const offers = DB.getOffers().filter(o => o.status === 'active');
    const user = DB.getCurrentUser();
    
    let html = `
      <div class="animate-fade-in">
        <div class="hero">
          <h1>Encuentra las mejores ofertas en <span>ServiMatch</span></h1>
          <p>Descubre oportunidades publicadas por profesionales y recibe beneficios directos.</p>
        </div>
        
        <h2 class="mb-4"><i class="bi bi-stars text-primary"></i> Ofertas Disponibles</h2>
    `;
    
    if (offers.length === 0) {
      html += `<div class="card text-center text-muted"><i class="bi bi-inbox fs-1 mb-2 d-block"></i> No hay ofertas publicadas por el momento.</div>`;
    } else {
      html += `<div class="grid-cards">`;
      offers.forEach(o => {
        const pro = DB.getUser(o.proId);
        html += `
          <div class="card glass">
            ${o.photos && o.photos.length > 0 ? `<img src="${o.photos[0]}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">` : ''}
            <h3>${o.title}</h3>
            <p class="text-sm mb-2"><i class="bi bi-person-fill text-primary"></i> ${pro.name}</p>
            <p class="mb-4">${o.desc}</p>
            <div class="flex justify-between items-center mb-4">
              <span class="text-sm text-muted"><i class="bi bi-geo-alt"></i> ${o.address}</span>
              <span class="text-primary fw-600 fs-5">$${o.price} USDT</span>
            </div>
            
            ${user?.role === 'client' ? 
              `<button class="btn btn-primary w-full" onclick="window.app.applyToOffer('${o.id}')">Postularse a Oferta</button>` : 
              (!user ? `<button class="btn btn-outline w-full" onclick="window.app.showLogin()">Inicia sesión para postular</button>` : '')
            }
          </div>
        `;
      });
      html += `</div>`;
    }
    
    html += `</div>`;
    return html;
  },

  // --- Nivel 3: PROFESIONAL ---
  renderPro() {
    const user = DB.getCurrentUser();
    const offers = DB.getOffers().filter(o => o.proId === user.id);
    const apps = DB.getApps();
    
    let html = `
      <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-4">
          <h2>Panel de Profesional</h2>
          <button class="btn btn-primary" onclick="window.app.showCreateOffer()"><i class="bi bi-plus-lg"></i> Subir Nueva Oferta</button>
        </div>
        
        <div class="card glass mb-4">
          <h3 class="mb-4"><i class="bi bi-list-task text-primary"></i> Mis Ofertas Publicadas</h3>
          <div class="table-container">
            <table>
              <thead><tr><th>Título</th><th>Precio</th><th>Hash Pago</th><th>Estado</th></tr></thead>
              <tbody>
                ${offers.length === 0 ? `<tr><td colspan="4" class="text-center text-muted">No has subido ofertas.</td></tr>` : 
                  offers.map(o => `
                    <tr>
                      <td class="fw-500">${o.title}</td>
                      <td class="text-primary fw-600">$${o.price}</td>
                      <td><span class="copy-box" style="font-size:0.8rem">${o.hash.substring(0,10)}...</span></td>
                      <td><span class="badge ${o.status === 'active' ? 'badge-success' : 'badge-warning'}">${o.status}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="card glass">
          <h3 class="mb-4"><i class="bi bi-people text-primary"></i> Modelos Postuladas a tus ofertas</h3>
          <div class="table-container">
            <table>
              <thead><tr><th>Oferta</th><th>Modelo</th><th>Teléfono</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
    `;

    const myApps = apps.filter(a => offers.find(o => o.id === a.offerId));
    if (myApps.length === 0) {
      html += `<tr><td colspan="5" class="text-center text-muted">Aún no hay postulaciones.</td></tr>`;
    } else {
      myApps.forEach(a => {
        const offer = offers.find(o => o.id === a.offerId);
        const client = DB.getUser(a.clientId);
        html += `
          <tr>
            <td>${offer.title}</td>
            <td class="fw-500">${client.name}</td>
            <td><span class="text-success"><i class="bi bi-whatsapp"></i> ${client.phone}</span></td>
            <td><span class="badge ${a.status === 'pending' ? 'badge-info' : 'badge-success'}">${a.status}</span></td>
            <td style="display: flex; flex-direction: column; gap: 0.5rem; align-items: start;">
              ${a.status === 'pending' ? `
                <button class="btn btn-success btn-sm w-full" onclick="window.app.acceptClient('${a.id}')">Aprobar Modelo</button>
                <button class="btn btn-danger btn-sm w-full" onclick="window.app.rejectClient('${a.id}')">Rechazar</button>
              ` : ''}
              ${a.status === 'accepted' && !a.pro_confirmed ? `
                <button class="btn btn-primary btn-sm w-full mb-1" onclick="window.app.confirmServicePro('${a.id}')">Confirmar Servicio</button>
                <button class="btn btn-danger btn-sm w-full" onclick="window.app.claimService('${a.id}')">Reclamo (No llegó)</button>
              ` : ''}
              ${a.status === 'accepted' && a.pro_confirmed ? '<span class="text-info text-sm text-center w-full">Esperando Modelo</span>' : ''}
              ${a.status === 'completed' || a.status === 'paid' ? '<span class="text-success text-center w-full fw-500">Confirmado</span>' : ''}
              
              ${client.photos && client.photos.length > 0 ? `<button class="btn btn-outline btn-sm w-full mt-1" onclick="window.app.viewClientGallery('${client.id}')"><i class="bi bi-images"></i> Ver ${client.photos.length} Fotos</button>` : `<button class="btn btn-outline btn-sm w-full mt-1" disabled style="opacity: 0.5;"><i class="bi bi-images"></i> Sin fotos</button>`}
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div></div>
    
        <div class="card glass mt-4">
          <h3 class="mb-2"><i class="bi bi-images text-primary"></i> Mi Galería Personal</h3>
          <p class="text-sm text-muted mb-4">Sube hasta 5 fotos para tu perfil. Los clientes y el administrador podrán verlas.</p>
          
          <div class="file-input-wrapper mb-4">
            <button type="button" class="btn btn-outline w-full"><i class="bi bi-camera"></i> Añadir Fotos (Max 5)</button>
            <input type="file" accept="image/*" multiple onchange="window.app.uploadProPhotos(event)">
          </div>
          
          <div class="grid-cards" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
            ${user.photos && user.photos.length > 0 ? 
              user.photos.map((p, i) => `
                <div style="position:relative;">
                  <img src="${p}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; border:1px solid var(--border-light);">
                  <button class="btn btn-danger btn-sm" style="position:absolute; top:5px; right:5px; padding:0.2rem 0.5rem;" onclick="window.app.removeProPhoto(${i})"><i class="bi bi-trash"></i></button>
                </div>
              `).join('') : '<p class="text-muted" style="grid-column: 1 / -1;">No has subido ninguna foto a tu perfil personal.</p>'
            }
          </div>
        </div>

      </div>`;
    return html;
  },

  // --- Nivel 3: CLIENTE (Modelo) ---
  renderClient() {
    const user = DB.getCurrentUser();
    const myApps = DB.getApps().filter(a => a.clientId === user.id);
    const settings = DB.getSettings();
    
    let totalPaid = 0;
    let totalPending = 0;
    
    myApps.forEach(a => {
      const offer = DB.getOffer(a.offerId);
      if(offer) {
        const montoRecibir = parseFloat(offer.price) * (1 - settings.platformFeePercent/100);
        if (a.status === 'paid') totalPaid += montoRecibir;
        if (a.status === 'completed') totalPending += montoRecibir;
      }
    });
    
    let html = `
      <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="mb-2">Panel de Modelo</h2>
            <p class="mb-4">Gestiona las ofertas a las que te has postulado.</p>
          </div>
          <div class="card glass text-center" style="padding: 1rem 2rem; border-color: var(--success);">
            <div class="text-sm text-muted mb-1">Total Ganado (Pagado)</div>
            <div class="text-success" style="font-size: 1.8rem; font-weight: 700;">$${totalPaid.toFixed(2)} <span style="font-size: 1rem;">USDT</span></div>
            ${totalPending > 0 ? `<div class="text-info text-sm mt-1">En proceso de pago: $${totalPending.toFixed(2)}</div>` : ''}
          </div>
        </div>
        
        <div class="card glass">
          <h3 class="mb-4"><i class="bi bi-bookmark-star text-primary"></i> Mis Postulaciones</h3>
          <div class="table-container">
            <table>
              <thead><tr><th>Profesional</th><th>Servicio</th><th>Monto a Recibir (90%)</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
    `;

    if (myApps.length === 0) {
      html += `<tr><td colspan="5" class="text-center text-muted">No te has postulado a ninguna oferta aún.</td></tr>`;
    } else {
      myApps.forEach(a => {
        const offer = DB.getOffer(a.offerId);
        const pro = DB.getUser(offer.proId);
        const settings = DB.getSettings();
        const montoRecibir = (parseFloat(offer.price) * (1 - settings.platformFeePercent/100)).toFixed(2);
        
        html += `
          <tr>
            <td>
              <div class="fw-500">${pro.name}</div>
              <button class="btn btn-outline btn-sm mt-1 mb-1" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="window.app.viewPublicProfile('${pro.id}', '${a.id}')"><i class="bi bi-person"></i> Ver Perfil</button>
              <div class="text-sm mt-1">${a.status !== 'pending' ? `<i class="bi bi-telephone-fill text-primary"></i> ${pro.phone}` : '<i class="bi bi-lock-fill text-muted"></i>'}</div>
            </td>
            <td>${offer.title}</td>
            <td class="text-success fw-600">$${montoRecibir} USDT</td>
            <td><span class="badge ${a.status === 'completed' || a.status === 'paid' ? 'badge-success' : 'badge-warning'}">${a.status}</span></td>
            <td style="display: flex; flex-direction: column; gap: 0.5rem; align-items: start;">
              ${a.status === 'accepted' && !a.client_confirmed ? `<button class="btn btn-primary btn-sm w-full" onclick="window.app.confirmService('${a.id}')"><i class="bi bi-check2-circle"></i> Confirmar Recepción</button>` : ''}
              ${a.status === 'accepted' && a.client_confirmed ? `<span class="text-info text-sm"><i class="bi bi-hourglass-split"></i> Esperando confirmación del Profesional</span>` : ''}
              ${a.status === 'completed' ? `
                <span class="text-info text-sm"><i class="bi bi-hourglass-split"></i> Esperando Pago del Admin</span>
                <a href="https://wa.me/qr/YKYYCBWPTF6VN1" target="_blank" class="btn btn-outline btn-sm w-full mt-1" style="border-color: var(--success); color: var(--success);"><i class="bi bi-whatsapp"></i> Hablar con Soporte</a>
              ` : ''}
              ${a.status === 'paid' ? `<span class="text-success fw-500"><i class="bi bi-check-all"></i> Pago Completado</span>` : ''}
              ${a.status === 'pending' ? `<span class="text-muted text-sm">Esperando Aprobación</span>` : ''}
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div></div>
    
        <div class="card glass mt-4">
          <h3 class="mb-2"><i class="bi bi-images text-primary"></i> Mi Galería de Fotos</h3>
          <p class="text-sm text-muted mb-4">Sube hasta 5 fotos para que los profesionales puedan verte al postularte a sus ofertas.</p>
          
          <div class="file-input-wrapper mb-4">
            <button type="button" class="btn btn-outline w-full"><i class="bi bi-camera"></i> Añadir Fotos (Max 5)</button>
            <input type="file" accept="image/*" multiple onchange="window.app.uploadClientPhotos(event)">
          </div>
          
          <div class="grid-cards" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
            ${user.photos && user.photos.length > 0 ? 
              user.photos.map((p, i) => `
                <div style="position:relative;">
                  <img src="${p}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; border:1px solid var(--border-light);">
                  <button class="btn btn-danger btn-sm" style="position:absolute; top:5px; right:5px; padding:0.2rem 0.5rem;" onclick="window.app.removeClientPhoto(${i})"><i class="bi bi-trash"></i></button>
                </div>
              `).join('') : '<p class="text-muted" style="grid-column: 1 / -1;">No has subido ninguna foto.</p>'
            }
          </div>
        </div>
        
      </div>`;
    return html;
  },

  // --- Nivel 1: ADMIN (Dueño) ---
  renderAdmin() {
    const settings = DB.getSettings();
    const offers = DB.getOffers();
    const apps = DB.getApps();
    const users = DB.getUsers();

    let platformProfit = 0;
    let pendingProfit = 0;

    apps.forEach(a => {
      if (a.status === 'paid' || a.status === 'completed') {
        const offer = DB.getOffer(a.offerId);
        if(offer) {
          const fee = parseFloat(offer.price) * (settings.platformFeePercent / 100);
          if (a.status === 'paid') platformProfit += fee;
          if (a.status === 'completed') pendingProfit += fee;
        }
      }
    });

    const pendingOffers = offers.filter(o => o.status === 'pending');
    const pendingPayments = apps.filter(a => a.status === 'completed');

    let html = `
      <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-4">
          <h2 style="margin:0;">Panel Principal (Admin)</h2>
          <div class="flex gap-3 items-center">
            <div class="card glass text-center" style="padding: 0.5rem 1rem; border-color: var(--primary); min-width: 180px;">
              <div class="text-sm text-muted">Ganancia Plataforma</div>
              <div class="text-primary fw-700" style="font-size: 1.3rem;">$${platformProfit.toFixed(2)}</div>
              ${pendingProfit > 0 ? `<div class="text-info" style="font-size: 0.75rem;">+ $${pendingProfit.toFixed(2)} pendientes</div>` : ''}
            </div>
            <button class="btn btn-outline" style="height: fit-content;" onclick="window.app.editWallet()"><i class="bi bi-wallet2 text-primary"></i> Config</button>
          </div>
        </div>

        <!-- Aprobación de Ofertas -->
        <div class="card glass mb-4">
          <h3 class="mb-2"><i class="bi bi-shield-check text-primary"></i> Aprobación de Ofertas</h3>
          <p class="text-sm mb-4">Verifica que el depósito de USDT haya llegado a la billetera oficial antes de aprobar.</p>
          <div class="table-container">
            <table>
              <thead><tr><th>Profesional</th><th>Oferta</th><th>Monto</th><th>Hash USDT</th><th>Acción</th></tr></thead>
              <tbody>
                ${pendingOffers.length === 0 ? `<tr><td colspan="5" class="text-center text-muted">No hay ofertas pendientes de aprobación.</td></tr>` : 
                  pendingOffers.map(o => {
                    const pro = DB.getUser(o.proId);
                    return `
                      <tr>
                        <td class="fw-500">${pro.name}</td>
                        <td>${o.title}</td>
                        <td class="text-primary fw-600">$${o.price}</td>
                        <td><div class="copy-box text-sm">${o.hash}</div></td>
                        <td style="display: flex; flex-direction: column; gap: 0.5rem; align-items: start;">
                          <button class="btn btn-success btn-sm w-full" onclick="window.app.approveOffer('${o.id}')"><i class="bi bi-check-lg"></i> Aprobar</button>
                          <button class="btn btn-outline btn-sm w-full" onclick="window.app.viewUserProfile('${pro.id}')"><i class="bi bi-person"></i> Ver Perfil</button>
                          <button class="btn btn-danger btn-sm w-full" onclick="window.app.rejectOffer('${o.id}')"><i class="bi bi-x-lg"></i> Cancelar</button>
                        </td>
                      </tr>
                    `
                  }).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Liberación de Pagos -->
        <div class="card glass mb-4">
          <h3 class="mb-2"><i class="bi bi-cash-coin text-primary"></i> Liberación de Pagos a Modelos</h3>
          <p class="text-sm mb-4">Servicios confirmados. Paga el monto descontando el ${settings.platformFeePercent}% a la billetera de la modelo.</p>
          <div class="table-container">
            <table>
              <thead><tr><th>Oferta (Pro)</th><th>Modelo (Billetera)</th><th>Valor Total</th><th>A Pagar (-${settings.platformFeePercent}%)</th><th>Acción</th></tr></thead>
              <tbody>
                ${pendingPayments.length === 0 ? `<tr><td colspan="5" class="text-center text-muted">No hay pagos pendientes.</td></tr>` : 
                  pendingPayments.map(a => {
                    const offer = DB.getOffer(a.offerId);
                    const client = DB.getUser(a.clientId);
                    const pro = DB.getUser(offer.proId);
                    const montoPagar = (parseFloat(offer.price) * (1 - settings.platformFeePercent/100)).toFixed(2);
                    return `
                      <tr>
                        <td>${offer.title}<br><span class="text-sm text-muted">Por: ${pro.name}</span></td>
                        <td>${client.name}<br><div class="copy-box mt-1 text-sm">${client.wallet}</div></td>
                        <td>$${offer.price}</td>
                        <td class="text-success fw-600 fs-5">$${montoPagar}</td>
                        <td><button class="btn btn-primary btn-sm" onclick="window.app.confirmPayment('${a.id}')">Confirmar Envío</button></td>
                      </tr>
                    `
                  }).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Gestión de Usuarios -->
        <div class="card glass">
          <h3 class="mb-4"><i class="bi bi-people-fill text-primary"></i> Gestión de Usuarios</h3>
          <div class="table-container">
            <table>
              <thead><tr><th>Nombre</th><th>Rol</th><th>Contacto</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td class="fw-500">${u.name}</td>
                    <td><span class="badge badge-info">${u.role.toUpperCase()}</span></td>
                    <td>
                      <div><i class="bi bi-envelope"></i> ${u.email}</div>
                      <div class="text-sm mt-1"><i class="bi bi-telephone"></i> ${u.phone || '-'}</div>
                    </td>
                    <td><span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${u.status}</span></td>
                    <td>
                      <button class="btn btn-outline btn-sm mb-1" onclick="window.app.viewUserProfile('${u.id}')"><i class="bi bi-eye"></i> Perfil</button>
                      ${u.role !== 'admin' ? `<button class="btn ${u.status === 'active' ? 'btn-danger' : 'btn-success'} btn-sm" onclick="window.app.toggleBlockUser('${u.id}')">${u.status === 'active' ? '<i class="bi bi-lock-fill"></i> Bloquear' : '<i class="bi bi-unlock-fill"></i> Desbloquear'}</button>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
    return html;
  }
};
