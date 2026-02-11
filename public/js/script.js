document.addEventListener('DOMContentLoaded', function() {
    // 1. Lógica do Dropdown (Página Inicial - index.html)
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', function(event) {
            event.preventDefault(); 
            dropdownMenu.classList.toggle('show');
        });

        window.addEventListener('click', function(event) {
            if (!event.target.matches('#dropdown-btn')) {
                if (dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                }
            }
        });
    }

    const passwordToggles = document.querySelectorAll('.toggle-password');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            this.classList.toggle('fa-eye-slash');
            this.classList.toggle('fa-eye');
        });
    });

    const loginBtn = document.getElementById('login-button-final');

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = '../admin/painel-admin.html';
        });
    }
});

// Dropdown toggle: abre/fecha por clique, fecha ao clicar fora, fecha com Esc
(function() {
  document.addEventListener('click', function (e) {
    // encontra todos os dropdowns abertos e fecha quando clicar fora
    const openDropdowns = document.querySelectorAll('.dropdown.show');
    openDropdowns.forEach(dd => {
      if (!dd.contains(e.target)) dd.classList.remove('show');
    });
  });

  // Abre/fecha ao clicar no botão específico
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('#dropdown-btn, .cta-button[data-target="dropdown"]');
    if (!btn) return;
    const dropdown = btn.closest('.dropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('show');
    e.stopPropagation(); // evita disparar o listener global que fecharia imediatamente
  });

  // fecha com Esc
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      document.querySelectorAll('.dropdown.show').forEach(dd => dd.classList.remove('show'));
    }
  });
})();
