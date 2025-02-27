/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReadonlySignal, Signal } from "@preact/signals-react";

/**
 * Transforms a state object type into a reactive state object where each property
 * is wrapped in a Signal. This allows for fine-grained reactivity where each
 * property can be independently updated and observed.
 *
 * @template TState The original state object type
 * @example
 * // If TState is: { count: number, name: string }
 * // BeaconState<TState> becomes: { count: Signal<number>, name: Signal<string> }
 */
export type BeaconState<TState> = { [K in keyof TState]: Signal<TState[K]> };

/**
 * Helper type that extracts all parameters of an action function except the first one (state).
 * This allows us to provide proper typing when calling actions from outside the store,
 * where the state parameter is handled internally by the store.
 *
 * @template T The action function type
 * @example
 * // If T is: (state, id: number, name: string) => void
 * // ActionParameters<T> becomes: [id: number, name: string]
 */
export type ActionParameters<T extends (...args: any[]) => any> = T extends (
    state: any,
    ...args: infer P
) => any
    ? P
    : never;

/**
 * Defines the structure of action methods in the store configuration.
 * Each action receives the state signals as its first parameter, followed by
 * any additional parameters specific to that action.
 *
 * @template TState The state object type
 * @template TActions Record of action functions with their implementation signature
 * @example
 * // For a store with actions: { increment: (state, amount: number) => void }
 * // This ensures the action is properly typed in the store configuration
 */
export type StoreActions<TState, TActions extends Record<string, (...args: any[]) => any>> = {
    [K in keyof TActions]: (
        state: BeaconState<TState>,
        ...args: ActionParameters<TActions[K]>
    ) => ReturnType<TActions[K]>;
};

/**
 * Default type for derived state with no actual derivations
 */
export type EmptyDerived<TState> = Record<never, (state: BeaconState<TState>) => any>;

/**
 * Default type for empty actions
 */
export type EmptyActions = Record<string, never>;

/**
 * The main configuration interface for creating a store.
 * This defines the complete structure of a store including:
 * - initialState: The initial values for all state properties
 * - derived: Computed values that depend on state
 * - actions: Functions that can update the state
 * - onStoreCreated: Optional callback that runs after store initialization
 *
 * @template TState The state object type
 * @template TDerived Record of derived/computed value functions
 * @template TActions Record of action functions
 * @example
 * createStore({
 *   initialState: { count: 0, name: 'User' },
 *   derived: { countDoubled: state => state.count.value * 2 },
 *   actions: { increment: (state, amount) => { state.count.value += amount } },
 *   onStoreCreated: (store) => console.log('Store created with:', store.getStateSnapshot())
 * })
 */
export interface StoreConfig<
    TState extends Record<string, any>,
    TDerived extends Record<string, (state: BeaconState<TState>) => any> = EmptyDerived<TState>,
    TActions extends Record<string, (...args: any[]) => any> = EmptyActions,
> {
    /**
     * Initial state values for the store
     */
    initialState: TState;

    /**
     * Computed values derived from the state
     * These are automatically updated when their dependencies change
     */
    derived?: TDerived;

    /**
     * Actions that can modify the state
     * These are functions that receive the state signals as their first parameter
     */
    actions?: StoreActions<TState, TActions>;

    /**
     * Optional callback that is executed after the store is created
     * This is particularly useful for middleware to set up side effects or subscriptions
     *
     * @param store The fully initialized store instance
     */
    onStoreCreated?: (store: Store<TState, TDerived, TActions>) => void;
}

/**
 * Represents a complete store instance returned by createStore
 *
 * The Store type is a union of three parts:
 * 1. State signals - The reactive state properties
 * 2. Derived values - Computed values based on state
 * 3. Action methods - How state is mutated
 *
 * @template TState The state object type containing all state properties
 * @template TDerived Record of derived/computed value functions
 * @template TActions Record of action functions
 *
 * @example
 * // For a store created with:
 * const store = createStore({
 *   initialState: { count: 0 },
 *   derived: { doubled: state => state.count.value * 2 },
 *   actions: { increment: (state, amount) => { state.count.value += amount } }
 * });
 *
 * // The resulting store type has:
 * // - State signals: store.count (Signal<number>)
 * // - Derived values: store.doubled (ReadonlySignal<number>)
 * // - Actions: store.actions.increment(5)
 * // - Utilities: store.getStateSnapshot()
 */
export type Store<
    TState extends Record<string, any>,
    TDerived extends Record<string, (state: BeaconState<TState>) => any> = EmptyDerived<TState>,
    TActions extends Record<string, (...args: any[]) => any> = EmptyActions,
> =
    // 1. State signals - reactive state properties that can be read or updated
    { [K in keyof TState]: Signal<TState[K]> } & {
        // 2. Derived values - computed properties that update automatically when dependencies change
        [K in keyof TDerived]: ReadonlySignal<ReturnType<TDerived[K]>>;
    } & {
        // 3. Store methods and actions
        /**
         * Collection of actions that can update the store state
         * These are methods that have been bound to the store's state
         */
        actions: {
            [K in keyof TActions]: (
                ...args: ActionParameters<TActions[K]>
            ) => ReturnType<TActions[K]>;
        };

        /**
         * Creates a plain object snapshot of the current state values
         * Useful for debugging, logging, or serialization
         *
         * @param opt Options for snapshot generation
         * @param opt.withDerived When true, includes derived values in the snapshot
         * @returns A plain object with current state values (not signals)
         */
        getStateSnapshot: (opt?: { withDerived: boolean }) => TState;
    };

/**
 * Type helper for middleware functions to avoid repeating generic parameters
 *
 * @template TState Type of the state object
 * @template TDerived Type of derived computations
 * @template TActions Type of actions
 * @template TOptions Type of middleware-specific options
 * @template TResult Type of the result
 */
export type MiddlewareFunction<
    TState extends Record<string, any>,
    TDerived extends Record<string, (state: BeaconState<TState>) => any> = EmptyDerived<TState>,
    TActions extends Record<string, (...args: any[]) => any> = EmptyActions,
    TOptions = any,
    TResult = StoreConfig<TState, TDerived, TActions>,
> = (config: StoreConfig<TState, TDerived, TActions>, options: TOptions) => TResult;
