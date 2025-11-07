// src/pages/Traveler/Destination/DestinationDetailPage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import { getDestination } from "../../../services/auth/destinationService";
import type { Destination } from "../../../types/destination";

export default function DestinationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No destination ID provided");
      setLoading(false);
      return;
    }

    async function fetchDestination() {
      try {
        setLoading(true);
        // TypeScript now knows id is defined here
        const response = await getDestination(id!);
        setDestination(response.destination);
        setError(null);
      } catch (err) {
        console.error("Error fetching destination:", err);
        setError("Failed to load destination");
      } finally {
        setLoading(false);
      }
    }

    fetchDestination();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#016B71]"></div>
            <p className="mt-4 text-slate-600">Loading destination...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !destination) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
              error
            </span>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {error || "Destination not found"}
            </h2>
            <p className="text-slate-600 mb-6">
              The destination you're looking for doesn't exist or has been
              removed.
            </p>
            <button
              onClick={() => navigate("/")}
              className="rounded-full bg-[#016B71] px-6 py-3 font-bold text-white shadow-md hover:bg-[#01585C] transition"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="relative h-96 w-full overflow-hidden">
          <img
            src={destination.hero_image_url}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {destination.name}
            </h1>
            <div className="flex items-center gap-4 text-lg">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined">location_on</span>
                {destination.city}, {destination.country}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                {destination.category}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Description */}
          <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">About</h2>
            <p className="text-slate-700 leading-relaxed text-lg">
              {destination.description}
            </p>
          </section>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Opening Hours */}
            {(destination.opening_time || destination.closing_time) && (
              <section className="bg-white rounded-2xl shadow-sm p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">schedule</span>
                  Opening Hours
                </h3>
                <p className="text-slate-700 text-lg">
                  {destination.opening_time} - {destination.closing_time}
                </p>
              </section>
            )}

            {/* Contact */}
            {destination.contact && (
              <section className="bg-white rounded-2xl shadow-sm p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">phone</span>
                  Contact
                </h3>
                <p className="text-slate-700 text-lg">{destination.contact}</p>
              </section>
            )}
          </div>

          {/* Gallery */}
          {destination.gallery && destination.gallery.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Gallery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {destination.gallery
                  .sort((a, b) => a.ordering - b.ordering)
                  .map((image, index) => (
                    <div
                      key={index}
                      className="relative group overflow-hidden rounded-lg"
                    >
                      <img
                        src={image.url}
                        alt={image.caption}
                        className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                      />
                      {image.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-sm">
                          {image.caption}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Map placeholder - someone else will implement */}
          <section className="bg-white rounded-2xl shadow-sm p-8 mt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">map</span>
              Location
            </h2>
            <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-6xl">map</span>
            </div>
            <p className="mt-4 text-slate-600 text-sm">
              Coordinates: {destination.latitude}, {destination.longitude}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
