export function OrbitalGraphic() {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center ">
      {/* Outer Orbit */}
      <div className="absolute w-[300px] h-[300px] border border-white/20 rounded-full animate-[spin_20s_linear_infinite]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-sm">
        <span className="text-[#191A23] text-5xl">*</span>
        </div>
      </div>

      {/* Middle Orbit */}
      <div className="absolute w-[220px] h-[220px] border border-white/15 rounded-full animate-[spin_15s_linear_infinite_reverse]">
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-white rounded-full">
        <span className="text-[#191A23] text-5xl">*</span>
        </div>
      </div>

      {/* Inner Orbit */}
      <div className="absolute w-[140px] h-[140px] border border-white/10 rounded-full animate-[spin_10s_linear_infinite]">
        <div className="absolute bottom-0 left-1/2 translate-x-[-50%] translate-y-1/2 w-3 h-3 rotate-45 bg-white">
        <span className="text-[#191A23] text-5xl">*</span>
        </div>
      </div>

      {/* Center Core */}
      <div className="w-16 h-16 bg-white rounded-full z-10 flex items-center justify-center shadow-md">
        <div className="w-3 h-3 bg-black rounded-full" />
      </div>
    </div>
  );
}
