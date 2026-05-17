import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

// shadcn/ui style class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Smart date formatter
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d, yyyy');
}

// Relative time (e.g. "2 hours ago")
export function timeAgo(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

// Extract readable error message from Axios error
export function getErrorMessage(error: unknown): string {
  const axiosErr = error as AxiosError<ApiError>;
  if (axiosErr.response?.data?.message) {
    return axiosErr.response.data.message;
  }
  if (axiosErr.response?.data?.error) {
    return axiosErr.response.data.error;
  }
  if (axiosErr.message) {
    return axiosErr.message;
  }
  return 'An unexpected error occurred';
}

// Format large numbers (1200 → 1.2k)
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// Get initials from name/username
export function getInitials(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

// Reaction emoji map
export const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
};

// Media URL builder (handles relative paths from file server)
export function buildMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // Relative paths served from /uploads/ by media service via gateway
  return `/uploads/${url}`;
}

// Visibility icon/label
export const VISIBILITY_CONFIG = {
  PUBLIC: { label: 'Public', icon: '🌍' },
  FOLLOWERS: { label: 'Followers', icon: '👥' },
  PRIVATE: { label: 'Only me', icon: '🔒' },
} as const;

// Debounce
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
