const counter = document.getElementById('loading');
const duration = 6000; // 6 segundos
const total = 100;
const intervalTime = duration / total; // tiempo por incremento

let current = 0;
const interval = setInterval(() => {
    // Incrementa el contador y actualiza el texto
    current++;
    counter.textContent = "Cargando... " + current + "%";

    if (current >= total) {
        clearInterval(interval);
        // Redirige a otra página
        window.location.href = "home.html";
    }
    }, intervalTime);