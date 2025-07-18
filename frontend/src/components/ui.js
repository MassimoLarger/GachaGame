document.addEventListener('DOMContentLoaded', () => {
  const homeScreen = document.getElementById('home-screen');
  const lobbyScreen = document.getElementById('lobby-screen');
  const campaignScreen = document.getElementById('campaign-screen');

  const startButton = document.getElementById('startButton');
  const campaignButton = document.getElementById('campaignButton');
  const backToLobbyFromCampaign = document.getElementById('backToLobbyFromCampaign');
  const vendingButton = document.getElementById('vendingButton');
  const gachaButton = document.getElementById('gachaButton');
  const trainingButton = document.getElementById('trainingButton');

  // Referencias a hojas de estilos (link tags con id)
  const lobbyCSS = document.getElementById('lobby-css');
  const campaignCSS = document.getElementById('campaign-css');

  // Overlay carga
  const loadingScreen = document.getElementById('loading-screen');

  function showLoading() {
    loadingScreen.style.display = 'block';
    void loadingScreen.offsetWidth; // Forzar reflow
    loadingScreen.classList.remove('hide');
    loadingScreen.classList.add('show');
  }

  function hideLoading() {
    loadingScreen.classList.remove('show');
    loadingScreen.classList.add('hide');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }

  // Estado inicial: si ya está en lobby en sesión, mostrar lobby, sino home
  if (sessionStorage.getItem('inLobby') === 'true') {
    homeScreen.style.display = 'none';
    lobbyScreen.style.display = 'grid';
    campaignScreen.style.display = 'none';
    lobbyCSS.disabled = false;
    campaignCSS.disabled = true;
  } else {
    homeScreen.style.display = 'block';
    lobbyScreen.style.display = 'none';
    campaignScreen.style.display = 'none';
    lobbyCSS.disabled = false;
    campaignCSS.disabled = true;
  }

  // Pasar de home a lobby
  startButton.addEventListener('click', () => {
    showLoading();
    setTimeout(() => {
      homeScreen.style.display = 'none';
      lobbyScreen.style.display = 'grid';
      campaignScreen.style.display = 'none';

      sessionStorage.setItem('inLobby', 'true');

      lobbyCSS.disabled = false;
      campaignCSS.disabled = true;
      hideLoading();
    }, 600);
  });

  // Pasar de lobby a campaign
  campaignButton.addEventListener('click', () => {
    showLoading();
    setTimeout(() => {
      homeScreen.style.display = 'none';
      lobbyScreen.style.display = 'none';
      campaignScreen.style.display = 'block';

      lobbyCSS.disabled = true;
      campaignCSS.disabled = false;
      hideLoading();
    }, 600);
  });

  // Volver de campaign a lobby
  backToLobbyFromCampaign.addEventListener('click', () => {
    showLoading();
    setTimeout(() => {
      campaignScreen.style.display = 'none';
      lobbyScreen.style.display = 'grid';

      lobbyCSS.disabled = false;
      campaignCSS.disabled = true;
      hideLoading();
    }, 600);
  });

  // Botones que redirigen a otras pantallas
  gachaButton.addEventListener('click', () => {
    window.location.href = 'gacha.html';
  });

  vendingButton.addEventListener('click', () => {
    window.location.href = 'vending.html';
  });

  trainingButton.addEventListener('click', () => {
    window.location.href = 'training.html';
  });

  // Tiempo de inactividad (4 horas)
  let inactivityTime = function () {
    let time;
    window.onload = resetTimer;
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
    document.onmousedown = resetTimer;
    document.ontouchstart = resetTimer;
    document.onclick = resetTimer;
    document.onscroll = resetTimer;

    function logout() {
      sessionStorage.removeItem('inLobby');
      homeScreen.style.display = 'block';
      lobbyScreen.style.display = 'none';
      campaignScreen.style.display = 'none';

      lobbyCSS.disabled = false;
      campaignCSS.disabled = true;
    }

    function resetTimer() {
      clearTimeout(time);
      time = setTimeout(logout, 14400000);
    }
  };
  inactivityTime();
});