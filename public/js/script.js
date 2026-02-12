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

(function () {
    const inadimplenciaTable = document.querySelector('[data-inadimplencia-table]');

    if (!inadimplenciaTable) {
        return;
    }

    const tbody = inadimplenciaTable.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr[data-vencimento]'));
    const totalField = document.querySelector('[data-total-inadimplencia]');
    const quantityField = document.querySelector('[data-qtd-inadimplentes]');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalOverdue = 0;
    let overdueResidents = 0;

    rows.forEach((row) => {
        const dueDateValue = row.dataset.vencimento;
        const dueDate = new Date(`${dueDateValue}T00:00:00`);
        const diffInDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        if (!Number.isFinite(diffInDays) || diffInDays <= 30) {
            row.remove();
            return;
        }

        const delayCell = row.querySelector('[data-dias-atraso]');
        if (delayCell) {
            delayCell.textContent = `${diffInDays} dias`;
        }

        const amount = Number.parseFloat(row.dataset.valor || '0');
        if (Number.isFinite(amount)) {
            totalOverdue += amount;
        }

        overdueResidents += 1;
    });

    if (totalField) {
        totalField.textContent = totalOverdue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    if (quantityField) {
        quantityField.textContent = String(overdueResidents);
    }

    if (!tbody.querySelector('tr')) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5">Não há moradores com atraso superior a 30 dias no momento.</td>';
        tbody.appendChild(emptyRow);
    }
})();
