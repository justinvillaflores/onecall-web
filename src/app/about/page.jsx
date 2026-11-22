export default function AboutPage() {
    const features = [
        {
            title: "Offline Ready",
            description: "No data or internet required to find the emergency contact numbers you need most during blackouts or network outages.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7">
                    <circle cx="18" cy="29.54" r="3" fill="currentColor" />
                    <path fill="currentColor" d="m29.18 17.71l.11-.17a1.51 1.51 0 0 0-.47-2.1A20.57 20.57 0 0 0 18 12.37c-.56 0-1.11 0-1.65.07l3.21 3.21a17.4 17.4 0 0 1 7.6 2.52a1.49 1.49 0 0 0 2.02-.46" />
                    <path fill="currentColor" d="M32.76 9.38a27.9 27.9 0 0 0-22.58-3.11l2.63 2.63a24.68 24.68 0 0 1 18.29 3.22a1.49 1.49 0 0 0 2-.46l.11-.17a1.51 1.51 0 0 0-.45-2.11" />
                    <path fill="currentColor" d="m3 4.75l3.1 3.1a27 27 0 0 0-2.92 1.57a1.51 1.51 0 0 0-.48 2.11l.11.17a1.49 1.49 0 0 0 2 .46a24.7 24.7 0 0 1 3.67-1.9l3.14 3.14a20.6 20.6 0 0 0-4.53 2.09a1.51 1.51 0 0 0-.46 2.1l.11.17a1.49 1.49 0 0 0 2 .46A17.5 17.5 0 0 1 14.25 16l3.6 3.6a13.4 13.4 0 0 0-6.79 1.93a1.5 1.5 0 0 0-.46 2.09l.1.16a1.52 1.52 0 0 0 2.06.44a10.2 10.2 0 0 1 9-.7L29 30.75l1.41-1.41l-26-26Z" />
                </svg>
            ),
        },
        {
            title: "Olongapo Core",
            description: "Directly connected to local agencies including PNP, BFP, CDRRMO, and Red Cross Olongapo Chapter.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7" fill="none">
                    <path fill="currentColor" d="M4.43 22.2V5.7c0-1.88 0-2.82.59-3.41s1.53-.59 3.41-.59h7.14c1.88 0 2.82 0 3.41.59s.59 1.53.59 3.41v16.5h-2c-.62 0-.92 0-1.17-.06a2 2 0 0 1-1.43-1.42c-.06-.25-.06-.56-.06-1.17c0-.45 0-.67-.04-.87a2 2 0 0 0-.95-1.33c-.18-.1-.4-.17-.82-.31l-.21-.08l-.4-.12a2 2 0 0 0-.97.02l-.4.14c-.35.14-.53.21-.68.3a2 2 0 0 0-.93 1.37c-.03.17-.03.36-.03.74v.09c0 .66 0 .99-.08 1.26a2 2 0 0 1-1.37 1.37c-.27.08-.6.08-1.26.08z" opacity=".2" />
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.43 22.2V9.28c0-3.35 0-5.03.95-6.14a4 4 0 0 1 .48-.49C6.97 1.7 8.65 1.7 12 1.7s5.03 0 6.14.94a4 4 0 0 1 .48.49c.95 1.11.95 2.79.95 6.14v12.94m2.46.05H1.97M10.3 5.78H8m8 0h-2.3m-3.4 3.69H8m8 0h-2.3m-3.4 3.68H8m8 0h-2.3" />
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.95 22.2v-2.23c0-1.03 0-1.55.18-1.95a2 2 0 0 1 .98-.97c.4-.19.91-.19 1.94-.19s1.55 0 1.94.19a2 2 0 0 1 .98.97c.18.4.18.92.18 1.95v2.24" />
                </svg>
            ),
        },
        {
            title: "One-Tap Call",
            description: "Instant calling functionality designed for immediate response and fast action during critical moments.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                    <path d="m1.75 1.75c0 8.5 4 12.5 12.5 12.5v-4l-3.5-1-1 1.5c-2 0-4.5-2.5-4.5-4.5l1.5-1-1-3.5z" />
                    <path d="m9.75 1.75c2.5 0 4.5 2 4.5 4.5m-4.5-2c1 0 2 1 2 2" />
                </svg>
            ),
        },
    ];

    return (
        <div className="relative min-h-screen bg-white overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[24rem] sm:h-[32rem] bg-gradient-to-b from-blue-50/80 via-slate-50/30 to-transparent -z-10" />
            <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20 max-w-6xl">
                <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        About <span className="text-blue-600">OneCall</span>
                    </h2>
                    <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-blue-600 mx-auto rounded-full" />
                    <p className="text-xs sm:text-base md:text-lg text-slate-600 leading-relaxed pt-1 sm:pt-2 max-w-2xl mx-auto">
                        OneCall provides offline access to emergency hotlines in Olongapo City,
                        allowing residents and visitors to quickly contact the right services
                        even without an internet connection.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {features.map((item) => (
                        <div key={item.title} className="p-6 sm:p-8 md:p-10 bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-lg sm:shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 border border-blue-100/50 shadow-sm shrink-0">
                                {item.icon}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">{item.title}</h3>
                            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}