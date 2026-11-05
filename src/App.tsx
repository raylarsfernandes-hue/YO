import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Sobre from './pages/Sobre'
import Inscricao from './pages/Inscricao'
import Confirmacao from './pages/Confirmacao'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Inscritos from './pages/admin/Inscritos'
import AdminProgramacao from './pages/admin/Programacao'
import AdminProfessores from './pages/admin/Professores'
import Configuracoes from './pages/admin/Configuracoes'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/professores" element={<Navigate to="/#professores" replace />} />
        <Route path="/programacao" element={<Navigate to="/#programacao" replace />} />
        <Route path="/oficinas" element={<Navigate to="/#programacao" replace />} />
        <Route path="/inscricao" element={<Inscricao />} />
        <Route path="/confirmacao/:batchId" element={<Confirmacao />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inscritos" element={<Inscritos />} />
          <Route path="programacao" element={<AdminProgramacao />} />
          <Route path="professores" element={<AdminProfessores />} />
          <Route path="oficinas" element={<Navigate to="/admin/programacao" replace />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}
