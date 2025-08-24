import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Alternative implementation if clsx and tailwind-merge are not available
export function cnFallback(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Use the fallback if the main libraries are not available
export const cnSafe = (...inputs) => {
  try {
    return twMerge(clsx(inputs));
  } catch (error) {
    return inputs.filter(Boolean).join(' ');
  }
};