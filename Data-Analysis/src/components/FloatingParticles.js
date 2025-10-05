import React from 'react';
import { motion } from 'framer-motion';
import './FloatingParticles.css';

const FloatingParticles = () => {
  const dataSymbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                       '+', '-', '*', '/', '=', '<', '>', '{', '}', '[', ']',
                       '%', '&', '|', '^', '~', '?', ':', ';'];
  
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    duration: 5 + Math.random() * 3,
    initialX: 8 + (i % 5) * 18 + Math.random() * 4,
    initialY: 8 + Math.floor(i / 5) * 18 + Math.random() * 4,
    size: 28 + Math.random() * 14,
    symbol: dataSymbols[Math.floor(Math.random() * dataSymbols.length)],
  }));

  return (
    <div className="floating-particles">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="data-particle"
          style={{
            left: `${particle.initialX}%`,
            top: `${particle.initialY}%`,
            fontSize: `${particle.size}px`,
          }}
          animate={{
            y: [-15, -40, -15],
            x: [-10, 10, -10],
            opacity: [0, 1, 0],
            scale: [0.7, 1.2, 0.7],
            rotate: [0, 45, 90],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {particle.symbol}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingParticles;