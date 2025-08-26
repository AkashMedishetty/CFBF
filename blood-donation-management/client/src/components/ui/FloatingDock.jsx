import React from 'react';
import { motion } from 'framer-motion';

const DockItem = ({ href, title, icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={title}
    className="group"
  >
    <motion.div
      whileHover={{ scale: 1.25, y: -6 }}
      whileTap={{ scale: 0.95 }}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-white shadow-lg"
      title={title}
    >
      <div className="h-6 w-6">
        {icon}
      </div>
    </motion.div>
  </a>
);

const FloatingDock = ({ items = [], className = '' }) => {
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      {items.map((item) => (
        <DockItem key={item.title} {...item} />
      ))}
    </div>
  );
};

export default FloatingDock;

