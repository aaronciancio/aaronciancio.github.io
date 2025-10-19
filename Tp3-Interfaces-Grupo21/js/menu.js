
// Elementos
  const sideMenu = document.getElementById('sideMenu');   // menú izquierdo
  const userMenu = document.getElementById('userMenu');   // menú derecho
  const overlay  = document.getElementById('overlay');    // fondo oscuro (opcional)

  // Botones (íconos en el header)
  const menuBtn = document.querySelector('.menu-icon');
  const userBtn = document.querySelector('.user-icon');

  // Sincroniza overlay según si hay algún menú abierto
  function syncOverlay() {
    const anyOpen =
      (sideMenu && sideMenu.classList.contains('active')) ||
      (userMenu && userMenu.classList.contains('active'));
    if (overlay) overlay.classList.toggle('active', anyOpen);
  }

  // Helpers de apertura/cierre
  function toggleLeft()  { sideMenu?.classList.toggle('active'); userMenu?.classList.remove('active'); syncOverlay(); }
  function toggleRight() { userMenu?.classList.toggle('active'); sideMenu?.classList.remove('active'); syncOverlay(); }
  function closeAll()    { sideMenu?.classList.remove('active'); userMenu?.classList.remove('active'); syncOverlay(); }

  // Click en los botones
  menuBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleLeft(); });
  userBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleRight(); });

  // Cerrar con overlay (si lo usás)
  overlay?.addEventListener('click', closeAll);

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  // Cerrar al hacer click fuera de los menús (a prueba de e.stopPropagation)
  document.addEventListener('click', (e) => {
    const clickedInsideLeft  = sideMenu?.contains(e.target);
    const clickedInsideRight = userMenu?.contains(e.target);
    const clickedOnButtons   = e.target.closest('.menu-icon, .user-icon');

    if (!clickedInsideLeft && !clickedInsideRight && !clickedOnButtons) {
      closeAll();
    }
  }, true);

  