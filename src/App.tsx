import { Routes, Route } from 'react-router-dom'
import { WorkshopSelectionProvider } from './context/WorkshopSelectionContext'
import Home from './pages/Home'
import Sobre from './pages/Sobre'
import Professores from './pages/Professores'
import Oficinas from './pages/Oficinas'
import Inscricao from './pages/Inscricao'
import Confirmacao from './pages/Confirmacao'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Inscritos from './pages/admin/Inscritos'
import AdminOficinas from './pages/admin/Oficinas'
import Configuracoes from './pages/admin/Configuracoes'

export default function App() {
  return (
    <WorkshopSelectionProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/professores" element={<Professores />} />
        <Route path="/oficinas" element={<Oficinas />} />
        <Route path="/inscricao" element={<Inscricao />} />
        <Route path="/confirmacao/:batchId" element={<Confirmacao />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inscritos" element={<Inscritos />} />
          <Route path="oficinas" element={<AdminOficinas />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
    </WorkshopSelectionProvider>
  )
}
