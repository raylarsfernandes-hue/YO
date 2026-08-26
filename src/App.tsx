import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Inscricao from './pages/Inscricao'
import Confirmacao from './pages/Confirmacao'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Inscritos from './pages/admin/Inscritos'
import Oficinas from './pages/admin/Oficinas'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/inscricao" element={<Inscricao />} />
      <Route path="/confirmacao/:code" element={<Confirmacao />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inscritos" element={<Inscritos />} />
        <Route path="oficinas" element={<Oficinas />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  )
}
