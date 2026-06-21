'use client';
import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1] // Apple-like custom ease
      }}
      className="flex-1 w-full flex flex-col h-full"
    >
      {children}
    </motion.div>
  );
}
