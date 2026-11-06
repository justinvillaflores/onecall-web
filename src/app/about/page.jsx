import { WifiOff, Building2, PhoneCall, ShieldCheck } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="relative min-h-screen bg-white overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[32rem] bg-gradient-to-b from-blue-50/80 via-slate-50/30 to-transparent -z-10" />

            <section className="container mx-auto px-6 py-20 max-w-6xl">
                <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">

                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        About <span className="text-blue-600">OneCall</span>
                    </h2>

                    <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>

                    <p className="text-base md:text-lg text-slate-600 leading-relaxed pt-2 max-w-2xl mx-auto">
                        OneCall provides offline access to emergency hotlines in Olongapo City,
                        allowing residents and visitors to quickly contact the right services
                        even without an internet connection.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-8 md:p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 group">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 rounded-2xl flex items-center justify-center mb-8 border border-blue-100/50 shadow-sm">
                            <WifiOff size={26} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Offline Ready</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            No data or internet required to find the emergency contact numbers you need most during blackouts or network outages.
                        </p>
                    </div>

                    <div className="p-8 md:p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 group">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 rounded-2xl flex items-center justify-center mb-8 border border-blue-100/50 shadow-sm">
                            <Building2 size={26} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">Olongapo Core</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Directly connected to local agencies including PNP, BFP, CDRRMO, and Red Cross Olongapo Chapter.
                        </p>
                    </div>

                    <div className="p-8 md:p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 group">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 rounded-2xl flex items-center justify-center mb-8 border border-blue-100/50 shadow-sm">
                            <PhoneCall size={26} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">One-Tap Call</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Instant calling functionality designed for immediate response and fast action during critical moments.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}