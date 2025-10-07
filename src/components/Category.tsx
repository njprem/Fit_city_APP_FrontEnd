import mainpic from "../assets/mountain_climbing.jpg"

export default function CategorySection() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative">
        {/* Background Image */}
        <img
          src={mainpic}
          alt="Mountain hikers"
          className="w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] object-cover"
        />

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-20 text-white bg-black/30">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight max-w-[800px]">
            Find your perfect destination <br /> before you go
          </h1>
          <button
            type="button"
            className="mt-6 w-fit rounded-full bg-[#016B71] px-5 py-2 sm:px-6 sm:py-3 font-semibold text-white shadow-md hover:bg-[#01585C] transition"
          >
            Learn more →
          </button>
        </div>

        {/* Category bar — now INSIDE the same relative wrapper & stuck to bottom */}
        <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 z-20 flex flex-wrap justify-center gap-2 sm:gap-4 px-4">
            <div className="flex items-center gap-2 rounded-t-2xl bg-[#fffdd8] px-6 py-3 sm:px-10 sm:py-4 md:px-12 md:py-5 font-semibold text-[#016B71] text-base sm:text-lg md:text-xl lg:text-2xl shadow-md">
                <span className="material-symbols-outlined text-lg sm:text-xl md:text-2xl">temple_buddhist</span>
                Culture
            </div>
            <div className="flex items-center gap-2 rounded-t-2xl bg-[#016B71] px-6 py-3 sm:px-10 sm:py-4 md:px-12 md:py-5 font-semibold text-white text-base sm:text-lg md:text-xl lg:text-2xl shadow-md">
                <span className="material-symbols-outlined text-lg sm:text-xl md:text-2xl">lunch_dining</span>
                Food
            </div>
            <div className="flex items-center gap-2 rounded-t-2xl bg-[#016B71] px-6 py-3 sm:px-10 sm:py-4 md:px-12 md:py-5 font-semibold text-white text-base sm:text-lg md:text-xl lg:text-2xl shadow-md">
                <span className="material-symbols-outlined text-lg sm:text-xl md:text-2xl">forest</span>
                Nature
            </div>
            <div className="flex items-center gap-2 rounded-t-2xl bg-[#016B71] px-6 py-3 sm:px-10 sm:py-4 md:px-12 md:py-5 font-semibold text-white text-base sm:text-lg md:text-xl lg:text-2xl shadow-md">
                <span className="material-symbols-outlined text-lg sm:text-xl md:text-2xl">sports_handball</span>
                Sport
            </div>
        </div>
      </div>
    </section>
  );
}