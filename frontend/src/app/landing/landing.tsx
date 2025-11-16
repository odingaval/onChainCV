"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  Wallet, Shield, CheckCircle, Zap, Users, Github, FileText, Lock, Globe, ArrowRight,
} from "lucide-react";

export default function Landing() {
  const [mobileMenuOpen] = useState(false); // stripped nav, keep state placeholder

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } },
  };

  const features = [
    { icon: Shield, title: "On-Chain Credentials", description: "Store immutable skill proofs and certifications directly on the blockchain. Your achievements can never be altered or falsified." },
    { icon: Wallet, title: "Wallet-Based Identity", description: "Your CV is tied to your Polkadot address. No passwords, no centralized servers—just your wallet, your identity." },
    { icon: CheckCircle, title: "Verifiable Proof-of-Work", description: "Recruiters can instantly verify your contributions, projects, and credentials without intermediaries." },
  ];

  const steps = [
    { icon: Wallet, title: "Connect Wallet", description: "Link your Polkadot wallet" },
    { icon: FileText, title: "Create Profile", description: "Build your on-chain resume" },
    { icon: Zap, title: "Add Credentials", description: "Upload projects & achievements" },
    { icon: Globe, title: "Share Your CV", description: "Get your unique on-chain URL" },
  ];

  const whyPoints = [
    { icon: Lock, title: "True Decentralization", description: "No central authority controls your data" },
    { icon: Shield, title: "Fraud-Proof", description: "Cryptographically verified credentials" },
    { icon: Users, title: "Data Ownership", description: "You own and control your career data" },
    { icon: Globe, title: "Global Access", description: "Access your CV anywhere, anytime" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white overflow-hidden">
      {/* Hero */}
      <section className="relative pt-28 md:pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-6">
                <span className="text-indigo-400 text-sm font-medium">Powered by Polkadot</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Prove Your Skills.
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Own Your Data.</span>
              </h1>

              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                OnchainCV is a decentralized resume platform where you store proof-of-work,
                credentials, and achievements directly on Polkadot. Take control of your
                professional identity with blockchain-verified credentials that can never be faked.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/view" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/50 flex items-center justify-center gap-2">
                  Launch App
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#features" className="px-8 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all text-center">
                  Learn More
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-3xl opacity-40"></div>

                <div className="relative space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl"></div>
                    <div>
                      <div className="h-3 w-32 bg-slate-700 rounded"></div>
                      <div className="h-2 w-24 bg-slate-800 rounded mt-2"></div>
                    </div>
                  </div>

                  {[1, 2, 3].map((i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="backdrop-blur-sm bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div className="flex-1">
                          <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                          <div className="h-2 bg-slate-800 rounded w-1/2 mt-2"></div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 relative scroll-mt-24 md:scroll-mt-28">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Why Choose OnchainCV?</span>
            </h2>
            <p className="text-xl text-slate-400">The future of professional credentials is decentralized</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp} whileHover={{ y: -10 }} className="group relative backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl p-8 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 relative scroll-mt-24 md:scroll-mt-28">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">How It Works</span>
            </h2>
            <p className="text-xl text-slate-400">Get started in four simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            {steps.map((step, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="relative">
                <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl p-8 border border-slate-700/50 text-center">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl border-4 border-slate-950">
                    {index + 1}
                  </div>
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-indigo-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="py-20 px-6 relative scroll-mt-24 md:scroll-mt-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Why OnchainCV?</span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                In a world where credentials can be faked and professional data is controlled
                by corporations, OnchainCV returns power to the individual. Built on Polkadot's
                cutting-edge blockchain technology, your career history becomes immutable,
                verifiable, and truly yours.
              </p>

              <div className="flex items-center gap-4 backdrop-blur-sm bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" fill="white" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-lg">Powered by Polkadot</p>
                  <p className="text-sm text-slate-400">Next-generation blockchain infrastructure</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid grid-cols-2 gap-6">
              {whyPoints.map((point, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} whileHover={{ scale: 1.05 }} className="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <point.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">{point.title}</h3>
                  <p className="text-sm text-slate-400">{point.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="backdrop-blur-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-3xl p-12 border border-indigo-500/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Join the Community</h2>
              <p className="text-xl text-slate-300 mb-8">Connect with professionals building verifiable credentials</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/view" className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/50 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Launch App
                </Link>
                <a href="https://github.com/odingaval/onChainCV" target="_blank" className="px-8 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer (kept minimal; your app header already exists) */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">OnchainCV</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 OnchainCV. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/odingaval/onChainCV" className="text-slate-400 hover:text-indigo-400 transition-colors" target="_blank"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors"><Users className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}