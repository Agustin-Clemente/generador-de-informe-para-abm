
import { GoogleGenAI, Type } from "@google/genai";
import { ReportData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Schema for the data to be extracted by the AI.
const reportSchema = {
  type: Type.OBJECT,
  properties: {
    expediente: { type: Type.STRING, description: "The full 'Número de Expediente'. Its source depends on the logic path." },
    fecha: { type: Type.STRING, description: "The relevant date. If 'FECHA DE CESE' in section '5. CESE' has a date, use it. Otherwise, use the 'FECHA' from section '4. TOMA DE POSESIÓN'." },
    motivoDeCese: { type: Type.STRING, description: "The reason for cessation, from 'MOTIVO DE CESE' in section '5. CESE'. This should ONLY be populated if 'FECHA DE CESE' has a date." },
    reemplazaA: { type: Type.STRING, description: "The person being replaced. This should ONLY be populated if 'FECHA DE CESE' is empty. Combine name, CUIL, and reason from 'DOCENTE INTERINO'/'TITULAR'." },
    cuil: { type: Type.STRING, description: "The CUIL of the proposed teacher ('DOCENTE PROPUESTO')." },
    rol: { type: Type.STRING, description: "The role of the proposed teacher. Its value depends on the logic path." },
    apellidoYNombre: { type: Type.STRING, description: "Full name of the proposed teacher ('DOCENTE PROPUESTO')." },
    situacionDeRevista: { type: Type.STRING, description: "Based on 'CARÁCTER DE LA DESIGNACIÓN'. Map 'SUPLENTE' to '4', 'INTERINO' to '3', and 'TITULAR' to '2'." },
    cargoACubrir: { type: Type.STRING, description: "A detailed job description. Combine 'CARGO A CUBRIR', 'ASIGNATURA', 'HORAS CÁTEDRA A CUBRIR', 'AÑO / DIV / COM / NIV', and 'Turno'. Formatting rules are critical: after the hours value (e.g., '2.00'), append ' hs'. For the 'AÑO / DIV' part (e.g., '2 / 1 / /'), format it as '2° 1°'. The final string must be a clean, comma-separated list, e.g., 'PROFESOR DE EDUCACIÓN MEDIA, EDUCACIÓN TECNOLÓGICA, 2.00 hs, 2° 1° Turno Tarde'." },
  },
  required: [
    "expediente", "fecha", "cuil", "rol", "apellidoYNombre", "situacionDeRevista", "cargoACubrir"
  ]
};


export const extractDataFromDocumentText = async (text: string): Promise<ReportData> => {
  const prompt = `
    Analyze the following OCR text from a two-page document about a teacher appointment in Argentina.
    Extract ONLY the information required by the provided schema and return it as a JSON object.

    **Definitions for clarity:**
    *   **Expediente de Alta**: The file number located in section '4. TOMA DE POSESIÓN'.
    *   **Expediente de Cese**: A file number that might appear directly under or associated with section '5. CESE'.

    **Primary Logic Path:**
    1.  **Check for Cessation ('CESE')**: First, look at section '5. CESE'. If the 'FECHA DE CESE' field contains a valid date, you are reporting a cessation.
    2.  **If Reporting a Cessation**:
        *   **expediente**: Look for an 'Expediente de Cese'. If found, use it. If not found, use the 'Expediente de Alta'.
        *   **fecha**: Use the date from 'FECHA DE CESE'.
        *   **motivoDeCese**: Extract the text from 'MOTIVO DE CESE'. **IMPORTANT**: If the extracted value starts with 'presentacion' (case-insensitive), the final value MUST be 'Presentación reemplazado'.
        *   **rol**: Extract the 'Rol:' value. **CRITICAL**: If the value is not a number (i.e., it is empty or not present), you MUST replace the final value with a string formatted as: "aun no posee rol, alta tramitada por [Expediente de Alta]". For example: "aun no posee rol, alta tramitada por E.E. - 34142629 - 2025 - ESC200866".
        *   **reemplazaA**: This field must be null or omitted.
    3.  **If NOT Reporting a Cessation** (i.e., 'FECHA DE CESE' is empty):
        *   **expediente**: Use the 'Expediente de Alta' (e.g., 'E.E. - 34142629 - 2025 - ESC200866').
        *   **fecha**: Use the date from 'FECHA' in section '4. TOMA DE POSESIÓN'.
        *   **reemplazaA**: Extract the information about the person being replaced (usually labeled 'DOCENTE INTERINO' or 'DOCENTE TITULAR'). Combine their name, CUIL, and the reason for coverage ('MOTIVO DE LA COBERTURA').
        *   **motivoDeCese**: This field must be null or omitted.
        *   **rol**: Look for a value next to 'Rol:'. If it is missing or empty, return the exact string 'No se consigna rol por error de integracion'.

    **Other extraction rules (apply in both cases unless overridden above):**
    *   **Situación de revista**: Use the 'CARÁCTER DE LA DESIGNACIÓN' value for the proposed teacher and map it as follows: 'SUPLENTE' becomes '4', 'INTERINO' becomes '3', 'TITULAR' becomes '2'.
    *   **Cargo a cubrir**: Create a single, clean, comma-separated string following these exact formatting rules:
        a. Start with the value from 'CARGO A CUBRIR'.
        b. If 'ASIGNATURA' has a value, append it.
        c. **Conditional Logic**: If 'HORAS CÁTEDRA A CUBRIR' has a numeric value **greater than 0** (e.g., '2.00'):
            i. Append the numeric value followed immediately by ' hs'. For example, '2.00' becomes '2.00 hs'.
            ii. After appending the hours, check for 'AÑO / DIV / COM / NIV'. If it has values like '2 / 1 / /', format and append it as '2° 1°'. Use the degree symbol (°).
            **IMPORTANT: The 'AÑO / DIV / COM / NIV' part should ONLY be added if 'HORAS CÁTEDRA A CUBRIR' has a value greater than 0.**
        d. Append the 'Turno' value at the very end.
        e. The final string must not include any field labels. Example (with hours): 'PROFESOR DE EDUCACIÓN MEDIA, EDUCACIÓN TECNOLÓGICA, 2.00 hs, 2° 1° Turno Tarde'. Example (without hours): 'MAESTRO DE MATERIAS ESPECIALES TECNOLOGÍAS, DISEÑO Y PROGRAMACIÓN (EDUCACIÓN SUPERIOR) Turno TARDE'.
    
    Here is the document text:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    const finalData: ReportData = {
      ...parsedData,
      establecimiento: "E.N.S. 2 EN L.VIVAS M. ACOSTA",
      telefono: "49317981",
      delegacion: "III",
      reparticion: "3511",
    };

    return finalData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Fallo al procesar el documento.");
  }
};
