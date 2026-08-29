import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API endpoint to generate personalized meal and exercise plans
app.post("/api/generate-recommendations", async (req, res) => {
  try {
    const { bmi, category, height, weight, unitSystem, age, gender, activityLevel, goal, dietaryPreference } = req.body;

    if (!bmi || !category) {
      return res.status(400).json({ error: "Missing BMI or health category details." });
    }

    if (!ai) {
      // Return beautiful fallback recommendation plan if API key is not configured or placeholder
      return res.json({
        mealPlan: `### 🥗 Personalized Meal Plan (Pro Trial Fallback)
Since active Gemini API credentials are simulated, here are some recommended nutritional guidelines for **${category}** (BMI: **${bmi}**):

1. **Balanced Macronutrients**: Aim for lean proteins (30%), complex carbohydrates (40%), and healthy fats (30%).
2. **Proper Portioning**: Control portions to align with your health goal of **${goal || "maintenance"}**.
3. **Dietary Preference**: Tailoring nutrient sources to your preference (${dietaryPreference || "none specified"}).
4. **Hydration**: Drink at least 2.5 to 3 liters of water daily to maintain metabolic efficiency.
5. **Micronutrients**: Increase intake of fresh green leafy vegetables, seeds, and seasonal whole fruits.

*Tip: For a fully calibrated AI model recommendation, provide a valid GEMINI_API_KEY in the environment secrets.*`,
        exercisePlan: `### 🏋️ Personalized Exercise Program (Pro Trial Fallback)
Suggested adaptive workouts based on your health goal: **${goal || "general fitness"}**:

- **Cardiovascular Training**: 150 minutes of moderate-intensity cardio (brisk walking, cycling, or swimming) per week.
- **Strength/Resistance**: 2-3 sessions weekly focusing on major muscle groups (squats, pushups, lunges, or overhead lifts) to boost lean mass.
- **Mobility & Recovery**: Perform dynamic stretches before workouts and static stretches/yoga post-session.
- **Activity Calibration**: Formulated specifically for a **${activityLevel || "moderate"}** lifestyle.`
      });
    }

    const prompt = `You are an elite, certified clinical nutritionist and personalized athletic fitness coach.
Generate a structured, highly valuable, and encouraging health plan for a client with the following health metrics and goals:
- **Gender**: ${gender || "Not specified"}
- **Age**: ${age || "Not specified"} years old
- **Height**: ${height} ${unitSystem === "metric" ? "cm" : "inches"}
- **Weight**: ${weight} ${unitSystem === "metric" ? "kg" : "lbs"}
- **Calculated BMI**: ${bmi}
- **Current Category**: ${category} (underweight/normal/overweight/obese)
- **Active Goal**: ${goal || "Health Maintenance"}
- **Activity Level**: ${activityLevel || "Moderately Active"}
- **Dietary Preference/Restrictions**: ${dietaryPreference || "No specific restrictions"}

Please generate:
1. A structured description header indicating what the program aims to accomplish.
2. A Meal & Nutrition Plan: Specific dietary recommendations, macronutrient balance advice, and hydration guidelines suitable for their category, goal, and dietary preference.
3. An Exercise & Activity Plan: Suggested types of exercise (strength, cardio, flexibility), weekly frequency, and specific workout templates suited to their current activity level and goal.

Ensure the plans are actionable, clear, compassionate, and beautifully formatted in standard Markdown (with headings, bold markers, bullet points, and clean lists). Avoid any dangerous training techniques. Remind them to consult a healthcare provider before making major lifestyle changes. Make sure to divide the output into clean Meal Plan and Exercise Plan sections so they can be parsed out or displayed nicely.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const bodyText = response.text || "";

    // Parse the Markdown or split it split into meal and exercise plan sections for clean rendering
    // We can return the full text or split it by looking for common headings
    res.json({
      plan: bodyText,
      mealPlan: bodyText.split(/##? (?:Exercise|Workout)/i)[0] || bodyText,
      exercisePlan: bodyText.indexOf("Exercise") !== -1 ? bodyText.substring(bodyText.search(/##? (?:Exercise|Workout)/i)) : "Refer to the comprehensive plan above."
    });

  } catch (err: any) {
    console.error("Gemini recommendation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate personalized health plans." });
  }
});

// Serve health facts or affiliate options dynamically if desired
app.get("/api/health-insights", (req, res) => {
  res.json({
    trackers: [
      {
        id: "tracker-1",
        name: "ProFit Active smart tracker",
        description: "Accurately logs daily steps, calories burned, sleep cycles, and real-time heart rate monitoring.",
        price: "$49.99",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&auto=format&fit=crop&q=60",
        affiliateUrl: "#fitbit-tracker",
        badge: "Highly Rated"
      },
      {
        id: "tracker-2",
        name: "SyncHealth smart scale v3",
        description: "Measures weight, body fat %, muscle mass, and syncs directly with our health platform history.",
        price: "$29.99",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop&q=60",
        affiliateUrl: "#smart-scale",
        badge: "Best Seller"
      }
    ],
    supplements: [
      {
        id: "supp-1",
        name: "VibrantBio Plant-Based Whey Protein",
        description: "Premium vegan-friendly organic protein with full amino acid profiles to support lean muscle maintenance.",
        price: "$34.99",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=400&auto=format&fit=crop&q=60",
        affiliateUrl: "#plant-protein"
      },
      {
        id: "supp-2",
        name: "DailyVita Omega-3 & Antioxidant Complex",
        description: "Supports brain health, joint flexibility, and cardiovascular recovery.",
        price: "$19.99",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=60",
        affiliateUrl: "#omega-antioxidant"
      }
    ]
  });
});

// Vite dev server vs static build routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
