// src/components/LoadingOverlay.jsx
import React from "react";
import { motion } from "framer-motion";

const spinVariants = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" },
  },
};

const LoadingOverlay = ({ text = "Yuklanmoqda..." }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex flex-col items-center justify-center z-50">
    <motion.div
      variants={spinVariants}
      animate="animate"
      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
    />
    <p className="text-white text-lg font-medium">{text}</p>
  </div>
);

export default LoadingOverlay;
