"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import { useIdleTimer } from "@/lib/hooks/useIdleTimer";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Component that shows a sign-in prompt when the user has been idle for 3 minutes.
 * Only shown to unauthenticated users.
 */
export function IdleSignInPrompt() {
  const { userId } = useAuth();
  const { isIdle, resetTimer } = useIdleTimer(3 * 60 * 1000);
  const [showPrompt, setShowPrompt] = useState(false);

  // Use a stable value for comparison
  const shouldShow = !userId && isIdle;

  if (shouldShow && !showPrompt) {
    setShowPrompt(true);
  } else if (!shouldShow && showPrompt) {
    setShowPrompt(false);
  }

  if (userId) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 shadow-2xl"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-text">Still searching?</h3>
              <p className="mt-2 text-text-subtle">
                Sign in to save your progress, track booths you&apos;ve visited, and enter exclusive contests!
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <SignInButton mode="modal">
                <button className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-hover transition-all">
                  Sign In Now
                </button>
              </SignInButton>
              <button
                onClick={() => {
                  setShowPrompt(false);
                  resetTimer();
                }}
                className="w-full rounded-xl py-2 text-sm font-medium text-text-subtle hover:text-text transition-all"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
