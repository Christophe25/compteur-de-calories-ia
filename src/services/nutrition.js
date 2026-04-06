// src/services/nutrition.js

const OFF_API_URL = "https://world.openfoodfacts.org/api/v2";

/**
 * Recherche des informations nutritionnelles pour un aliment spécifique.
 * @param {string} query - Le nom de l'aliment identifié par l'IA.
 * @returns {Promise<Object>} - Les données nutritionnelles.
 */
export const searchFoodNutrition = async (query) => {
  try {
    // Dans une app réelle, on utiliserait le endpoint de recherche d'Open Food Facts
    // Pour ce MVP, on cible la recherche par mots-clés
    const response = await fetch(`${OFF_API_URL}/search?categories_tags=${encodeURIComponent(query)}&fields=product_name,nutriments,image_url&page_size=1`);
    const data = await response.json();

    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      return {
        name: product.product_name,
        calories: Math.round(product.nutriments['energy-kcal_100g'] || 0),
        macros: {
          fat: product.nutriments.fat_100g || 0,
          carbs: product.nutriments.carbohydrates_100g || 0,
          protein: product.nutriments.proteins_100g || 0
        },
        image: product.image_url
      };
    }
    
    // Si non trouvé sur OFF (souvent le cas pour les produits frais/plats), 
    // l'IA Vision fournira une estimation (simulée ici)
    return null;
  } catch (error) {
    console.error("Erreur API Open Food Facts:", error);
    return null;
  }
};

/**
 * Simule l'analyse d'image par Gemini Vision
 * @param {string} imageData - L'image en base64.
 */
export const analyzeImageWithAI = async (imageData) => {
  // Cette fonction simulerait l'envoi de l'image à Gemini
  // Pour le moment, nous retournons un résultat simulé de haute qualité
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "Petit-déjeuner Avocat & Œufs",
        items: [
          { name: "Avocat", weight: "120g", calories: 192 },
          { name: "Œuf poché", weight: "50g", calories: 72 },
          { name: "Pain de seigle", weight: "40g", calories: 104 }
        ],
        totalCalories: 368,
        totalMacros: {
          fat: 21,
          carbs: 42,
          protein: 14
        },
        confidence: 0.96
      });
    }, 2000);
  });
};
