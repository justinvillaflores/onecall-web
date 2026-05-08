export default function AboutPage() {
    return (
        <div className="relative min-h-screen bg-white">
            {/* Background Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-blue-50 to-transparent -z-10" />

            <section className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                        About <span className="text-blue-600">OneCall</span>
                    </h2>
                    <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
                    <p className="text-lg text-slate-600 leading-relaxed pt-4">
                        OneCall provides offline access to emergency hotlines in Olongapo City,
                        allowing residents and visitors to quickly contact the right services
                        even without an internet connection.
                    </p>
                </div>

                {/* Info Cards Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition hover:-translate-y-2">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-8"></div>
                        <h3 className="text-xl font-bold mb-4 text-slate-900">Offline Ready</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">No data or internet required to find the emergency contact numbers you need most.</p>
                    </div>

                    <div className="p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition hover:-translate-y-2">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-8"></div>
                        <h3 className="text-xl font-bold mb-4 text-slate-900">Olongapo Core</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Directly connected to local agencies including PNP, BFP, and Red Cross Olongapo.</p>
                    </div>

                    <div className="p-10 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition hover:-translate-y-2">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-8"></div>
                        <h3 className="text-xl font-bold mb-4 text-slate-900">One-Tap Call</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Instant calling functionality designed for immediate response during critical moments.</p>
                    </div>
                </div>
            </section>
        </div>
    )
}