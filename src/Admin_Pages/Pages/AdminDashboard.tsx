import React from "react";

const DASHBOARD_EMBED_URL =
  "http://10.0.0.11:5601/app/dashboards#/view/0e2de6a7-70d8-4a39-9cf0-ef067697779c?embed=true&_g=(refreshInterval:(pause:!t,value:60000),time:(from:now-15m,to:now))&_a=()";

// Kibana embed sized to fill the available admin content area.
const AdminDashboard: React.FC = () => {
  return (
    <section className="flex flex-col flex-1 min-h-screen bg-gray-50 p-6 gap-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Live analytics from Kibana</p>
      </header>

      <div className="flex-1">
        <div className="relative w-full h-[calc(100vh-160px)] min-h-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <iframe
            title="Admin analytics dashboard"
            src={DASHBOARD_EMBED_URL}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            allowFullScreen
            sandbox="allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
