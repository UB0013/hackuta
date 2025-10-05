import React from 'react';
import { motion } from 'framer-motion';
import './GradientOverlay.css';

const GradientOverlay = () => {
  return (
    <motion.div 
      className="gradient-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    />
  );
};

export default GradientOverlay;