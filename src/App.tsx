import ProductList from "./components/ProductList";
import { initializeTelemetry } from "./util/telemetry";
import './App.css'

initializeTelemetry();

function App() {
    return (
        <div id="root">
            <h1>Store PoC</h1>
            <ProductList />
        </div>
    );
}

export default App;
