// Este script e para adicionar interatividade ao seu site.
// A nova funcao controla o envio do formulario de contato.

// Quando a pagina terminar de carregar, executa a funcao:
window.onload = function() {
    console.log("Bem-vindo ao Projeto Nexus!");
    console.log("Site carregado com sucesso.");
    
    // 1. Encontra o formulario na pagina, usando a tag <form>
    const formulario = document.querySelector('form');

    // 2. Adiciona um 'ouvinte' para quando o evento de 'submit' (envio) acontecer
    formulario.addEventListener('submit', function(event) {
        // 3. Impede o comportamento padrao do formulario (nao recarrega a pagina)
        event.preventDefault();

        // 4. Exibe uma mensagem de sucesso (voce pode ver no console do navegador)
        console.log("Formulario enviado com sucesso! Entraremos em contato em breve.");
        
        // Exemplo: mostrar um alerta na tela para o usuario
        alert("Mensagem enviada! Agradecemos o seu contato.");

        // 5. Limpa os campos do formulario depois de enviar
        formulario.reset();
    });
};