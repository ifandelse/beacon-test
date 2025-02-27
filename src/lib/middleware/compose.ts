import { BeaconState, StoreConfig } from "../types";

/**
 * Helper function to compose multiple middleware functions together
 *
 * @param middlewares Array of middleware functions to compose
 * @returns A function that applies all middleware in sequence
 */
export function compose<
    TState extends Record<string, unknown>,
    TDerived extends Record<string, (state: BeaconState<TState>) => unknown>,
    TActions extends Record<string, (...args: unknown[]) => unknown>,
>(
    ...middlewares: ((
        config: StoreConfig<TState, TDerived, TActions>
    ) => StoreConfig<TState, TDerived, TActions>)[]
) {
    return (
        config: StoreConfig<TState, TDerived, TActions>
    ): StoreConfig<TState, TDerived, TActions> => {
        return middlewares.reduce((acc, middleware) => middleware(acc), config);
    };
}
