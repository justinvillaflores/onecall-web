export default function HomePage() {
    return (
        <div className="relative overflow-hidden bg-white min-h-screen">
            <div className="absolute top-[-10%] right-[-5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-50 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-[10%] left-[-5%] w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-indigo-50 rounded-full blur-3xl -z-10" />

            <section className="container mx-auto px-4 sm:px-6 pt-12 sm:pt-20 lg:pt-30 pb-16 sm:pb-32 flex flex-col lg:flex-row items-center">
                <div className="w-full lg:w-1/2 text-center lg:text-left space-y-4 sm:space-y-8">
                    <h2 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
                        Keep Olongapo <br />
                        <span className="text-blue-600">Safe & Connected.</span>
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                        OneCall provides offline access to emergency hotlines. Get instant help from police, fire, and medical services even without an internet connection.
                    </p>

                    <div className="pt-2 sm:pt-4">
                        <a href="/login" className="inline-block bg-blue-600 text-white px-7 sm:px-10 py-3.5 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black text-sm sm:text-lg shadow-xl sm:shadow-2xl shadow-blue-200 hover:bg-blue-700 transition transform hover:-translate-y-1 active:scale-95">
                            Get Started Now
                        </a>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 mt-10 sm:mt-16 lg:mt-0 relative flex justify-center">
                    <div className="w-[85%] sm:w-[95%] max-w-[450px] lg:max-w-none h-auto flex items-center justify-center p-2 sm:p-6 transition-transform hover:scale-105 duration-500">
                        <img
                            src="/download1.png"
                            alt="OneCall Logo"
                            className="w-full h-full object-contain filter drop-shadow-xl"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}