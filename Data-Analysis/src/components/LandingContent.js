import React, { useState } from "react";
import { motion } from "framer-motion";
import "./LandingContent.css";

const LandingContent = () => {
  const [isHovered, setIsHovered] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 100,
      rotateX: 90,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.8,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 1.2,
        type: "spring",
        stiffness: 120,
      },
    },
    hover: {
      y: -6,
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    tap: {
      scale: 0.95,
      y: -2,
      transition: {
        duration: 0.1,
      },
    },
  };

  const words = ["Data", "Whisper"];

  return (
    <div className="landing-container">
      <motion.div
        className="content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="hero-title">
          <h1 className="title-main">
            {words.map((word, index) => (
              <motion.span
                key={index}
                className="word"
                variants={wordVariants}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.3 },
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="hero-tagline"
            variants={subtitleVariants}
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2 },
            }}
          >
            Speak to your <span className="tagline-highlight">data</span> - it
            listens!
          </motion.p>
        </div>

        <motion.div className="button-container" variants={buttonVariants}>
          <motion.button
            className="cta-button"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => (window.location.href = "/dashboard")}
          >
            <span className="button-text">Get Started</span>
            <motion.div
              className="button-bg"
              animate={{
                opacity: isHovered ? 1 : 0.8,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingContent;
