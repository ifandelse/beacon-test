/* eslint-disable @typescript-eslint/no-explicit-any */
import { effect } from "@preact/signals-react";
import { productListStore } from "../store/productListStore";

// Mock telemetry API
const telemetryApi = {
    sendEvent: (eventName: string, data: any) => {
        console.log(`Telemetry event: ${eventName}`, data);
    },
};

export function initializeTelemetry() {
    let prevSortBy = productListStore.sortBy.value;
    let prevSortDirection = productListStore.sortDirection.value;

    const dispose = effect(() => {
        const sortBy = productListStore.sortBy.value;
        const sortDirection = productListStore.sortDirection.value;

        // Only send event if something changed
        if (sortBy !== prevSortBy || sortDirection !== prevSortDirection) {
            telemetryApi.sendEvent("SORT_CHANGED", {
                sortBy,
                sortDirection,
                prevSortBy,
                prevSortDirection,
            });
            prevSortBy = sortBy;
            prevSortDirection = sortDirection;
        }
    });

    // Return cleanup function
    return dispose;
}
