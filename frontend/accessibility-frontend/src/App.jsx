import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const analyzeWebsite = async () => {
    if (!url) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const res = await fetch("http://localhost:8080/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();

      // 🔒 SAFETY CHECK
      if (!data || !Array.isArray(data.issues)) {
        throw new Error("Invalid response");
      }

      setReport(data);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Backend error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Web Accessibility Analyzer</h1>

      <input
        type="text"
        className="w-full max-w-md p-2 rounded text-black mb-4"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={analyzeWebsite}
        disabled={loading}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {report && (
        <div className="mt-6 bg-gray-800 p-4 rounded w-full max-w-lg">
          <p><strong>URL:</strong> {report.url}</p>
          <p><strong>Score:</strong> {report.score}/100</p>

          <h3 className="mt-2 font-semibold">Issues</h3>
          <ul className="list-disc list-inside">
            {report.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;