/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signal } from "@preact/signals-react";

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
 * The main configuration interface for creating a store.
 * This defines the complete structure of a store including:
 * - initialState: The initial values for all state properties
 * - derived: Computed values that depend on state
 * - actions: Functions that can update the state
 *
 * @template TState The state object type
 * @template TDerived Record of derived/computed value functions
 * @template TActions Record of action functions
 * @example
 * createStore({
 *   initialState: { count: 0, name: 'User' },
 *   derived: { countDoubled: state => state.count.value * 2 },
 *   actions: { increment: (state, amount) => { state.count.value += amount } }
 * })
 */
export interface StoreConfig<
    TState,
    TDerived extends Record<string, (state: BeaconState<TState>) => any> = Record<
        never,
        (state: BeaconState<TState>) => any
    >,
    TActions extends Record<string, (...args: any[]) => any> = {},
> {
    initialState: TState;
    derived?: TDerived;
    actions?: StoreActions<TState, TActions>;
}
