import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { useEffect, useRef } from 'react';
import type {
  ExpoSpeechRecognitionErrorCode,
  ExpoSpeechRecognitionNativeEventMap,
  ExpoSpeechRecognitionResultEvent,
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition';

export type SpeechRecognitionModule = typeof ExpoSpeechRecognitionModule;

export type ExpoSpeechRecognitionNativeEvents = {
  [K in keyof ExpoSpeechRecognitionNativeEventMap]: (
    event: ExpoSpeechRecognitionNativeEventMap[K]
  ) => void;
};

export type {
  ExpoSpeechRecognitionErrorCode,
  ExpoSpeechRecognitionNativeEventMap,
  ExpoSpeechRecognitionResultEvent,
  ExpoSpeechRecognitionErrorEvent,
};

let cachedModule: SpeechRecognitionModule | null | undefined;

/**
 * Returns true if speech recognition is available in the current runtime environment.
 * On native, verifies that the native module is linked (false in Expo Go).
 * On web, checks for browser SpeechRecognition API support.
 */
export function isSpeechRecognitionAvailable(): boolean {
  if (Platform.OS === 'web') {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  try {
    const nativeModule = requireOptionalNativeModule('ExpoSpeechRecognition');
    return Boolean(nativeModule);
  } catch {
    return false;
  }
}

/**
 * Safely loads ExpoSpeechRecognitionModule without throwing at module import time
 * when running in environments lacking the native module (e.g. Expo Go).
 */
export function getSpeechRecognitionModule(): SpeechRecognitionModule | null {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  // On native platforms, check if the native module is compiled and available
  if (Platform.OS !== 'web') {
    let hasNative = false;
    try {
      hasNative = Boolean(requireOptionalNativeModule('ExpoSpeechRecognition'));
    } catch {
      hasNative = false;
    }

    if (!hasNative) {
      cachedModule = null;
      return null;
    }
  }

  try {
    // Dynamic require avoids crashing on file evaluation if native module is missing
    const mod = require('expo-speech-recognition');
    cachedModule = mod.ExpoSpeechRecognitionModule as SpeechRecognitionModule;
    return cachedModule;
  } catch (err) {
    console.warn('Speech recognition module could not be loaded:', err);
    cachedModule = null;
    return null;
  }
}

/**
 * Safe subscription hook that unconditionally satisfies Rules of Hooks
 * while gracefully no-opping when speech recognition is unavailable.
 */
export function useSpeechRecognitionEvent<
  K extends keyof ExpoSpeechRecognitionNativeEventMap,
>(
  eventName: K,
  listener: (event: ExpoSpeechRecognitionNativeEventMap[K]) => void
): void {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const mod = getSpeechRecognitionModule();
    if (!mod || typeof mod.addListener !== 'function') {
      return;
    }

    type EventSubscription = { remove: () => void };
    type EmitterWithListener = {
      addListener: (
        event: string,
        listener: (...args: unknown[]) => void
      ) => EventSubscription;
    };
    const emitter = mod as unknown as EmitterWithListener;
    const subscription = emitter.addListener(
      eventName as string,
      (...args: unknown[]) => {
        listenerRef.current?.(
          args[0] as ExpoSpeechRecognitionNativeEventMap[K]
        );
      }
    );

    return () => {
      subscription?.remove?.();
    };
  }, [eventName]);
}
