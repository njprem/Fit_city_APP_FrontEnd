import React, { useMemo } from "react";

const FALLBACK_URL =
  "http://10.0.0.11:5601/app/dashboards#/view/0e2de6a7-70d8-4a39-9cf0-ef067697779c?embed=true&_g=(refreshInterval:(pause:!t,value:60000),time:(from:now-15m,to:now))&_a=()";

// Kibana embed sized to fill the available admin content area.
const AdminDashboard: React.FC = () => {
  const embedUrl = useMemo(() => import.meta.env.VITE_KIBANA_EMBED_URL || FALLBACK_URL, []);
  const isMixedContent =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    embedUrl.toLowerCase().startsWith("http://");

  const iframe = (
    <div className="relative w-full h-[calc(100vh-160px)] min-h-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <iframe
        title="Admin analytics dashboard"
        src={embedUrl}
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        allow="fullscreen; clipboard-write; cross-origin-isolated"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
      />
    </div>
  );

  return (
    <section className="flex flex-col flex-1 min-h-screen bg-gray-50 p-6 gap-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Live analytics from Kibana</p>
      </header>

      <div className="flex-1 space-y-3">
        {isMixedContent && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            The dashboard URL uses <code>http://</code> while this page is served over HTTPS. Browsers block
            mixed content, so the embed may not render. Please expose Kibana over HTTPS or proxy it behind the
            same origin.
          </div>
        )}
        {embedUrl ? (
          iframe
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm">
            Dashboard URL is not configured. Set <code>VITE_KIBANA_EMBED_URL</code> to your Kibana embed link.
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminDashboard;
