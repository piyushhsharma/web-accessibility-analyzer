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

    setError("");
    setLoading(true);
    setReport(null);

    try {
      const res = await fetch("http://localhost:8080/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError("Failed to analyze website");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 text-white">
      <h1 className="text-3xl font-bold mb-4">Web Accessibility Analyzer</h1>

      <input
        type="text"
        placeholder="Enter website URL (https://example.com)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="p-2 rounded text-black w-full max-w-md mb-4"
      />

      <button
        onClick={analyzeWebsite}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {report && (
        <div className="mt-6 w-full max-w-lg bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Accessibility Report</h2>
          <p><strong>URL:</strong> {report.url}</p>
          <p><strong>Score:</strong> {report.score}/100</p>

          <h3 className="mt-2 font-semibold">Issues</h3>
          <ul className="list-disc list-inside">
            {report.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
