/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest'
import { clearProgressCache } from '@/shared/utils/storage';

// Mock localStorage for tests
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        get length() {
            return Object.keys(store).length;
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
});

// Reset localStorage and storage cache before each test
beforeEach(() => {
    localStorage.clear();
    clearProgressCache();
});

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
    value: {
        DEV: true,
        PROD: false,
        MODE: 'test',
    },
    writable: true,
});
