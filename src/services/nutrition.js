// src/services/nutrition.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const OFF_API_URL = "https://world.openfoodfacts.org/api/v2";

let genAI = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Clé API Gemini manquante. Configurez VITE_GEMINI_API_KEY.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Recherche des informations nutritionnelles pour un aliment spécifique.
 */
export const searchFoodNutrition = async (query) => {
  try {
    const response = await fetch(
      `${OFF_API_URL}/search?categories_tags=${encodeURIComponent(query)}&fields=product_name,nutriments,image_url&page_size=1`
    );
    const data = await response.json();

    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      return {
        name: product.product_name,
        calories: Math.round(product.nutriments["energy-kcal_100g"] || 0),
        macros: {
          fat: product.nutriments.fat_100g || 0,
          carbs: product.nutriments.carbohydrates_100g || 0,
          protein: product.nutriments.proteins_100g || 0,
        },
        image: product.image_url,
      };
    }

    return null;
  } catch (error) {
    console.error("Erreur API Open Food Facts:", error);
    return null;
  }
};

/**
 * Analyse une image de nourriture avec Gemini Vision et retourne les infos nutritionnelles.
 * @param {string} imageData - L'image en base64 (data URL).
 */
export const analyzeImageWithAI = async (imageData) => {
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });

  // Extraire le base64 pur du data URL
  const base64Data = imageData.split(",")[1];
  const mimeType = imageData.split(";")[0].split(":")[1];

  const prompt = `Tu es un nutritionniste expert. Analyse cette image de nourriture et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks, sans texte autour) avec cette structure exacte :

{
  "name": "Nom du plat ou de l'ensemble des aliments",
  "items": [
    { "name": "Nom de l'aliment", "weight": "poids estimé en grammes (ex: 120g)", "calories": nombre_entier }
  ],
  "totalCalories": nombre_entier_total,
  "totalMacros": {
    "fat": nombre_entier_en_grammes,
    "carbs": nombre_entier_en_grammes,
    "protein": nombre_entier_en_grammes
  },
  "confidence": nombre_entre_0_et_1
}

Sois précis dans tes estimations de poids et calories. Si tu ne peux pas identifier clairement un aliment, donne ta meilleure estimation avec une confidence plus basse.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();

  // Nettoyer la réponse (enlever les backticks markdown si présents)
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Erreur de parsing JSON Gemini:", text);
    throw new Error("L'IA n'a pas pu analyser correctement l'image.");
  }
};
