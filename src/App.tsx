import ProductList from "./components/ProductList";
import { initializeTelemetry } from "./util/telemetry";

initializeTelemetry();

function App() {
    return (
        <div>
            <h1>Store PoC</h1>
            <ProductList />
        </div>
    );
}

export default App;
