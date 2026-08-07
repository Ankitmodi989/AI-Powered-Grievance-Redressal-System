"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar"; 
import Image from "next/image";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  //Mock recent grievance data
  const recent = [
    {
      id: 1,
      title: "Road Damage Fixed in Lucknow",
      desc: "Potholes repaired and drainage restored in Alambagh area within 2 days after citizen complaint.",
      img: "/lucknow-mock.jpg",
    },
    {
      id: 2,
      title: "Water Supply Restored in Kanpur",
      desc: "Community handpump and supply lines repaired, ensuring clean water access for families.",
      img: "/kanpur-mock.jpg",
    },
    {
      id: 3,
      title: "Hospital Grievance Resolved in Varanasi",
      desc: "Healthcare services improved through citizen feedback and prompt admin response.",
      img: "/varanasi-mock.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0F] text-gray-800 dark:text-white">
      <Navbar />

      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        <Image
          src="/bg-img.jpg" 
          alt="AI Governance Background"
          fill
          className="object-cover brightness-75 blur-sm scale-105" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70"></div>{" "}
        <div className="relative z-10 max-w-4xl px-6">
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold mb-4 text-white leading-tight" 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            AI-Powered Grievance Management System
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto" 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Empowering citizens through AI-driven analytics and smart redressal
            for transparent governance.
          </motion.p>

          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              onClick={() => router.push("/auth/login/user")}
              className="px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300
                         border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900" 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Login as User
            </motion.button>
            <motion.button
              onClick={() => router.push("/auth/register")}
              className="px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300
                         bg-cyan-500 hover:bg-cyan-600 text-white" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Register as User
            </motion.button>
            <motion.button
              onClick={() => router.push("/auth/login/admin")}
              className="px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300
                         bg-gray-700 hover:bg-gray-600 text-gray-200" 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Admin Login
            </motion.button>
          </div>
        </div>
      </section>

      {/* Recent Problems Solved */}
      <section className="py-20 bg-[#0A0A0F] text-center">
        {" "}
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-100">
          Recent Grievances Solved
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">
          {recent.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }} // Enhanced hover effect
              className="bg-[#1A1A2E] rounded-2xl shadow-xl overflow-hidden cursor-pointer
                         border border-gray-700 hover:border-cyan-500 transition-all duration-300" // Added subtle border
            >
              <div className="relative h-56 w-full">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20"></div>{" "}
              </div>
              <div className="p-6 text-left">
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm">
        <div className="space-y-2">
          <p>
            © 2027 AI-Powered Grievance Management System | Built by{" "}
            <span className="text-cyan-400 font-semibold">Team Thunder</span>{" "}
            {/* Used accent color for name */}
          </p>
          <div className="flex justify-center space-x-4 mt-2">
            <a
              href=""
              className="hover:text-white transition-colors duration-200"
            >
              📧 Email
            </a>
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200"
            >
              🐦 Twitter
            </a>
            <a
              href="https://www.linkedin.com/in/your_linkedin" // Remember to update this with your actual LinkedIn
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200"
            >
              💼 LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}