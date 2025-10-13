import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Pencil } from "lucide-react";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  updateProfile,
  type UpdateProfilePayload,
  deleteUserAccount,
  changePassword,
} from "../../../api";
import { getUser, logout, type AuthUser } from "../../../services/auth/authService";

const DEFAULT_AVATAR = "https://i.pravatar.cc/150";

export default function ProfilePage() {
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showResetPopup, setShowResetPopup] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [profileImg, setProfileImg] = useState(DEFAULT_AVATAR);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [errors, setErrors] = useState({ fullName: "", username: "" });
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const imageDirtyRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const location = useLocation();
  const locationUser =
    (location.state as { user?: AuthUser } | undefined | null)?.user;
  const navigate = useNavigate();

  const applyUser = useCallback((user: AuthUser | null | undefined, options: { force?: boolean } = {}) => {
    if (!user) {
      return;
    }
    const force = options.force ?? false;
    const isDirty = imageDirtyRef.current && !force;
    if (!isDirty && previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    const derivedFullName =
      user.fullName ||
      user.full_name ||
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      "";
    const trimmedFullName = derivedFullName ? derivedFullName.trim() : "";
    const derivedUsername =
      user.username ||
      user.name ||
      user.fullName ||
      user.full_name ||
      user.email ||
      "";
    setFullName((prev) => ((prev && !force) ? prev : trimmedFullName));
    setUsername((prev) => ((prev && !force) ? prev : derivedUsername));
    setEmailAddress(user.email ?? "");
    setUserId(user.id != null ? String(user.id) : null);
    if (force || !isDirty) {
      setProfileImg(user.user_image_url ?? DEFAULT_AVATAR);
      setAvatarFile(null);
    }
  }, []);

  useEffect(() => {
    if (locationUser) {
      applyUser(locationUser);
    }
  }, [locationUser, applyUser]);

  useEffect(() => {
    const cached = getUser();
    applyUser(cached);

    let active = true;
    setLoadingUser(true);
    setUserError(null);

    fetchCurrentUser()
      .then((freshUser) => {
        if (!active) {
          return;
        }
        applyUser(freshUser);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        console.error("Failed to load current user profile:", err);
        setUserError(err instanceof Error ? err.message : "Unable to load profile information.");
      })
      .finally(() => {
        if (active) {
          setLoadingUser(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applyUser]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

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
      setSaveError(null);
      setSaveSuccess(null);
      setResetSuccess(null);
      setShowConfirmPopup(true);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload: UpdateProfilePayload = {
        full_name: fullName.trim() || undefined,
        username: username.trim() || undefined,
        avatar: avatarFile ?? undefined,
      };

      const updatedUser = await updateProfile(payload);
      imageDirtyRef.current = false;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      applyUser(updatedUser, { force: true });
      setSaveSuccess("Profile updated successfully.");
      setShowConfirmPopup(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile. Please try again.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const imageUrl = URL.createObjectURL(file);
      previewUrlRef.current = imageUrl;
      setProfileImg(imageUrl);
      setAvatarFile(file);
      imageDirtyRef.current = true;
      setShowImagePopup(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteError(null);
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userId) {
      setDeleteError("Unable to determine the current account. Please refresh and try again.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUserAccount(userId);
      logout();
      setShowDeletePopup(false);
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete the account. Please try again.";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = () => {
    if (!currentPwd.trim() || !newPwd.trim() || !confirmPwd.trim()) {
      setResetError("Please fill in all required fields.");
      return;
    }

    if (newPwd !== confirmPwd) {
      setResetError("New passwords do not match.");
      return;
    }

    if (newPwd === currentPwd) {
      setResetError("New password must be different from current password.");
      return;
    }

    setResetError(null);
    setShowConfirmReset(true);
  };

  const handleConfirmReset = async () => {
    if (resetLoading) {
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      await changePassword(currentPwd, newPwd);
      setShowConfirmReset(false);
      setShowResetPopup(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setResetError(null);
      setSaveSuccess(null);
      setResetSuccess("Password updated successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update password right now.";
      setResetError(message);
      setShowConfirmReset(false);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar showSearch={false} activePage="profile" />
      {/* Main Card */}
      <main className="flex justify-center mt-10 flex-grow">
        <div className="bg-white w-[90%] sm:w-[80%] md:w-[60%] lg:w-[50%] rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
          {loadingUser && (
            <p className="text-sm text-gray-500 mb-4">Loading your profile...</p>
          )}
          {userError && (
            <p className="text-sm text-red-600 mb-4">{userError}</p>
          )}
          {saveSuccess && (
            <p className="text-sm text-green-600 mb-4">{saveSuccess}</p>
          )}
          {resetSuccess && (
            <p className="text-sm text-green-600 mb-4">{resetSuccess}</p>
          )}
          {saveError && (
            <p className="text-sm text-red-600 mb-4">{saveError}</p>
          )}
          {deleteError && (
            <p className="text-sm text-red-600 mb-4">{deleteError}</p>
          )}
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
              <h2 className="font-bold text-lg text-gray-800">
                {fullName || "Your full name"}
              </h2>
              <p className="text-gray-500 text-sm">
                {emailAddress || "you@example.com"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!fullName.trim() || !username.trim() || saving}
              className={`ml-auto px-5 py-2 rounded-md transition font-medium ${
                !fullName.trim() || !username.trim() || saving
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#006D66] text-white hover:bg-[#005c56]"
              }`}
            >
              {saving ? "Saving..." : "Save"}
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
                  {emailAddress || "you@example.com"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResetPopup(true);
                  setShowConfirmReset(false);
                  setResetError(null);
                  setResetSuccess(null);
                  setCurrentPwd("");
                  setNewPwd("");
                  setConfirmPwd("");
                }}
                className="text-[#006D66] text-sm font-medium hover:underline whitespace-nowrap"
              >
                Reset password
              </button>
            </div>
          </div>

          {/* Delete Button */}
          <div className="flex justify-end mt-8">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleting}
              className={`px-6 py-2 rounded-md transition font-medium ${
                deleting
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#B3261E] text-white hover:bg-[#9a1f19]"
              }`}
            >
              {deleting ? "Deleting..." : "Delete Account"}
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
                type="button"
                onClick={() => setShowImagePopup(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeletePopup && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 p-6 w-[90%] sm:w-[360px] text-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. Are you sure you want to delete your account?
            </p>
            {deleteError && <p className="text-sm text-red-600 mb-4">{deleteError}</p>}

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className={`font-semibold px-6 py-2 rounded-md transition ${
                  deleting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#B3261E] text-white hover:bg-[#9a1f19]"
                }`}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDeletePopup(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className={`font-semibold px-6 py-2 rounded-md transition ${
                  deleting
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmPopup && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 p-6 w-[90%] sm:w-[360px] text-center transition-transform transform scale-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm To Save Profile</h3>

            {saving && <p className="text-sm text-gray-600 mb-4">Saving your changes...</p>}

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={saving}
                className={`font-semibold px-6 py-2 rounded-md transition ${
                  saving
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#D1F2E0] text-[#006D66] hover:bg-[#BFE9D3]"
                }`}
              >
                {saving ? "Saving..." : "DONE"}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmPopup(false)}
                disabled={saving}
                className={`font-semibold px-6 py-2 rounded-md transition ${
                  saving
                    ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPopup && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 w-[90%] sm:w-[400px] text-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200">
            <h2 className="text-lg font-semibold mb-2 text-[#006D66]">Change Password</h2>
            <p className="text-sm text-gray-500 mb-5">
              Please fill out all required fields to update your password.
            </p>

            <div className="text-left mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="new-password" // รอเช็คกับbackendอีกที
                name="current-password-reset"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#006D66] focus:outline-none"
              />
            </div>

            <div className="text-left mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="off"
                name="new-password-reset"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#006D66] focus:outline-none"
              />
            </div>

            <div className="text-left mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                autoComplete="off"
                name="confirm-password-reset"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#006D66] focus:outline-none"
              />
            </div>

            {resetError && <p className="text-red-500 text-xs mb-3">{resetError}</p>}

            <div className="flex justify-center gap-4 mt-4">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className={`px-5 py-2 rounded-md font-medium transition ${
                  resetLoading
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-[#006D66] text-white hover:bg-[#005c56]"
                }`}
              >
                {resetLoading ? "Checking..." : "Update password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetPopup(false);
                  setShowConfirmReset(false);
                  setResetError(null);
                }}
                className="bg-gray-200 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmReset && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 p-6 w-[90%] sm:w-[360px] text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm To Update Password
            </h3>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetLoading}
                className={`font-semibold px-6 py-2 rounded-md transition ${
                  resetLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#D1F2E0] text-[#006D66] hover:bg-[#BFE9D3]"
                }`}
              >
                {resetLoading ? "Updating..." : "DONE"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                disabled={resetLoading}
                className={`font-semibold px-6 py-2 rounded-md transition ${
                  resetLoading
                    ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
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
