import { useState, useRef } from 'react';
import { analyzeImageWithAI, searchFoodNutrition } from './services/nutrition';
import './App.css';

const TAG_POSITIONS = [
  { top: '28%', left: '35%' },
  { top: '55%', left: '30%' },
  { top: '40%', left: '68%' },
  { top: '70%', left: '55%' },
  { top: '25%', left: '60%' },
];

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (err) {
      console.error("Erreur d'accès à la caméra :", err);
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsScanning(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);

    stopCamera();

    try {
      const result = await analyzeImageWithAI(imageData);

      if (result.items.length > 0) {
        const offData = await searchFoodNutrition(result.items[0].name.toLowerCase());
        if (offData) {
          console.log("Données OFF trouvées:", offData);
        }
      }

      setAnalysisResult(result);
      setShowDashboard(true);
    } catch (error) {
      console.error("Erreur analyse:", error);
      alert("Erreur lors de l'analyse. Veuillez réessayer.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScanner = () => {
    setAnalysisResult(null);
    setShowDashboard(false);
    setCapturedImage(null);
    startCamera();
  };

  const getMacroPercent = (value, type) => {
    const dailyGoals = { fat: 70, carbs: 300, protein: 60 };
    return Math.min(100, Math.round((value / dailyGoals[type]) * 100));
  };

  return (
    <div className="container animate-fade-in">
      {!showDashboard ? (
        <div className="scanner-container">
          <header>
            <h1>CaloScan IA</h1>
            <p>Scannez votre repas, l'IA fait le reste</p>
          </header>

          <div className="viewport glass-panel">
            {!isScanning && !isAnalyzing && (
              <div className="camera-placeholder">
                <div className="icon-pulse">
                  <span className="camera-icon">📸</span>
                </div>
                <button className="btn-primary" onClick={startCamera}>
                  Lancer le scan
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`camera-feed ${isScanning ? 'visible' : 'hidden'}`}
            />

            {isAnalyzing && (
              <div className="analysis-overlay">
                <div className="pulse-circle"></div>
                <p className="shimmer-text">Analyse en cours...</p>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {isScanning && (
            <div className="controls">
              <button
                className="capture-btn"
                onClick={captureAndAnalyze}
                disabled={isAnalyzing}
                aria-label="Prendre une photo"
              >
                <div className="inner-btn"></div>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="dashboard-container">
          <header className="dash-header">
            <button className="btn-back" onClick={resetScanner} aria-label="Retour">
              ←
            </button>
            <div className="header-titles">
              <h2>Résultat</h2>
              <span className="confidence-pill">
                Confiance {(analysisResult.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </header>

          <div className="result-card glass-card">
            <div className="image-preview">
              <img src={capturedImage} alt="Aliments analysés" />
              {analysisResult.items.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="floating-tag"
                  style={{
                    top: TAG_POSITIONS[idx]?.top || '50%',
                    left: TAG_POSITIONS[idx]?.left || '50%',
                    animationDelay: `${idx * 0.15}s`,
                  }}
                >
                  {item.name}
                </div>
              ))}
            </div>

            <div className="total-score">
              <div className="score-val">
                <span className="number">{analysisResult.totalCalories}</span>
                <span className="unit">kcal</span>
              </div>
              <p className="food-name">{analysisResult.name}</p>
            </div>
          </div>

          <div className="macros-grid">
            <div className="macro-item glass-card">
              <span className="macro-icon">🔥</span>
              <span className="macro-val">{analysisResult.totalMacros.fat}g</span>
              <span className="macro-label">Lipides</span>
              <div className="macro-bar">
                <div
                  className="macro-bar-fill"
                  style={{ width: `${getMacroPercent(analysisResult.totalMacros.fat, 'fat')}%` }}
                />
              </div>
            </div>
            <div className="macro-item glass-card">
              <span className="macro-icon">⚡</span>
              <span className="macro-val">{analysisResult.totalMacros.carbs}g</span>
              <span className="macro-label">Glucides</span>
              <div className="macro-bar">
                <div
                  className="macro-bar-fill"
                  style={{ width: `${getMacroPercent(analysisResult.totalMacros.carbs, 'carbs')}%` }}
                />
              </div>
            </div>
            <div className="macro-item glass-card">
              <span className="macro-icon">💪</span>
              <span className="macro-val">{analysisResult.totalMacros.protein}g</span>
              <span className="macro-label">Protéines</span>
              <div className="macro-bar">
                <div
                  className="macro-bar-fill"
                  style={{ width: `${getMacroPercent(analysisResult.totalMacros.protein, 'protein')}%` }}
                />
              </div>
            </div>
          </div>

          <div className="details-section glass-card">
            <h3>Détail par aliment</h3>
            <div className="items-list">
              {analysisResult.items.map((item, idx) => (
                <div key={idx} className="food-item">
                  <div className="food-info">
                    <span className="dot" />
                    <strong>{item.name}</strong>
                    <span className="weight">{item.weight}</span>
                  </div>
                  <span className="cal">{item.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>

          <div className="actions">
            <button className="btn-secondary" onClick={resetScanner}>
              Rescanner
            </button>
            <button className="btn-primary" onClick={() => alert("Repas enregistré !")}>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
