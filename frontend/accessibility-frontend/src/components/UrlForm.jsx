import { useState } from "react";

export default function UrlForm({ onSubmit, loading }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(url);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow-md w-full max-w-md"
    >
      <h1 className="text-xl font-bold mb-4 text-center">
        Accessibility Analyzer
      </h1>

      <input
        type="url"
        required
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />

      <button
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 mt-4 rounded"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </form>
  );
}
