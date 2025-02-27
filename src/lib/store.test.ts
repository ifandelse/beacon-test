/* eslint-disable @typescript-eslint/no-explicit-any */
const mockSigReact = { computed: jest.fn(), signal: jest.fn() };
jest.mock("@preact/signals-react", () => {
    return mockSigReact;
});

describe("store", () => {
    let storeModule: { createStore: any }, storeInstance: any;

    beforeEach(async () => {
        mockSigReact.computed.mockImplementation((cb) => cb);
        mockSigReact.signal.mockImplementation((val) => {
            return { value: val };
        });
        storeModule = await import("./store");
    });

    describe("with initial state", () => {
        beforeEach(() => {
            storeInstance = storeModule.createStore({ initialState: { foo: "bar" } });
        });

        it("should create signals for each state property", () => {
            expect(mockSigReact.signal).toHaveBeenCalledWith("bar");
        });

        it("should export the created signal as state on the store instance", () => {
            expect(storeInstance.foo).toEqual({ value: "bar" });
        });
    });

    describe("with derived state", () => {
        describe("when the derived state key has no conflicts with state", () => {
            let computedVal: any;

            beforeEach(() => {
                mockSigReact.computed.mockReset();
                mockSigReact.computed.mockImplementationOnce((cb) => {
                    computedVal = cb();
                    return { value: computedVal };
                });
                storeInstance = storeModule.createStore({
                    initialState: { foo: "bar" },
                    derived: { derivedFoo: (state: any) => state.foo.value.toUpperCase() },
                });
            });

            it("should create a dervied state prop called derivedFoo", () => {
                expect(mockSigReact.computed).toHaveBeenCalledWith(expect.any(Function));
                expect(computedVal).toEqual("BAR");
            });

            it("should export the created signal as state on the store instance", () => {
                expect(storeInstance.derivedFoo).toEqual({ value: "BAR" });
            });
        });

        describe("when the derived state key conflicts with state", () => {
            it("should throw an error", () => {
                expect(() => {
                    storeModule.createStore({
                        initialState: { foo: "bar" },
                        derived: { foo: (state: any) => state.foo.value.toUpperCase() },
                    });
                }).toThrow("Derived key 'foo' conflicts with state signal");
            });
        });
    });

    describe("with actions", () => {
        let mockSignal: any;

        beforeEach(() => {
            mockSigReact.signal.mockReset();
            mockSignal = { value: "" };
            mockSigReact.signal.mockImplementation((val) => {
                mockSignal.value = val;
                return mockSignal;
            });
            storeInstance = storeModule.createStore({
                initialState: { foo: "bar" },
                actions: {
                    setFoo: (state: any, val: string) => {
                        state.foo.value = val;
                    },
                },
            });
            storeInstance.actions.setFoo("baz");
        });

        it("should create action functions that modify state", () => {
            expect(mockSignal.value).toEqual("baz");
        });
    });

    describe("with getStateSnapshot", () => {
        let snapshot: any;

        describe("when called without options", () => {
            beforeEach(() => {
                storeInstance = storeModule.createStore({
                    initialState: { foo: "bar", baz: "qux" },
                });
                snapshot = storeInstance.getStateSnapshot();
            });

            it("should return a snapshot of the current state", () => {
                expect(snapshot).toEqual({ foo: "bar", baz: "qux" });
            });
        });

        describe("when called with { withDerived: true }", () => {
            let computedVal: any;

            beforeEach(() => {
                mockSigReact.computed.mockReset();
                mockSigReact.computed.mockImplementationOnce((cb) => {
                    computedVal = cb();
                    return { value: computedVal };
                });
                storeInstance = storeModule.createStore({
                    initialState: { foo: "bar", baz: "qux" },
                    derived: { derivedFoo: (state: any) => state.foo.value.toUpperCase() },
                });
                snapshot = storeInstance.getStateSnapshot({ withDerived: true });
            });

            it("should include derived state in the snapshot", () => {
                expect(snapshot).toEqual({ foo: "bar", baz: "qux", derivedFoo: "BAR" });
            });
        });
    });
});
