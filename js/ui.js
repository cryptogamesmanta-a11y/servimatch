// ui.js - Funciones de interfaz de usuario

const UI = {
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger';
    
    toast.innerHTML = `
      <i class="bi ${icon} fs-4"></i>
      <div>${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  openModal(contentHTML) {
    const container = document.getElementById('modals-container');
    
    const modalId = 'modal-' + Math.random().toString(36).substr(2, 9);
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}">
        <div class="modal-content">
          <button class="modal-close" onclick="document.getElementById('${modalId}').remove()"><i class="bi bi-x"></i></button>
          ${contentHTML}
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', modalHTML);
    const modalEl = document.getElementById(modalId);
    
    // Force reflow and animate in
    setTimeout(() => modalEl.classList.add('active'), 10);
    
    return modalId; // Retorna el ID para poder cerrarlo programáticamente
  },
  
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }
};
