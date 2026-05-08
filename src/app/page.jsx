export default function HomePage() {
    return (
        <div className="relative overflow-hidden bg-white min-h-screen">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-indigo-50 rounded-full blur-3xl -z-10" />

            <section className="container mx-auto px-6 pt-20 pb-32 flex flex-col lg:flex-row items-center">
                {/* Left Side: Text */}
                <div className="lg:w-1/2 text-left space-y-8">
                    <h2 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
                        Keep Olongapo <br />
                        <span className="text-blue-600">Safe & Connected.</span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                        OneCall provides offline access to emergency hotlines. Get instant help from police, fire, and medical services even without an internet connection.
                    </p>

                    {/* Action Button */}
                    <div className="pt-4">
                        <a href="/login" className="inline-block bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 transition transform hover:-translate-y-1 active:scale-95">
                            Get Started Now
                        </a>
                    </div>
                </div>

                {/* Right Side: Logo & Illustration Section */}
                <div className="lg:w-1/2 mt-16 lg:mt-0 relative flex justify-center">
                    {/* Main Background Gradient Circle */}
                    <div className="relative w-[350px] h-[350px] lg:w-[500px] lg:h-[500px] bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-full flex items-center justify-center shadow-2xl">

                        {/* --- LOGO BOX SECTION FIXED SIZE --- */}
                        <div
                            className="w-32 h-32 lg:w-48 lg:h-48 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/30 backdrop-blur-md transition-transform hover:rotate-3 duration-500"
                            style={{
                                borderRadius: '2rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            }}
                        >
                            <img
                                src="/logo.png"
                                alt="OneCall Logo"
                                className="w-[70%] h-[70%] object-contain drop-shadow-2xl"
                            />
                        </div>

                        {/* Floating Labels */}
                        <div className="absolute top-10 left-0 bg-white p-4 rounded-2xl shadow-xl animate-bounce flex items-center gap-2 border-b-4 border-blue-500">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="font-bold text-slate-800">Medical</span>
                        </div>

                        <div className="absolute bottom-10 right-0 bg-white p-4 rounded-2xl shadow-xl animate-pulse flex items-center gap-2 border-l-4 border-orange-500">
                            <span className="font-bold text-slate-800">Fire Dept</span>
                        </div>

                        <div className="absolute bottom-[-20px] left-20 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold tracking-widest border border-white/10">
                            POLICE
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}