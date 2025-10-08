import React from "react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar (you can replace this with your Navbar component later) */}
      <header className="flex justify-between items-center px-10 py-4 bg-white shadow">
        <img src="/src/assets/Logo_fitcity.png" alt="FitCity Logo" className="h-8" />
        <nav className="flex items-center gap-8 text-teal-800">
          <button>Favourite</button>
          <button>EN/TH</button>
          <button>Help</button>
          <button className="bg-yellow-100 px-4 py-1 rounded-full">Profile</button>
        </nav>
      </header>

      {/* Main Profile Card */}
      <main className="flex justify-center mt-10 flex-grow">
        <div className="bg-white w-[80%] md:w-[70%] lg:w-[60%] rounded-lg shadow-md p-8">
          {/* Top Section */}
          <div className="flex items-center mb-6">
            <img
              src="https://i.pravatar.cc/100"
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover mr-4"
            />
            <div>
              <h2 className="font-semibold text-lg">Alexa Rawles</h2>
              <p className="text-gray-500 text-sm">alexarawles@gmail.com</p>
            </div>
            <button className="ml-auto bg-teal-800 text-white px-4 py-1 rounded hover:bg-teal-700">
              Save
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value="Alexrawles Thalorian Crestfield"
                className="w-full p-2 border rounded bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Your Nick Name"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Email Section */}
          <div className="mt-8">
            <label className="block text-sm font-medium mb-2">My Email Address</label>
            <div className="flex items-center bg-gray-50 border rounded p-2 justify-between">
              <div className="flex items-center">
                <span className="bg-teal-800 text-white rounded-full p-2 mr-3">
                  ✉️
                </span>
                <p className="text-gray-700">alexarawles@gmail.com</p>
              </div>
              <button className="text-teal-700 text-sm">Reset password</button>
            </div>

            <button className="mt-3 bg-teal-50 text-teal-700 px-3 py-2 rounded hover:bg-teal-100 text-sm">
              + Add Email Address
            </button>
          </div>

          {/* Delete Account Button */}
          <div className="flex justify-end mt-10">
            <button className="bg-teal-800 text-white px-6 py-2 rounded hover:bg-teal-700">
              Delete account
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-teal-50 text-center py-3 text-sm text-gray-600">
        Copyright © 2026 FitCity. Find your perfect destination before you go
      </footer>
    </div>
  );
}
