require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const HF_API_KEY = process.env.HF_API_KEY;
const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

if (!HF_API_KEY) {
    console.error("❌ Error: Missing Hugging Face API Key. Set HF_API_KEY in your .env file.");
    process.exit(1);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index", { images: [], error: null, prompt: "" });
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.post("/generate", async (req, res) => {
    const prompt = req.body.prompt;
    if (!prompt) return res.redirect("/");

    try {
        const images = [];
        for (let i = 0; i < 3; i++) {  // Generate only 2 images instead of 3
            await delay(5000);  // Wait 5 seconds to avoid rate limits

            const response = await axios.post(
                API_URL,
                { inputs: prompt },
                {
                    headers: { Authorization: `Bearer ${HF_API_KEY}` },
                    responseType: "arraybuffer"
                }
            );

            const base64Image = `data:image/png;base64,${Buffer.from(response.data).toString("base64")}`;
            images.push(base64Image);
        }

        res.render("index", { images, error: null, prompt });
    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error || "API rate limit reached. Try again later!";
        res.render("index", { images: [], error: errorMessage, prompt });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
