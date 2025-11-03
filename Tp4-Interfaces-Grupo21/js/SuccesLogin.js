document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // evita el envío automático

    // Ocultar elementos innecesarios
    document.getElementById('social-buttons').classList.remove('social-buttons');
    document.getElementById('social-buttons').classList.add('hidden');
    document.getElementById('login-button').classList.remove('login-btn');
    document.getElementById('login-button').classList.add('hidden');

    // Inicia animacion de registro exitoso
    document.getElementById('success-message').classList.remove('hidden');
    document.getElementById('success-message').classList.add('circle');

    // Si el formulario pasa la validación HTML5
    if (this.checkValidity()) {
      // Todos los campos están completos correctamente
        const duration = 3000; // 6 segundos
        const total = 100;
        const intervalTime = duration / total; // tiempo por incremento

        let current = 0;
        const interval = setInterval(() => {
            // Incrementa el contador y actualiza el texto
            current++;

            if (current >= total) {
                clearInterval(interval);
                // Redirige a otra página
                window.location.href = "loading.html";
            }
        }, intervalTime);
    } else {
      // Dispara el mensaje de validación HTML nativo
      this.reportValidity();
    }
  });