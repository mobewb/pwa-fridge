import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import AuthForm from './pages/AuthForm'
import ProductForm from './pages/ProductForm'
import Products from './pages/Products'
import ShopList from './pages/ShopList'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthForm mode="login" />} />
      <Route path="/register" element={<AuthForm mode="register" />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Products />} />
        <Route path="/shop" element={<ShopList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
