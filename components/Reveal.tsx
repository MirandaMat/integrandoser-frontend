// components/Reveal.tsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

type RevealProps = {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
};

const Reveal = ({ children, direction = 'up', delay = 0 }: RevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
      x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
