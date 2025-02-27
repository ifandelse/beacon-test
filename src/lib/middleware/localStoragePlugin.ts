/* eslint-disable @typescript-eslint/no-explicit-any */
import { effect } from "@preact/signals-react";
import {
    BeaconState,
    EmptyActions,
    EmptyDerived,
    MiddlewareFunction,
    Store,
    StoreConfig,
} from "../types";

export interface LocalStorageOptions<TState extends Record<string, any>> {
    /**
     * The key to use for storing in localStorage
     */
    name: string;
    /**
     * Whether to merge with existing localStorage data or replace it entirely
     * @default true
     */
    merge?: boolean;
    /**
     * Optional serialization function
     * @default JSON.stringify
     */
    serialize?: (value: Partial<TState>) => string;
    /**
     * Optional deserialization function
     * @default JSON.parse
     */
    deserialize?: (value: string) => Partial<TState>;
}

/**
 * Creates a middleware that synchronizes store state with localStorage
 *
 * @example
 * // Basic usage with default options:
 * const persistentStore = createStore(
 *   localStoragePlugin({
 *     initialState: { count: 0 }
 *   }, { name: "counter-store" })
 * );
 *
 * // With custom serialization:
 * const store = createStore(
 *   localStoragePlugin({
 *     initialState: { user: { name: "John" } }
 *   }, {
 *     name: "user-store",
 *     serialize: user => btoa(JSON.stringify(user)),
 *     deserialize: str => JSON.parse(atob(str))
 *   })
 * );
 */
export function localStoragePlugin<
    TState extends Record<string, any>,
    TDerived extends Record<string, (state: BeaconState<TState>) => any> = EmptyDerived<TState>,
    TActions extends Record<string, (...args: any[]) => any> = EmptyActions,
>(
    config: StoreConfig<TState, TDerived, TActions>,
    options: LocalStorageOptions<TState>
): StoreConfig<TState, TDerived, TActions> {
    const {
        name,
        merge = true,
        serialize = JSON.stringify as (value: Partial<TState>) => string,
        deserialize = JSON.parse as (value: string) => Partial<TState>,
    } = options;

    // Try to load state from localStorage
    let storedState: Partial<TState> = {};
    try {
        const stored = window.localStorage.getItem(name);
        if (stored) {
            storedState = deserialize(stored);
        }
    } catch (error: unknown) {
        console.error(
            "Failed to load state from localStorage:",
            error instanceof Error ? error.message : String(error)
        );
    }

    // Merge or replace initialState with localStorage data
    const initialState = merge
        ? { ...config.initialState, ...storedState }
        : ({ ...storedState } as TState);

    // Create a new onStoreCreated function that calls the original one if it exists
    const originalOnStoreCreated = config.onStoreCreated;

    const newOnStoreCreated = (store: Store<TState, TDerived, TActions>) => {
        // Set up localStorage synchronization
        const saveToStorage = () => {
            try {
                const snapshot = store.getStateSnapshot({ withDerived: false });
                window.localStorage.setItem(name, serialize(snapshot));
            } catch (error: unknown) {
                console.error(
                    "Failed to save state to localStorage:",
                    error instanceof Error ? error.message : String(error)
                );
            }
        };

        effect(() => {
            for (const key in initialState) {
                const stateToPersist: Record<string, unknown> = {};
                if (key in store) {
                    stateToPersist[key] = store[key].value;
                }
                saveToStorage();
            }
        });

        // Call the original onStoreCreated if it exists
        if (originalOnStoreCreated) {
            originalOnStoreCreated(store);
        }
    };

    return { ...config, initialState, onStoreCreated: newOnStoreCreated };
}

// Type-safe alias for creating middleware functions with explicit type checking
export const createLocalStorageMiddleware: <
    TState extends Record<string, any>,
    TDerived extends Record<string, (state: BeaconState<TState>) => any> = EmptyDerived<TState>,
    TActions extends Record<string, (...args: any[]) => any> = EmptyActions,
>() => MiddlewareFunction<TState, TDerived, TActions, LocalStorageOptions<TState>> = () =>
    localStoragePlugin;
