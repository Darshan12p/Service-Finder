import { useNavigate } from "react-router-dom";
import { Briefcase, BadgeCheck, Wallet, Users } from "lucide-react";

const JoinUs = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: <Briefcase size={16} />, text: "Daily job opportunities" },
    { icon: <BadgeCheck size={16} />, text: "Verified customer leads" },
    { icon: <Wallet size={16} />, text: "Fast payouts" },
    { icon: <Users size={16} />, text: "Partner support" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 p-6 sm:p-8 shadow-xl">
        
        {/* background glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />

        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          
          {/* LEFT */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur">
              Grow with us
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 leading-tight">
              Become a Service Partner
            </h2>

            <p className="text-indigo-100 mt-3 text-sm sm:text-base max-w-lg leading-6">
              Join professionals across India and grow your business with better
              leads, fast payouts and dedicated support.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/clickjoinus")}
                className="bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-semibold shadow hover:bg-indigo-50 transition"
              >
                Join Now
              </button>

              <button
                onClick={() => navigate("/contact")}
                className="border border-white/30 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition"
              >
                Talk to Support
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 sm:p-5">
            <p className="text-white font-semibold text-lg">
              Why partners love us
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-white text-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 grid place-items-center">
                    {item.icon}
                  </div>

                  <p className="font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default JoinUs;