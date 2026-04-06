import React, { useState, useRef, useEffect } from 'react';
import { analyzeImageWithAI, searchFoodNutrition } from './services/nutrition';
import './App.css';

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
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setIsScanning(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;
    
    setIsAnalyzing(true);
    
    // Capture de l'image
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    
    // On arrête la caméra
    stopCamera();

    try {
      // Analyse IA (Simulée avec Gemini Vision)
      const result = await analyzeImageWithAI(imageData);
      
      // Optionnel : Recherche de données supplémentaires sur Open Food Facts
      // pour le premier item détecté par exemple
      if (result.items.length > 0) {
        const offData = await searchFoodNutrition(result.items[0].name.toLowerCase());
        if (offData) {
          console.log("Données OFF trouvées:", offData);
          // On pourrait enrichir le résultat ici
        }
      }

      setAnalysisResult(result);
      setShowDashboard(true);
    } catch (error) {
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

  return (
    <div className="container animate-fade-in">
      {!showDashboard ? (
        <div className="scanner-container">
          <header>
            <h1>CaloScan IA</h1>
            <p className="text-muted">Analyse nutritionnelle instantanée</p>
          </header>

          <div className="viewport glass-panel">
            {!isScanning && !isAnalyzing && (
              <div className="camera-placeholder">
                <div className="icon-pulse">
                  <span className="camera-icon">📸</span>
                </div>
                <button className="btn-primary" onClick={startCamera}>
                  Démarrer le Scan
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
                <p className="shimmer-text">Analyse de l'assiette en cours...</p>
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
              ✕
            </button>
            <div className="header-titles">
              <h2>Analyse Terminée</h2>
              <span className="confidence-pill">IA confiante à {(analysisResult.confidence * 100).toFixed(0)}%</span>
            </div>
          </header>

          <div className="result-card glass-card">
            <div className="image-preview">
              <img src={capturedImage} alt="Aliments analysés" />
              {/* Simulation de tags visuels sur l'image */}
              <div className="floating-tag" style={{ top: '30%', left: '40%' }}>Avocat</div>
              <div className="floating-tag" style={{ top: '60%', left: '30%' }}>Pain</div>
              <div className="floating-tag" style={{ top: '45%', left: '65%' }}>Œuf</div>
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
              <span className="macro-val">{analysisResult.totalMacros.fat}g</span>
              <span className="macro-label">Lipides</span>
            </div>
            <div className="macro-item glass-card">
              <span className="macro-val">{analysisResult.totalMacros.carbs}g</span>
              <span className="macro-label">Glucides</span>
            </div>
            <div className="macro-item glass-card">
              <span className="macro-val">{analysisResult.totalMacros.protein}g</span>
              <span className="macro-label">Protéines</span>
            </div>
          </div>

          <div className="details-section glass-card">
            <h3>Détails par portion</h3>
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
            <button className="btn-secondary" onClick={resetScanner}>Resscaner</button>
            <button className="btn-primary" onClick={() => alert("Consommation enregistrée !")}>
              Enregistrer le repas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
