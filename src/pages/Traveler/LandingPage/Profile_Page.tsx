import React from "react";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Navbar showSearch={false} activePage="profile" />

      {/* Main Profile Card */}
      <main className="flex justify-center mt-10 flex-grow">
        <div className="bg-white w-[90%] sm:w-[80%] md:w-[60%] lg:w-[50%] xl:w-[60%] rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
          {/* Top Section */}
          <div className="flex items-center mb-8">
            <img
              src="https://i.pravatar.cc/100"
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover mr-4"
            />
            <div>
              <h2 className="font-bold text-lg text-gray-800">Alexa Rawles</h2>
              <p className="text-gray-500 text-sm">alexarawles@gmail.com</p>
            </div>
            <button className="ml-auto bg-[#006D66] text-white px-5 py-2 rounded-md hover:bg-[#005c56] transition">
              Save
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value="Alexrawles Thalorian Crestfield"
                className="w-full border border-gray-300 rounded-md bg-gray-100 text-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#006D66]"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Your Nick Name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#006D66]"
              />
            </div>
          </div>

          {/* Email Section */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              My Email Address
            </label>
            <div className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
              <div className="flex items-center">
                <span className="flex items-center justify-center w-8 h-8 bg-[#006D66] text-white rounded-full mr-3 text-sm">
                  ✉️
                </span>
                <p className="text-gray-800 text-sm">alexarawles@gmail.com</p>
              </div>
              <button className="text-[#006D66] text-sm font-medium hover:underline">
                Reset password
              </button>
            </div>

            <button className="mt-3 bg-[#E6F4F3] text-[#006D66] px-4 py-2 rounded-md hover:bg-[#d3ecea] text-sm font-medium">
              + Add Email Address
            </button>
          </div>

          {/* Delete Account Button */}
          <div className="flex justify-end mt-8">
            <button className="bg-[#006D66] text-white px-6 py-2 rounded-md hover:bg-[#005c56] transition">
              Delete account
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
