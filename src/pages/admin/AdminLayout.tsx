import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo_cutout.webp'

export default function AdminLayout() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (session === null) {
      navigate('/admin/login')
      return
    }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(!!data))
  }, [session, navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (session === undefined || (session && isAdmin === null)) {
    return <div className="admin-shell"><p style={{ padding: 40 }}>Carregando...</p></div>
  }

  if (session && isAdmin === false) {
    return (
      <div className="admin-shell">
        <div className="admin-login">
          <h2>Acesso não autorizado</h2>
          <p style={{ opacity: 0.7, marginTop: 10, fontSize: 14 }}>
            Sua conta está autenticada, mas ainda não foi liberada como administradora.
            Peça para alguém adicionar seu usuário na tabela <code>admins</code> no Supabase.
          </p>
          <button className="btn-secondary" style={{ marginTop: 20 }} onClick={handleLogout}>Sair</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="brand"><img src={logo} alt="" /> Inscrições</div>
        <div className="tabs">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
          <NavLink to="/admin/inscritos" className={({ isActive }) => (isActive ? 'active' : '')}>Inscritos</NavLink>
          <NavLink to="/admin/oficinas" className={({ isActive }) => (isActive ? 'active' : '')}>Oficinas</NavLink>
        </div>
        <button className="btn-sm" onClick={handleLogout}>Sair</button>
      </div>
      <div className="admin-body">
        <Outlet />
      </div>
    </div>
  )
}
