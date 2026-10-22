const { Groq } = require("groq-sdk");
const { classifyWithML } = require("./mlService");

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Tool the model can "call" when it detects a real grievance
const tools = [
    {
        type: "function",
        function: {
            name: "file_grievance",
            description:
                "Call this ONLY when the user is describing a real civic issue/complaint " +
                "(e.g. road damage, water supply problem, electricity outage, sanitation issue, " +
                "corruption, healthcare/education issue, public safety concern). " +
                "Do NOT call this for greetings, small talk, or general questions.",
            parameters: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        enum: [
                            "Roads / Public Works",
                            "Waste Management / Sanitation",
                            "Electricity / Street Lighting",
                            "Water Supply",
                            "Drainage / Sewerage",
                            "Traffic / Transport",
                            "Parks / Public Spaces",
                            "Other Civic Services",
                            "Roads",
                            "Sanitation",
                            "Electricity",
                        ],
                    },
                    priority: {
                        type: "string",
                        enum: ["Low", "Normal", "High", "Critical"],
                    },
                    region: {
                        type: "string",
                        description: "City/area mentioned by user, or 'Unknown' if not mentioned",
                    },
                    summary: {
                        type: "string",
                        description: "A short one-line summary of the issue",
                    },
                },
                required: ["category", "priority", "region", "summary"],
            },
        },
    },
];

/**
 * Sends the user's message to Groq and/or the local ML model (Grievance_System_Project v2).
 * Returns either:
 *   { type: "chat", reply: "..." }
 * or
 *   { type: "grievance", data: { category, priority, region, summary, confidence, needs_review, source } }
 */
async function analyzeMessage(text) {
    // 1. Run local trained ML pipeline (Grievance_System_Project v2)
    const mlResult = await classifyWithML(text);

    try {
        const response = await client.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI assistant for a Government Grievance Redressal System (IGRS). " +
                        "Your ONLY job is to: " +
                        "(1) help citizens file grievances/complaints about civic issues (roads, water, " +
                        "electricity, sanitation, healthcare, education, corruption, public safety, etc.), " +
                        "(2) answer basic questions about how the grievance portal works (how to file a " +
                        "complaint, how to check status, what info is needed, greetings/small talk), and " +
                        "(3) call the file_grievance function when the user clearly describes a civic complaint. " +
                        "\n\n" +
                        "If the user asks something unrelated to grievances or this portal — such as general " +
                        "knowledge questions, coding/programming questions, definitions unrelated to civic " +
                        "issues, or any other off-topic request — politely decline and steer them back. " +
                        "For example, reply with something like: " +
                        "\"I'm here to help with civic grievances and this portal — I can't help with that. " +
                        "Would you like to report an issue?\" " +
                        "Do NOT answer off-topic questions, even briefly.",
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            tools,
            tool_choice: "auto",
            temperature: 0.3,
        });

        const message = response.choices[0].message;

        // Model decided this is a grievance
        if (message.tool_calls && message.tool_calls.length > 0) {
            const args = JSON.parse(message.tool_calls[0].function.arguments);
            return {
                type: "grievance",
                data: {
                    category: mlResult.is_valid_complaint ? mlResult.category : args.category,
                    priority: mlResult.is_valid_complaint ? mlResult.priority : args.priority,
                    region: args.region || "Unknown",
                    summary: args.summary || text.slice(0, 100),
                    confidence: mlResult.department_confidence,
                    needs_review: mlResult.needs_review,
                    source: mlResult.is_valid_complaint ? "ml_pipeline_v2" : "groq",
                },
            };
        }

        // If Groq didn't trigger tool call, but ML model is highly confident (>0.75) it is a valid complaint
        if (mlResult.is_valid_complaint && mlResult.department_confidence >= 0.75) {
            return {
                type: "grievance",
                data: {
                    category: mlResult.category,
                    priority: mlResult.priority,
                    region: "Unknown",
                    summary: text.slice(0, 100),
                    confidence: mlResult.department_confidence,
                    needs_review: mlResult.needs_review,
                    source: "ml_pipeline_v2",
                },
            };
        }

        // Normal conversation
        return {
            type: "chat",
            reply: message.content,
        };
    } catch (err) {
        console.warn("Groq API unavailable, using local ML model fallback:", err.message);

        // Fallback to local ML model
        if (mlResult.is_valid_complaint) {
            return {
                type: "grievance",
                data: {
                    category: mlResult.category,
                    priority: mlResult.priority,
                    region: "Unknown",
                    summary: text.slice(0, 100),
                    confidence: mlResult.department_confidence,
                    needs_review: mlResult.needs_review,
                    source: "ml_pipeline_v2_fallback",
                },
            };
        }

        return {
            type: "chat",
            reply: "Hello! I am your AI Civic Assistant. How can I assist you with your civic grievance today?",
        };
    }
}

module.exports = { analyzeMessage };