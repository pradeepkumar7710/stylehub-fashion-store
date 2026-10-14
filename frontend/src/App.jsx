import { Link, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

function PageInProgress() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <h1 className="text-3xl tracking-tight">
        This page is being built.
      </h1>
      <Link
        to="/"
        className="mt-6 inline-block text-sm underline underline-offset-4"
      >
        Back to the homepage
      </Link>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <Navbar key={location.key} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<PageInProgress />} />
        <Route
          path="/products"
          element={<Products key={location.search} />}
        />
       <Route path="/products/:productId" element={<ProductDetails />} />
       <Route path="/login" element={<Login />} />
       <Route element={<ProtectedRoute />}>
         <Route path="/cart" element={<Cart />} />
       </Route>
       <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetails key={location.pathname} />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}