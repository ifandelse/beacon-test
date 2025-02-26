/* eslint-disable @typescript-eslint/no-explicit-any */
import { BeaconState, createStore } from "../lib";

export interface Product {
    id: string;
    name: string;
    price: number;
    qty: number;
}

export type ProductListState = {
    products: Product[];
    sortBy: "name" | "price" | "qty";
    sortDirection: "asc" | "desc";
    selectedProductId: string | null;
};

export type ProductListComputedState = {
    sortedProducts: (state: BeaconState<ProductListState>) => Product[];
    selectedProduct: (state: BeaconState<ProductListState>) => Product | null;
};

export type ProductListActions = {
    setProducts: (state: BeaconState<ProductListState>, products: Product[]) => void;
    setSortBy: (state: BeaconState<ProductListState>, sortBy: "name" | "price" | "qty") => void;
    setSortDirection: (state: BeaconState<ProductListState>, sortDirection: "asc" | "desc") => void;
    setSelectedProductId: (state: BeaconState<ProductListState>, id: string) => void;
};

export const productListStore = createStore<
    ProductListState,
    ProductListComputedState,
    ProductListActions
>({
    initialState: { products: [], sortBy: "name", sortDirection: "asc", selectedProductId: null },
    derived: {
        sortedProducts: (state) => {
            const sorted = [...state.products.value];
            sorted.sort((a, b) => {
                const sortByField = state.sortBy.value;
                const direction = state.sortDirection.value === "asc" ? 1 : -1;
                if (sortByField === "name") {
                    return direction * a[sortByField].localeCompare(b[sortByField]);
                }
                return direction * (a[sortByField] - b[sortByField]);
            });
            return sorted;
        },
        selectedProduct: (state) => {
            return state.selectedProductId.value
                ? state.products.value.find(
                      (p: Product) => p.id === state.selectedProductId.value
                  ) || null
                : null;
        },
    },
    actions: {
        setProducts: (state, products) => {
            state.products.value = products;
        },
        setSortBy: (state, sortBy) => {
            state.sortBy.value = sortBy;
        },
        setSortDirection: (state, sortDirection) => {
            state.sortDirection.value = sortDirection;
        },
        setSelectedProductId: (state, id) => {
            state.selectedProductId.value = id;
        },
    },
});
