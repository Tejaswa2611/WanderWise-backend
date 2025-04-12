const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeImage = async (imageBuffer) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const imageBase64 = imageBuffer.toString('base64');
    
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze this image for ADA compliance. Check:
                - Ramp slope ≤ 7.5°
                - Door width ≥ 32"
                - Threshold height ≤ 0.5"
                Return JSON with measurements.`
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};
