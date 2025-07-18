import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/lobby.module.css';

export default function Lobby() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'lobby', 'campaign'
  const [showLoading, setShowLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const inLobby = sessionStorage.getItem('inLobby');
    
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Check if user was already in lobby
    if (inLobby === 'true') {
      setCurrentScreen('lobby');
    }

    // Fetch user profile
    fetchUserProfile(token);
  }, [router]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const showLoadingScreen = () => {
    setShowLoading(true);
    setTimeout(() => {
      setShowLoading(false);
    }, 600);
  };

  const handleStartGame = () => {
    showLoadingScreen();
    setTimeout(() => {
      setCurrentScreen('lobby');
      sessionStorage.setItem('inLobby', 'true');
    }, 600);
  };

  const handleCampaign = () => {
    showLoadingScreen();
    setTimeout(() => {
      setCurrentScreen('campaign');
    }, 600);
  };

  const handleBackToLobby = () => {
    showLoadingScreen();
    setTimeout(() => {
      setCurrentScreen('lobby');
    }, 600);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('inLobby');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Loading Screen */}
      {showLoading && (
        <div className={styles.loadingScreen}>
        </div>
      )}

      {/* Home Screen */}
      {currentScreen === 'home' && (
        <div className={styles.gameContainer}>
          <div className={styles.overlay}>
            <h1 className={styles.gameTitle}>Revenge: Angels & Demons</h1>
            <p className={styles.startText} onClick={handleStartGame}>Pulsa para iniciar</p>
            <div className={styles.serverSelector}>
              <span>S0 - Beta</span>
              <button>Pulsa para cambiar</button>
            </div>
          </div>
        </div>
      )}

      {/* Lobby Screen */}
      {currentScreen === 'lobby' && (
        <div className={styles.gameLobby}>
          <img className={styles.background} src="/Background/Gacha.png" alt="Background"/>
          <div className={styles.topBar}>
            <div className={styles.header}>
              <div className={styles.playerInfo}>
                <img src="/characters/face/Fimmergreen.png" alt="Avatar"/>
                <span>Lvl {user?.level || 1}</span>
                <div className={styles.playerDetails}>
                  <span className={styles.playerName}>{user?.username || 'SasakiRyo'}</span>
                  <span className={styles.vipLevel}>VIP 0</span>
                </div>
              </div>
              <div className={styles.currencyBar}>
                <div className={styles.currencyItem}>
                  <span className={styles.iconGold}>💰</span>
                  <span className={styles.value}>{user?.currency?.gold || 0}</span>
                  <span className={styles.addButton}>+</span>
                </div>
                <div className={styles.currencyItem}>
                  <span className={styles.iconDiamond}>💎</span>
                  <span className={styles.value}>{user?.currency?.diamonds || 0}</span>
                  <span className={styles.addButton}>+</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.mainContent}>
            <img className={styles.bgCharacter} src="/characters/BackgroundCharacter/BCimmergreen.png" alt="Main Character" />
            <div className={styles.menuRight}>
              <button onClick={() => router.push('/vending')}>Vending</button>
              <button onClick={() => router.push('/gacha')}>Gacha</button>
              <button onClick={() => router.push('/training')}>Training</button>
            </div>
            <div className={styles.menuBottom}>
              <button onClick={handleCampaign}>Campaign</button>
            </div>
          </div>

          <div className={styles.sideMenu}>
            <button>Mission</button>
            <button>Mail</button>
            <button>Social</button>
            <button>Ranking</button>
          </div>

          <div className={styles.bottomBar}>
            <button>Guild</button>
            <button>Bag</button>
            <button>Character</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}

      {/* Campaign Screen */}
      {currentScreen === 'campaign' && (
        <div className={styles.campaignContainer}>
          <h1>Bejeweled Adventure</h1>
          <div className={styles.stageMap}>
            <p>Complete levels to unlock new stages!</p>
          </div>
          <div className={styles.gameArea}>
            <h2>Level 1</h2>
            <div className={styles.box}></div>
            <div className={styles.scoreDisplay}>Score: 0</div>
            <div className={styles.comboDisplay} style={{display: 'none'}}>Combo x<span>1</span>!</div>
          </div>
          <button onClick={handleBackToLobby}>Back to Lobby</button>
        </div>
      )}
    </>
  );
}