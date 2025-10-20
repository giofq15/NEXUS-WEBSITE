document.addEventListener('DOMContentLoaded', function() {
    // 1. Lógica do Dropdown (Página Inicial - index.html)
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', function(event) {
            // Previne que o clique dispare ações padrão do botão
            event.preventDefault(); 
            // Alterna a classe 'show' no menu
            dropdownMenu.classList.toggle('show');
        });

        // Fecha o dropdown se o usuário clicar fora dele
        window.addEventListener('click', function(event) {
            // Verifica se o clique não foi no botão e se o menu está visível
            if (!event.target.matches('#dropdown-btn')) {
                if (dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                }
            }
        });
    }

    // 2. Lógica para mostrar/esconder senha (Página de Login - login.html)
    const passwordToggles = document.querySelectorAll('.toggle-password');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // O input de senha é o elemento anterior ao ícone no HTML
            const passwordInput = this.previousElementSibling;
            
            // Alterna entre os tipos 'password' e 'text'
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Altera o ícone de olho aberto/fechado
            this.classList.toggle('fa-eye-slash');
            this.classList.toggle('fa-eye');
        });
    });

    // 3. Lógica para simular o Login e Redirecionar (Página de Login - login.html)
    const loginBtn = document.getElementById('login-button-final');

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            // Simulação de login bem-sucedido para continuar o desenvolvimento do Front-End
            window.location.href = 'painel-admin.html';
        });
    }
});