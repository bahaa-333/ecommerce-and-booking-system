import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { MyTenantsProvider } from "./lib/MyTenantsContext";
import { CartProvider } from "./lib/CartContext";
import RequireAdmin from "./components/RequireAdmin";
import RequireBusinessAccess from "./components/RequireBusinessAccess";
import RequireAuth from "./components/RequireAuth";
import AdminLayout from "./layouts/AdminLayout";
import BusinessLayout from "./layouts/BusinessLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import StoreLayout from "./layouts/StoreLayout";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AdminDashboard from "./pages/admin/Dashboard";
import Applications from "./pages/admin/Applications";
import Tenants from "./pages/admin/Tenants";
import BusinessTypes from "./pages/admin/BusinessTypes";
import SelectTenant from "./pages/business/SelectTenant";
import BusinessDashboard from "./pages/business/Dashboard";
import Products from "./pages/business/Products";
import Services from "./pages/business/Services";
import Orders from "./pages/business/Orders";
import Bookings from "./pages/business/Bookings";
import Payments from "./pages/business/Payments";
import Team from "./pages/business/Team";
import StorefrontSettings from "./pages/business/Storefront";
import Home from "./pages/customer/Home";
import Discover from "./pages/customer/Discover";
import Storefront from "./pages/customer/Storefront";
import ProductDetail from "./pages/customer/ProductDetail";
import ServiceDetail from "./pages/customer/ServiceDetail";
import BookingFlow from "./pages/customer/BookingFlow";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Account from "./pages/customer/Account";
import MyActivity from "./pages/customer/MyActivity";
import OrderDetail from "./pages/customer/OrderDetail";
import BookingDetail from "./pages/customer/BookingDetail";

function WithMyTenants() {
  return (
    <MyTenantsProvider>
      <Outlet />
    </MyTenantsProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="applications" element={<Applications />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="business-types" element={<BusinessTypes />} />
            </Route>

            <Route element={<WithMyTenants />}>
              <Route path="/business" element={<SelectTenant />} />

              <Route
                path="/business/:tenantSlug"
                element={
                  <RequireBusinessAccess>
                    <BusinessLayout />
                  </RequireBusinessAccess>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BusinessDashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="services" element={<Services />} />
                <Route path="orders" element={<Orders />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="payments" element={<Payments />} />
                <Route path="team" element={<Team />} />
                <Route path="storefront" element={<StorefrontSettings />} />
              </Route>
            </Route>

            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />

              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
              <Route
                path="/account/orders"
                element={
                  <RequireAuth>
                    <MyActivity />
                  </RequireAuth>
                }
              />

              <Route path="/store/:tenantSlug" element={<StoreLayout />}>
                <Route index element={<Storefront />} />
                <Route path="products/:productId" element={<ProductDetail />} />
                <Route path="services/:serviceId" element={<ServiceDetail />} />
                <Route
                  path="orders/:orderId"
                  element={
                    <RequireAuth>
                      <OrderDetail />
                    </RequireAuth>
                  }
                />
                <Route
                  path="bookings/:bookingId"
                  element={
                    <RequireAuth>
                      <BookingDetail />
                    </RequireAuth>
                  }
                />
                <Route
                  path="services/:serviceId/book"
                  element={
                    <RequireAuth>
                      <BookingFlow />
                    </RequireAuth>
                  }
                />
                <Route
                  path="cart"
                  element={
                    <RequireAuth>
                      <Cart />
                    </RequireAuth>
                  }
                />
                <Route
                  path="checkout"
                  element={
                    <RequireAuth>
                      <Checkout />
                    </RequireAuth>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
