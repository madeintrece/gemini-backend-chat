// En /api/chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Vercel cogerá la API key desde las "Environment Variables"
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // 1. Seguridad: Solo aceptar peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se permite POST' });
  }

  try {
    // 2. Recoger el historial de chat que envía el frontend
    const { history } = req.body; 

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 3. ¡TU PROMPT SECRETO! Aquí defines la personalidad y misión del bot
    const systemPrompt = "Eres 'El Guardián de la Beca', un entrevistador experto, amable pero incisivo. Tu misión es entrevistar a candidatos para 3 becas de una web con IA. Debes recoger SIEMPRE estos 5 datos: Nombre, Email de contacto, Descripción del proyecto, El problema específico que la IA solucionará, y el Objetivo/Visión a 6 meses. No respondas a preguntas fuera de este tema. Cuando tengas los 5 datos, finaliza diciendo: 'Perfecto, [Nombre]. Tu candidatura está registrada. ¡Mucha suerte!'";

    // 4. Preparamos el historial para Gemini
    const chatHistoryForGemini = [
      // Le damos al bot su personalidad
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Entendido. Estoy listo para mi rol. Empezaré saludando al candidato." }] },
      // Añadimos la conversación que ya ha ocurrido
      ...history 
    ];

    const chat = model.startChat({ history: chatHistoryForGemini });

    // 5. Obtenemos el último mensaje del usuario para enviarlo a Gemini
    const lastUserMessage = history[history.length - 1].parts[0].text;

    const result = await chat.sendMessage(lastUserMessage);
    const response = result.response;
    const text = response.text();

    // 6. Devolvemos solo el texto de la respuesta al frontend
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error en el backend:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud de IA' });
  }
}
