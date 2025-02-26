/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, ReadonlySignal, signal } from "@preact/signals-react";
import { BeaconState, StoreConfig, ActionParameters } from "./types";

/**
 * Creates a reactive state management store using Preact signals
 *
 * This function creates a store with three main features:
 * 1. State signals: Reactive state values that trigger updates when changed
 * 2. Derived values: Computed values that depend on state signals
 * 3. Actions: Functions that can update multiple state values together
 *
 * @param config The store configuration object containing initial state, derived values, and actions
 * @returns An object containing state signals, derived values, actions, and a snapshot function
 */
export function createStore<
    // Base state type
    TState extends Record<string, any>,
    // Type for derived/computed values
    TDerived extends Record<string, (state: BeaconState<TState>) => any> = Record<
        never,
        (state: BeaconState<TState>) => any
    >,
    // Type for action methods
    TActions extends Record<string, (...args: any[]) => any> = {},
>(config: StoreConfig<TState, TDerived, TActions>) {
    // Create signal objects for each state property
    const stateSignals: BeaconState<TState> = {} as BeaconState<TState>;
    for (const key in config.initialState) {
        stateSignals[key] = signal(config.initialState[key]);
    }

    // Create computed/derived values based on state signals
    const derived: { [K in keyof TDerived]: ReadonlySignal<ReturnType<TDerived[K]>> } = {} as any;
    if (config.derived) {
        for (const key in config.derived) {
            // Prevent naming conflicts between state and derived values
            if (key in stateSignals) {
                throw new Error(`Derived key '${key}' conflicts with state signal`);
            }
            // Create a computed signal that automatically updates when dependencies change
            derived[key] = computed(() =>
                config.derived![key](stateSignals as BeaconState<TState>)
            );
        }
    }

    // Create action functions that can modify the state
    const actions = {} as {
        [K in keyof TActions]: (...args: ActionParameters<TActions[K]>) => void;
    };
    if (config.actions) {
        for (const actionName in config.actions) {
            // Wrap each action function to provide access to state signals
            actions[actionName as keyof TActions] = (...args) => {
                config.actions![actionName](stateSignals, ...args);
            };
        }
    }

    /**
     * Creates a plain object snapshot of current state values
     * Useful for debugging, logging, or serialization
     *
     * @returns A plain object with current state values (not signals)
     */
    const getStateSnapshot = () => {
        const state: Partial<TState> = {};
        for (const key in stateSignals) {
            state[key] = stateSignals[key].value;
        }
        return state as TState;
    };

    return { ...stateSignals, ...derived, actions, getStateSnapshot };
}
