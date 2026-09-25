async function atualizarStatus() {
  const res = await fetch('/status');
  const data = await res.json();
  document.getElementById('status').innerText = 
    `Enviados: ${data.enviados} | Visualizados: ${data.visualizados} | Pulados: ${data.pulados} | Inválidos: ${data.invalidos} | Total: ${data.total}`;
}

function iniciar() {
  fetch('/iniciar').then(() => atualizarStatus());
}

function parar() {
  fetch('/parar').then(() => atualizarStatus());
}

setInterval(atualizarStatus, 5000);
