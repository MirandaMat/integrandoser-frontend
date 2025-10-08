// components/LineReveal.tsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const LineReveal = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="feature-connector-line"
      initial={{ width: 0 }}
      animate={isInView ? { width: '80%' } : { width: 0 }}
      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
    />
  );
};

export default LineReveal;
