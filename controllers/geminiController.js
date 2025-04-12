const multer = require('multer');
const upload = multer();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 

exports.handleGenerateContent = async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (error) {
    console.error("Text generation error:", error);
    res.status(500).json({ error: 'Text generation failed' });
  }
};

exports.analyzeAccessibility = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

      const imageBuffer = req.file.buffer;
      const base64Image = imageBuffer.toString('base64');

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });


      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: base64Image,
          },
        },
        {
          text: `
      You are an accessibility expert analyzing the image for real-world use by people with disabilities.
      
      Provide a detailed analysis covering:
      1. Whether the location or setup is wheelchair-accessible.
      2. If there's a ramp, evaluate its slope, width, presence of handrails, and safety.
      3. Look for clear signage, tactile paths, handrails, or any mobility aids.
      4. Point out barriers like steps, narrow entrances, uneven terrain, or obstructions.
      5. Mention any improvements needed for better accessibility.
      
      Be descriptive and insightful. Avoid generic observations.
          `.trim()
        }
      ]);
      

      const response = await result.response;
      const text = response.text();

      res.json({ analysis: text });
    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({ error: 'Image analysis failed' });
    }
  },
];
