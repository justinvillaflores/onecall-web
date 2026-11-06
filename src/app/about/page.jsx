import { WifiOff, Building2, PhoneCall } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="relative min-h-screen bg-white overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[24rem] sm:h-[32rem] bg-gradient-to-b from-blue-50/80 via-slate-50/30 to-transparent -z-10" />

            <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20 max-w-6xl">
                <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        About <span className="text-blue-600">OneCall</span>
                    </h2>

                    <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-blue-600 mx-auto rounded-full"></div>

                    <p className="text-xs sm:text-base md:text-lg text-slate-600 leading-relaxed pt-1 sm:pt-2 max-w-2xl mx-auto">
                        OneCall provides offline access to emergency hotlines in Olongapo City,
                        allowing residents and visitors to quickly contact the right services
                        even without an internet connection.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    <div className="p-6 sm:p-8 md:p-10 bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-lg sm:shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 group">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 border border-blue-100/50 shadow-sm shrink-0">
                            <WifiOff className="w-5 h-5 sm:w-6 sm:h-6" size={26} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">Offline Ready</h3>
                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                            No data or internet required to find the emergency contact numbers you need most during blackouts or network outages.
                        </p>
                    </div>

                    <div className="p-6 sm:p-8 md:p-10 bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-lg sm:shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 group">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 border border-blue-100/50 shadow-sm shrink-0">
                            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" size={26} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">Olongapo Core</h3>
                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                            Directly connected to local agencies including PNP, BFP, CDRRMO, and Red Cross Olongapo Chapter.
                        </p>
                    </div>

                    <div className="p-6 sm:p-8 md:p-10 bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-lg sm:shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 group">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 border border-blue-100/50 shadow-sm shrink-0">
                            <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6" size={26} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">One-Tap Call</h3>
                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                            Instant calling functionality designed for immediate response and fast action during critical moments.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}