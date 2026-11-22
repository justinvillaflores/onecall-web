'use client';

import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const contactInfo = [
        {
            label: 'Address',
            value: 'Camp Cabal, Maquinaya, Barangay Barretto, Olongapo City',
            className: 'break-words',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor">
                    <path d="M10.361 10.485C11.354 10.94 12 11.672 12 12.5c0 1.38-1.79 2.5-4 2.5s-4-1.12-4-2.5c0-.828.645-1.56 1.638-2.015l.267.354c.454.593.886 1.16 1.268 1.723a1 1 0 0 0 1.654 0a39 39 0 0 1 1.268-1.723z" />
                    <path d="M8 1c2.4 0 4 1.572 4 3.929c0 2.058-1.83 4.117-3.36 6.176A26 26 0 0 0 8 12c-.418-.616-.89-1.232-1.361-1.849C5.309 8.411 4 6.67 4 4.93C4 2.572 5.6 1 8 1m0 1.964c-.53 0-1.039.208-1.414.576A1.95 1.95 0 0 0 6 4.929c0 .52.21 1.02.586 1.388c.375.369.884.576 1.414.576s1.039-.207 1.414-.576a1.94 1.94 0 0 0 0-2.776A2.02 2.02 0 0 0 8 2.964" />
                </svg>
            ),
        },
        {
            label: 'Email Us',
            value: 'onecall@gmail.com',
            className: 'break-all',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor">
                    <path d="M28 6H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2m-2.2 2L16 14.78L6.2 8ZM4 24V8.91l11.43 7.91a1 1 0 0 0 1.14 0L28 8.91V24Z" />
                </svg>
            ),
        },
        {
            label: 'Phone',
            value: '(+63) 903 222 1212',
            className: '',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4">
                    <path d="M40 34.5c.2 2-.5 3.7-2 4.9c-1.3 1-2.8 1.4-4.4 1.1c-12.1-2.3-23.1-13.3-25.2-25.4c-.3-1.6.1-3.1 1.1-4.4c1.2-1.4 2.9-2.1 4.8-1.9c1.6.1 3.1.3 4.6.6c.7 2.7 1.5 5.3 2.4 7.9a30.6 30.6 0 0 1-3.6 3.6c2.2 4.5 5.7 8 10.3 10.2q1.65-1.95 3.6-3.6c2.6.9 5.2 1.7 7.9 2.4c.3 1.5.5 3.1.5 4.6" />
                </svg>
            ),
        },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 4000);
    };

    return (
        <div className="bg-white min-h-screen py-8 sm:py-16 lg:py-20 px-4 sm:px-6">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-8 sm:mb-12 lg:mb-16 space-y-2 sm:space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Contact <span className="text-blue-600">Us</span>
                    </h2>
                    <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-blue-600 mx-auto rounded-full" />
                    <p className="text-xs sm:text-sm lg:text-base text-slate-500 font-medium pt-1 sm:pt-2">Have questions? We are here to help you.</p>
                </div>

                <div className="bg-slate-50 rounded-2xl sm:rounded-3xl lg:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-row items-stretch">
                    <div className="lg:w-1/2 p-6 sm:p-10 lg:p-16 bg-white border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-center">
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mb-2 sm:mb-4">Get In Touch</h3>
                        <div className="w-10 sm:w-12 h-1 bg-blue-600 mb-6 sm:mb-10 lg:mb-12 rounded-full" />

                        <div className="space-y-5 sm:space-y-8">
                            {contactInfo.map((item) => (
                                <div key={item.label} className="flex items-start sm:items-center gap-4 sm:gap-6 group">
                                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                                        {item.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                                        <p className={`text-xs sm:text-sm lg:text-base text-slate-700 font-bold ${item.className}`}>{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-1/2 p-6 sm:p-10 lg:p-16 flex flex-col justify-center bg-slate-50/50">
                        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                            {isSubmitted && (
                                <div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                                    Message sent successfully!
                                </div>
                            )}

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 ml-1">Your Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Justin Carlos"
                                    required
                                    className="w-full p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 ml-1">Your Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="jCarlos@example.com"
                                    required
                                    className="w-full p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 ml-1">Your Message</label>
                                <textarea
                                    rows={4}
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="How can we help you?"
                                    required
                                    className="w-full p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all resize-none"
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-3.5 sm:py-4 text-xs sm:text-base rounded-xl sm:rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-[0.98] mt-2">
                                Send Message
                            </button>

                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 mt-3 sm:mt-4 uppercase tracking-[0.2em] text-center">
                                ● Powered by JJDev
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}