
  document.querySelectorAll('.eye-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    const inputId = icon.dataset.target;        // obtiene el id del input asociado
    const input = document.getElementById(inputId);

    if (!input) return;                         // seguridad: si no existe, no hace nada

    if (input.type === 'password') {
      input.type = 'text';
      icon.src = '../images/Ojito2.png'; // ojo abierto
      icon.alt = 'Ocultar contraseña';
    } else {
      input.type = 'password';
      icon.src = '../images/Ojito.png'; // ojo cerrado
      icon.alt = 'Mostrar contraseña';
    }
  });
});
