// Al cargar la página...
window.addEventListener('DOMContentLoaded', function() {
  // Agrega el evento de scroll al carrusel principal
  const mainViewport = document.querySelector('.main-carousel-viewport');
  if (mainViewport) {
    // Actualiza la escala al hacer scroll
    mainViewport.addEventListener('scroll', updateMainCarouselScale);
    // Inicializa la escala al cargar la página
    updateMainCarouselScale();
  }
  // Inicializa el carrusel infinito
  makeMainCarouselInfinite();

  makeCommonCarouselsInfinite();
});

// Funciones del carrusel común

document.addEventListener('DOMContentLoaded', function() {

  // Realiza el scroll al hacer click en los botones en los carruseles comunes
  document.querySelectorAll('.carousel-container').forEach(container => {
    const leftBtn = container.querySelector('.carousel-btn.left');
    const rightBtn = container.querySelector('.carousel-btn.right');
    const viewport = container.querySelector('.carousel-viewport');
    if (!viewport) return;

    if (leftBtn) {
      leftBtn.addEventListener('click', function() {
        viewport.scrollBy({ left: -265, behavior: 'smooth' });
      });
    }
    if (rightBtn) {
      rightBtn.addEventListener('click', function() {
        viewport.scrollBy({ left: 265, behavior: 'smooth' });
      });
    }
  });
});

// Aplica animaciones de dirección de scroll a las tarjetas de los carruseles secundarios
document.querySelectorAll('.carousel-viewport').forEach(viewport => {

  let lastScrollLeft = 0; // Guarda la posición anterior del scroll
  let scrollTimeout; // Para controlar el tiempo de la animación

  viewport.addEventListener('scroll', () => {
    const currentScrollLeft = viewport.scrollLeft; // Posición actual del scroll
    let directionClass = '';

    // Determina la dirección del scroll
    if (currentScrollLeft > lastScrollLeft) {
      directionClass = 'scrolling-right'; // Se está desplazando a la derecha
    } else if (currentScrollLeft < lastScrollLeft) {
      directionClass = 'scrolling-left'; // Se está desplazando a la izquierda
    }

    // Aplica la clase de animación a todas las tarjetas del carrusel
    viewport.querySelectorAll('.game-card').forEach(card => {
      card.classList.remove('scrolling-right', 'scrolling-left'); // Limpia clases previas
      if (directionClass) card.classList.add(directionClass); // Agrega la clase correspondiente
    });

    lastScrollLeft = currentScrollLeft; // Actualiza la posición del scroll

    // Elimina la clase de animación después de un breve tiempo para resetear el efecto
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      viewport.querySelectorAll('.game-card').forEach(card => {
        card.classList.remove('scrolling-right', 'scrolling-left');
      });
    }, 200); // Puedes ajustar el tiempo de la animación
  });
});

function makeCommonCarouselsInfinite() {
  // Recorre todos los viewports de carruseles secundarios
  document.querySelectorAll('.carousel-viewport').forEach(viewport => {

    // Obtiene el carrusel y sus tarjetas
    const carousel = viewport.querySelector('.carousel');
    const cards = carousel.querySelectorAll('.game-card');
    if (cards.length < 2) return; // Si hay menos de 2 tarjetas, no hace nada

    const N = 6; // Número de tarjetas a clonar al inicio y al final
    // Clona las primeras y últimas N tarjetas para crear el efecto infinito
    for (let i = 0; i < N; i++) {
      carousel.appendChild(cards[i].cloneNode(true)); // Clona al final
      carousel.insertBefore(cards[cards.length - 1 - i].cloneNode(true), carousel.firstChild); // Clona al inicio
    }

    // Ajusta el scroll para que empiece después de los clones del inicio
    viewport.scrollTo({ left: carousel.children[N].offsetLeft - viewport.offsetLeft, behavior: 'instant' });

    // Detecta el scroll y salta al otro extremo si es necesario para mantener el loop
    viewport.addEventListener('scroll', function() {
      const maxScroll = carousel.scrollWidth - viewport.clientWidth;
      // Si llega al principio (clones), salta al final real
      if (viewport.scrollLeft <= 2) {
        setTimeout(() => {
          viewport.scrollTo({ left: carousel.children[cards.length].offsetLeft - viewport.offsetLeft, behavior: 'instant' });
        }, 50);
      }
      // Si llega al final (clones), salta al inicio real
      else if (viewport.scrollLeft >= maxScroll - 2) {
        setTimeout(() => {
          // Alinea la sexta card (índice N+5) con el final del viewport
          const sixthCard = carousel.children[N + 5];
          // Calcula la posición para que el borde derecho de la sexta tarjeta coincida con el borde derecho del viewport
          const scrollTo = sixthCard.offsetLeft + sixthCard.offsetWidth - viewport.clientWidth - viewport.offsetLeft;
          viewport.scrollTo({ left: scrollTo, behavior: 'instant' });
        }, 50);
      }
    });
  });
}

// Funciones del carrusel principal

// Realiza el scroll al hacer click en los botones en el carrusel principal
document.addEventListener('DOMContentLoaded', function() {
  const mainContainer = document.querySelector('.main-carousel-container');
  if (!mainContainer) return;
  const leftBtn = mainContainer.querySelector('.carousel-btn.left');
  const rightBtn = mainContainer.querySelector('.carousel-btn.right');
  const viewport = mainContainer.querySelector('.main-carousel-viewport');
  if (!viewport) return;

  if (leftBtn) {
    leftBtn.addEventListener('click', function() {
      viewport.scrollBy({ left: -470, behavior: 'smooth' });
    });
  }
  if (rightBtn) {
    rightBtn.addEventListener('click', function() {
      viewport.scrollBy({ left: 470, behavior: 'smooth' });
    });
  }
});

let jumped = false;
// Ajusta la escala de las tarjetas del carrusel principal
function updateMainCarouselScale() {

  // Obtiene el viewport y las cards del carrusel principal
  const viewport = document.querySelector('.main-carousel-viewport');
  const cards = viewport.querySelectorAll('.main-carousel .game-card');
  // Obtiene las dimensiones y posición del viewport
  const viewportRect = viewport.getBoundingClientRect();
  let closestCard = null;
  let minDistance = Infinity;

  // Busca la tarjeta cuyo centro esté más cerca del centro del viewport
  cards.forEach(card => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    const distance = Math.abs(cardCenter - viewportCenter);

    if (distance < minDistance) {
      minDistance = distance;
      closestCard = card;
    }
  });

  // Quita la clase 'centered' de todas las tarjetas
  cards.forEach(card => card.classList.remove('centered'));
  cards.forEach(card => card.classList.remove('no-transition'));
  // Agrega la clase 'centered' a la tarjeta más cercana al centro
  if (closestCard) closestCard.classList.add('centered');

  if (jumped) {
    if (closestCard) closestCard.classList.add('no-transition');
    jumped = false;
  } 
}

// Hace que el carrusel principal sea infinito
function makeMainCarouselInfinite() {
  const viewport = document.querySelector('.main-carousel-viewport');
  const carousel = viewport.querySelector('.main-carousel');
  const cards = carousel.querySelectorAll('.game-card');
  if (cards.length < 2) return; // Si hay menos de 2 tarjetas, no hace nada

  // Clona las primeras y últimas N tarjetas para crear el efecto infinito
  const N = 2; // Número de tarjetas a clonar al inicio y al final
  for (let i = 0; i < N; i++) {
    carousel.appendChild(cards[i].cloneNode(true)); // Clona al final
    carousel.insertBefore(cards[cards.length - 1 - i].cloneNode(true), carousel.firstChild); // Clona al inicio
  }

  // Ajusta el scroll para que empiece en la posición correcta (después de los clones del inicio)
  viewport.scrollTo({ left: carousel.children[N].offsetLeft - viewport.offsetLeft - (8 / 100) * viewport.clientWidth, behavior: 'instant' });

  // Detecta el scroll y salta al otro extremo si es necesario para mantener el loop
  viewport.addEventListener('scroll', function() {
    const maxScroll = carousel.scrollWidth - viewport.clientWidth;
    // Si llega al principio (clones), salta al final real
    if (viewport.scrollLeft <= 1) {
    jumped = true;
      setTimeout(() => {
        viewport.scrollTo({ left: carousel.children[cards.length].offsetLeft - viewport.offsetLeft - (8 / 100) * viewport.clientWidth, behavior: 'instant' });
      }, 50);
    } 
    // Si llega al final (clones), salta al inicio real
    else if (viewport.scrollLeft >= maxScroll - 1) {
    jumped = true;
      setTimeout(() => {
        viewport.scrollTo({ left: carousel.children[N].offsetLeft - viewport.offsetLeft - (46 / 100) * viewport.clientWidth, behavior: 'instant' });
      }, 50);
    }
  });
}