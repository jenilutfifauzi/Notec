import { Easing, ReduceMotion, withTiming, withSpring, WithTimingConfig, WithSpringConfig } from 'react-native-reanimated';

/**
 * transitions.dev Motion Tokens
 * Direct implementation of Jakub Antalik's transitions.dev motion system.
 * Sourced from https://github.com/Jakubantalik/transitions.dev/skills/transitions-dev/_root.css
 */

export const motionTokens = {
  // Durations
  duration: {
    stagger: 40,      // --duration-stagger: per-item stagger offset
    micro: 80,        // --duration-micro: tooltip/path delay, shake segment, large stagger
    quick: 150,       // --duration-quick: modal/dropdown close, text swap, tooltip appear, press
    fast: 250,        // --duration-fast: icon swap, dropdown/modal open, tabs sliding, page slide, accordion
    medium: 350,      // --duration-medium: panel close, toast close, toast open
    slow: 400,        // --duration-slow: panel open, skeleton content reveal, input clear
    verySlow: 500,    // --duration-very-slow: emphasis moments, badge appear, text reveal, success check
  },

  // Easings - exact cubic-bezier curves from transitions.dev
  easing: {
    // cubic-bezier(0.22, 1, 0.36, 1) - used across modal, dropdown, panel, tabs, page slide, resize, toast
    smoothOut: Easing.bezier(0.22, 1, 0.36, 1),
    // cubic-bezier(0.42, 0, 0.58, 1) or ease-in-out - icon swap, text swap, skeleton reveal
    inOut: Easing.bezier(0.42, 0, 0.58, 1),
    // ease-out - tooltip open/close
    out: Easing.out(Easing.ease),
    // linear - shimmer, skeleton pulse
    linear: Easing.linear,
    // cubic-bezier(0.34, 1.36, 0.64, 1) - badge pop open
    bounce: Easing.bezier(0.34, 1.36, 0.64, 1),
    // cubic-bezier(0.34, 3.85, 0.64, 1) - bouncy return
    bounceStrong: Easing.bezier(0.34, 3.85, 0.64, 1),
    // cubic-bezier(0.34, 1.45, 0.64, 1) - digit pop-in
    digit: Easing.bezier(0.34, 1.45, 0.64, 1),
    // cubic-bezier(0.34, 1.35, 0.64, 1) - toggle switch
    toggle: Easing.bezier(0.34, 1.35, 0.64, 1),
  },

  // Distances in dp/px
  distance: {
    micro: 4,         // --distance-micro: text swap
    shake: 6,         // --distance-small: error shake primary leg
    shakeOvershoot: 4, // --shake-overshoot: error shake recovery leg
    base: 8,          // --distance-base: badge diagonal, page slide, digit distance
    medium: 12,       // --distance-medium: text reveal, clear fly
    toast: 16,        // --toast-distance: toast rise distance
    large: 30,        // --distance-large: check badge appear
  },

  // Scales
  scale: {
    modal: 0.96,       // --scale-large: modal open/close
    dropdown: 0.97,    // --scale-medium: dropdown open
    toast: 0.97,       // --toast-scale: toast open
    press: 0.98,       // press state for buttons, cards, list items
    pressSmall: 0.95,  // press state for chips, icon buttons
    pressAdd: 0.92,    // press state for hero add button
    iconSwapStart: 0.25, // --icon-swap-start-scale: icon swap
  },

  // Component-specific preset timings from transitions.dev
  presets: {
    // 01-card-resize.md
    cardResize: {
      duration: 300,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
    // 02-number-pop-in.md
    digit: {
      duration: 500,
      distance: 8,
      stagger: 70,
      easing: Easing.bezier(0.34, 1.45, 0.64, 1),
    },
    // 04-text-states-swap.md
    textSwap: {
      duration: 150,
      translateY: 4,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    },
    // 06-modal.md
    modal: {
      openDuration: 250,
      closeDuration: 150,
      scale: 0.96,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
    // 09-icon-swap.md
    iconSwap: {
      duration: 250,
      startScale: 0.25,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    },
    // 12-error-state-shake.md
    shake: {
      distance: 6,
      overshoot: 4,
      durA: 80,
      durB: 60,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      revertHold: 3000,
      revertDur: 280,
    },
    // 16-tabs-sliding.md
    tabs: {
      duration: 250,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
    // 21-accordion.md
    accordion: {
      expandDuration: 250,
      collapseDuration: 250,
      chevronDuration: 250,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
    // 22-toast.md
    toast: {
      openDuration: 350,
      closeDuration: 250,
      distance: 16,
      scale: 0.97,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
    // Button & Interactive micro-interactions
    press: {
      pressInDuration: 120,
      pressOutDuration: 250,
      scale: 0.98,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
  },
} as const;

/**
 * Reusable Timing Helpers adhering to transitions.dev
 */
export function timingSmoothOut(toValue: number, duration: number = motionTokens.duration.fast, config?: Partial<WithTimingConfig>) {
  'worklet';
  return withTiming(toValue, {
    duration,
    easing: motionTokens.easing.smoothOut,
    reduceMotion: ReduceMotion.System,
    ...config,
  });
}

export function timingQuick(toValue: number, config?: Partial<WithTimingConfig>) {
  'worklet';
  return withTiming(toValue, {
    duration: motionTokens.duration.quick,
    easing: motionTokens.easing.smoothOut,
    reduceMotion: ReduceMotion.System,
    ...config,
  });
}

export function timingInOut(toValue: number, duration: number = motionTokens.duration.fast, config?: Partial<WithTimingConfig>) {
  'worklet';
  return withTiming(toValue, {
    duration,
    easing: motionTokens.easing.inOut,
    reduceMotion: ReduceMotion.System,
    ...config,
  });
}

export function springBounce(toValue: number, config?: WithSpringConfig) {
  'worklet';
  return withSpring(
    toValue,
    config ?? {
      damping: 15,
      stiffness: 180,
      mass: 0.8,
      reduceMotion: ReduceMotion.System,
    }
  );
}
