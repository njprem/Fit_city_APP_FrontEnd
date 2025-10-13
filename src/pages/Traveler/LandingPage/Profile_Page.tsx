import { useState } from "react";
import { Pencil } from "lucide-react";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [profileImg, setProfileImg] = useState("https://i.pravatar.cc/150");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({ fullName: "", username: "" });
  const navigate = useNavigate();

  const validateFields = () => {
    let valid = true;
    const newErrors = { fullName: "", username: "" };

    if (!fullName.trim()) {
      newErrors.fullName = "Please enter your Full Name";
      valid = false;
    }
    if (!username.trim()) {
      newErrors.username = "Please enter your Username";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSave = () => {
    if (validateFields()) {
      setShowConfirmPopup(true);
    }
  };

  const handleConfirm = () => {
    setShowConfirmPopup(false);
    navigate("/"); 
  };

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const imageUrl = URL.createObjectURL(file);
    setProfileImg(imageUrl);
    setShowImagePopup(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar showSearch={false} activePage="profile" />
      {/* Main Card */}
      <main className="flex justify-center mt-10 flex-grow">
        <div className="bg-white w-[90%] sm:w-[80%] md:w-[60%] lg:w-[50%] rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
          {/* Top Section */}
          <div className="flex items-center mb-8 relative flex-wrap gap-4">
            <div className="relative group w-16 h-16">
              <img
                src={profileImg}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover transition duration-300 group-hover:opacity-60"
              />
              <div
                onClick={() => setShowImagePopup(true)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <div className="bg-white p-1.5 rounded-full shadow">
                  <Pencil size={14} className="text-gray-700" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[180px]">
              <h2 className="font-bold text-lg text-gray-800">Alexa Rawles</h2>
              <p className="text-gray-500 text-sm">alexarawles@gmail.com</p>
            </div>

            <button
              onClick={handleSave}
              disabled={!fullName.trim() || !username.trim()}
              className={`ml-auto px-5 py-2 rounded-md transition font-medium ${
                !fullName.trim() || !username.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#006D66] text-white hover:bg-[#005c56]"
              }`}
            >
              Save
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Full Name"
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your Nick Name"
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.username ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>
          </div>

          {/* Email Section (Responsive) */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              My Email Address
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 w-full">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-[#006D66] text-white rounded-full text-sm">
                  ✉️
                </span>
                <p className="text-gray-800 text-sm break-all">
                  alexarawles@gmail.com
                </p>
              </div>
              <button className="text-[#006D66] text-sm font-medium hover:underline whitespace-nowrap">
                Reset password
              </button>
            </div>
          </div>

          {/* Delete Button */}
          <div className="flex justify-end mt-8">
            <button className="bg-[#006D66] text-white px-6 py-2 rounded-md hover:bg-[#005c56] transition">
              Delete Account
            </button>
          </div>
        </div>
      </main>

      <Footer />

{showImagePopup && (
  <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 transition-all duration-300">
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 w-[90%] sm:w-[380px] text-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200">
      <h2 className="text-lg font-semibold mb-2">Profile Picture</h2>
      <p className="text-sm text-gray-500 mb-4">Upload a new profile picture</p>
      <div className="flex justify-center mb-5">
        <img
          src={profileImg}
          alt="Current Profile"
          className="w-32 h-32 rounded-full object-cover border"
        />
      </div>
      <label className="cursor-pointer bg-[#E6F4F3] text-[#006D66] px-4 py-2 rounded-md hover:bg-[#d3ecea] text-sm font-medium inline-flex items-center gap-2">
        <span>📷</span> Add New Profile
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </label>
      <div className="mt-5">
        <button
          onClick={() => setShowImagePopup(false)}
          className="text-sm text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{/* Confirm Save Popup */}
{showConfirmPopup && (
  <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 transition-all duration-300">
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 p-6 w-[90%] sm:w-[360px] text-center transition-transform transform scale-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Confirm To Save Profile
      </h3>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleConfirm}
          className="bg-[#D1F2E0] text-[#006D66] font-semibold px-6 py-2 rounded-md hover:bg-[#BFE9D3] transition"
        >
          DONE
        </button>

        <button
          onClick={() => setShowConfirmPopup(false)}
          className="bg-gray-900 text-white font-semibold px-6 py-2 rounded-md hover:bg-gray-800 transition"
        >
          EXIT
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

 