const { Groq } = require("groq-sdk");

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
                            "Roads",
                            "Water Supply",
                            "Electricity",
                            "Sanitation",
                            "Healthcare",
                            "Education",
                            "Corruption",
                            "Public Safety",
                            "Other",
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
 * Sends the user's message to Groq. The model decides whether this is
 * a normal chat message or a grievance, and responds accordingly.
 *
 * Returns either:
 *   { type: "chat", reply: "..." }
 * or
 *   { type: "grievance", data: { category, priority, region, summary } }
 */
async function analyzeMessage(text) {
    const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
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
                category: args.category,
                priority: args.priority,
                region: args.region,
                summary: args.summary,
            },
        };
    }

    // Normal conversation
    return {
        type: "chat",
        reply: message.content,
    };
}

module.exports = { analyzeMessage };