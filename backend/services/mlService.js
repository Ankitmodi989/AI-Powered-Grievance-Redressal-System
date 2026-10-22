const { execFile } = require("child_process");
const path = require("path");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";
const SCRIPT_PATH = path.resolve(
  __dirname,
  "../../Grievance_System_Project/Grievance_System_Project/ml_pipeline_v2/03_predict_v2.py"
);

// Python executable paths to try
const PYTHON_CANDIDATES = [
  path.resolve(__dirname, "../../translation_api/venv/Scripts/python.exe"),
  "python",
  "py",
];

/**
 * Predict department, severity, validity and confidence using Grievance_System_Project (v2).
 * Tries the HTTP microservice first (ultra-fast < 10ms);
 * falls back to direct Python CLI execution seamlessly.
 */
async function classifyWithML(text) {
  if (!text || !text.trim()) {
    return {
      is_valid_complaint: false,
      department: "INVALID",
      category: "Other",
      priority: "Normal",
      department_confidence: 0,
      severity: null,
      severity_confidence: null,
      needs_review: false,
    };
  }

  // 1. Try fast HTTP microservice
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return formatPrediction(data);
    }
  } catch (err) {
    // HTTP service not running or timed out; fall through to CLI
  }

  // 2. Fallback to direct Python script execution
  return new Promise((resolve) => {
    const pythonExe = PYTHON_CANDIDATES[0];
    const args = [SCRIPT_PATH, "--json", text];

    execFile(pythonExe, args, { timeout: 8000 }, (error, stdout, stderr) => {
      if (error || !stdout) {
        console.error("ML CLI execution error:", error || stderr);
        // Safe fallback in case of system issue
        return resolve({
          is_valid_complaint: true,
          department: "General",
          category: "General",
          priority: "Normal",
          department_confidence: 0.5,
          severity: "Normal",
          severity_confidence: 0.5,
          needs_review: true,
        });
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(formatPrediction(parsed));
      } catch (parseErr) {
        console.error("Failed to parse ML JSON output:", stdout);
        resolve({
          is_valid_complaint: true,
          department: "General",
          category: "General",
          priority: "Normal",
          department_confidence: 0.5,
          severity: "Normal",
          severity_confidence: 0.5,
          needs_review: true,
        });
      }
    });
  });
}

function formatPrediction(raw) {
  const is_valid = raw.is_valid_complaint !== false && raw.department !== "INVALID";

  // Map severity (LOW/MEDIUM/HIGH) to system priority (Low/Normal/High/Critical)
  let priority = "Normal";
  if (raw.severity) {
    const s = raw.severity.toUpperCase();
    if (s === "HIGH") priority = "High";
    else if (s === "LOW") priority = "Low";
    else if (s === "MEDIUM") priority = "Normal";
  }

  return {
    is_valid_complaint: is_valid,
    department: raw.department || "Other",
    category: is_valid ? raw.department : "Other",
    priority: is_valid ? priority : "Normal",
    raw_severity: raw.severity,
    department_confidence: raw.department_confidence ?? 1.0,
    severity_confidence: raw.severity_confidence ?? 1.0,
    needs_review: Boolean(raw.needs_review),
    source: "ml_pipeline_v2",
  };
}

module.exports = { classifyWithML };
