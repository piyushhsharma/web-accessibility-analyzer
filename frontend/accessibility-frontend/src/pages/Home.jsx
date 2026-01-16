import { useState } from "react";
import UrlForm from "../components/UrlForm";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { analyzeWebsite } from "../services/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const handleAnalyze = async (url) => {
    setLoading(true);
    setError("");

    try {
      const res = await analyzeWebsite(url);
      setReport(res.data);
    } catch {
      setError("Failed to analyze website");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <UrlForm onSubmit={handleAnalyze} loading={loading} />
      {loading && <Loader />}
      <ErrorMessage message={error} />

      {report && (
        <div className="mt-6 bg-white p-4 rounded shadow max-w-md w-full">
          <h2 className="font-bold mb-2">Score: {report.score}</h2>
          <ul className="list-disc pl-5">
            {report.issues.map((i, idx) => (
              <li key={idx}>
                <strong>{i.impact}</strong>: {i.description} (WCAG {i.wcag})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
