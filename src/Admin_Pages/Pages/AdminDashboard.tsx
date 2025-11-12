// src/App.tsx
type DashboardCardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
};

const adminData = {
  totalAccounts: 5000,
  activeAccounts: 238,
  totalDestinations: 979,
  upcomingDestinations: 48,
  destinationList: [
    {
      id: 1,
      name: "France: Hands-On Cooking Class with Pâtisserie Chef Noémie",
      type: "Food",
      createdBy: "S123456",
      adminName: "Alexander Thalorian Crestfield",
    },
    {
      id: 1,
      name: "France: Hands-On Cooking Class with Pâtisserie Chef Noémie",
      type: "Food",
      createdBy: "S123456",
      adminName: "Alexander Thalorian Crestfield",
    },
    {
      id: 1,
      name: "France: Hands-On Cooking Class with Pâtisserie Chef Noémie",
      type: "Food",
      createdBy: "S123456",
      adminName: "Alexander Thalorian Crestfield",
    },
    {
      id: 1,
      name: "France: Hands-On Cooking Class with Pâtisserie Chef Noémie",
      type: "Food",
      createdBy: "S123456",
      adminName: "Alexander Thalorian Crestfield",
    },
    {
      id: 1,
      name: "France: Hands-On Cooking Class with Pâtisserie Chef Noémie",
      type: "Food",
      createdBy: "S123456",
      adminName: "Alexander Thalorian Crestfield",
    },
  ],
} as const;

function DashboardCard({ title, value, subtitle }: DashboardCardProps) {
  return (
    <div className="bg-white shadow rounded p-4 flex flex-col">
      <span className="text-gray-500 text-sm">{title}</span>
      <span className="text-2xl font-bold">{value}</span>
      {subtitle && <span className="text-green-500 text-sm">{subtitle}</span>}
    </div>
  );
}

function App() {
  return (
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <div className="bg-teal-800 text-white w-64 p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-8">FitCity</h1>
          <nav className="flex flex-col gap-4">
            <button className="bg-teal-100 text-teal-900 font-semibold px-4 py-2 rounded text-left">
              Dashboard
            </button>
            <button className="hover:bg-teal-700 px-4 py-2 rounded text-left flex items-center gap-2">
              Destination Management
            </button>
            <button className="hover:bg-teal-700 px-4 py-2 rounded text-left flex items-center gap-2">
              Destination Request
            </button>
            <button className="hover:bg-teal-700 px-4 py-2 rounded text-left flex items-center gap-2">
              Reporting
            </button>
            <button className="hover:bg-teal-700 px-4 py-2 rounded text-left flex items-center gap-2">
              Account Management
            </button>
          </nav>
        </div>
        <div className="bg-teal-900 rounded p-4 flex items-center gap-2">
          <div className="bg-white text-teal-900 rounded-full w-10 h-10 flex items-center justify-center">
            S
          </div>
          <div>
            <p>Seren Vale</p>
            <p className="text-sm text-gray-300">@Seren.Vale@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100 p-8 overflow-auto">
        <h2 className="text-xl font-semibold mb-6">Dashboard</h2>

        {/* Top Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <DashboardCard title="Total Account" value={adminData.totalAccounts} subtitle="+20%" />
          <DashboardCard title="Active Account" value={adminData.activeAccounts} />
          <DashboardCard title="Total Destination" value={adminData.totalDestinations} />
          <DashboardCard title="Upcoming Destination" value={adminData.upcomingDestinations} />
        </div>

        {/* Graph Placeholder */}
        <div className="bg-white shadow rounded p-4 mb-6 h-48 flex items-center justify-center">
          Graph
        </div>

        {/* Destination Table */}
        <div className="bg-white shadow rounded p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2">Destination ID</th>
                <th className="p-2">Destination Name</th>
                <th className="p-2">Type</th>
                <th className="p-2">Created By</th>
                <th className="p-2">Admin Name</th>
              </tr>
            </thead>
            <tbody>
              {adminData.destinationList.map((dest, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2">{dest.id}</td>
                  <td className="p-2">{dest.name}</td>
                  <td className="p-2">{dest.type}</td>
                  <td className="p-2">{dest.createdBy}</td>
                  <td className="p-2">{dest.adminName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
