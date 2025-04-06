require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const HF_API_KEY = process.env.HF_API_KEY;
const IMG_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
const VID_API_URL = "https://api-inference.huggingface.co/models/THUDM/CogVideoX-5b-I2V";

if (!HF_API_KEY) {
    console.error("❌ Error: Missing Hugging Face API Key. Set HF_API_KEY in your .env file.");
    process.exit(1);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index", { images: [], video: null, error: null, prompt: "" });
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// IMAGE GENERATION
app.post("/generate", async (req, res) => {
    const prompt = req.body.prompt;
    if (!prompt) return res.redirect("/");

    try {
        const images = [];
        for (let i = 0; i < 2; i++) {
            await delay(2000); // Delay to avoid rate limits

            const response = await axios.post(
                IMG_API_URL,
                { inputs: `${prompt}, variation ${i + 1}` }, // add slight variation
                {
                    headers: { Authorization: `Bearer ${HF_API_KEY}` },
                    responseType: "arraybuffer"
                }
            );

            const base64Image = `data:image/png;base64,${Buffer.from(response.data).toString("base64")}`;
            images.push(base64Image);
        }

        res.render("index", { images, video: null, error: null, prompt });
    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error || "Image API error.";
        res.render("index", { images: [], video: null, error: errorMessage, prompt });
    }
});

// // VIDEO GENERATION
// app.post("/generatevid", async (req, res) => {
//     const prompt = req.body.prompt;
//     if (!prompt) return res.redirect("/");

//     try {
//         const response = await axios.post(
//             VID_API_URL,
//             { inputs: prompt },
//             {
//                 headers: {
//                     Authorization: `Bearer ${HF_API_KEY}`,
//                     Accept: "application/json"
//                 }
//             }
//         );

//         const videoUrl = response.data?.video_url || null;

//         if (!videoUrl) {
//             throw new Error("No video returned.");
//         }

//         res.render("index", { images: [], video: videoUrl, error: null, prompt });
//     } catch (error) {
//         console.error("❌ Video Error:", error.response?.data || error.message);
//         const errorMessage = error.response?.data?.error || "Video generation failed.";
//         res.render("index", { images: [], video: null, error: errorMessage, prompt });
//     }
// });

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
