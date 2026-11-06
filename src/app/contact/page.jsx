'use client';

import React, { useState } from 'react';
import { MapPin, Mail, Phone, CheckCircle } from 'lucide-react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 4000);
    };

    return (
        <div className="bg-white min-h-screen py-20 px-6">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Contact <span className="text-blue-600">Us</span>
                    </h2>
                    <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
                    <p className="text-slate-500 font-medium pt-2">Have questions? We are here to help you.</p>
                </div>

                <div className="bg-slate-50 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-row items-stretch">

                    <div className="lg:w-1/2 p-10 md:p-16 bg-white border-r border-slate-100 flex flex-col justify-center">
                        <h3 className="text-4xl font-black text-slate-900 mb-4">Get In Touch</h3>
                        <div className="w-12 h-1 bg-blue-600 mb-12 rounded-full"></div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-6 group">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</p>
                                    <p className="text-slate-700 font-bold">Camp Cabal, Maquinaya, Barangay Barretto, Olongapo City</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Us</p>
                                    <p className="text-slate-700 font-bold">onecall@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                                    <p className="text-slate-700 font-bold">(+63) 903 222 1212</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-slate-50/50">
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {isSubmitted && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-bold flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    Message sent successfully!
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Your Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Justin Carlos"
                                    required
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Your Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="jCarlos@example.com"
                                    required
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Your Message</label>
                                <textarea
                                    rows={5}
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="How can we help you?"
                                    required
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all resize-none"
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-[0.98] mt-2">
                                Send Message
                            </button>

                            <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.2em] text-center">
                                ● Powered by JJDev
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}