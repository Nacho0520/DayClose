import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // DETECTOR DE VERIFICACIÓN: Detecta si el usuario vuelve tras pulsar el enlace del email
  useEffect(() => {
    const checkEmailVerified = () => {
      // Supabase a veces añade fragmentos en la URL tras verificar
      const hash = window.location.hash
      if (hash.includes('access_token') || hash.includes('type=signup')) {
        setSuccessMsg('¡Correo verificado con éxito! Ya puedes iniciar sesión.')
        // Limpiamos la URL para que no quede el token ahí
        window.history.replaceState(null, null, window.location.pathname)
      }
    }
    checkEmailVerified()
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    let error

    if (isSignUp) {
      // LOGICA DE REGISTRO
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      error = signUpError
      
      if (!error) {
        setSuccessMsg('¡Casi listo! Revisa tu email para confirmar tu cuenta y poder entrar.')
        setEmail('')
        setPassword('')
        setFullName('')
      }
    } else {
      // LOGICA DE LOGIN
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      error = signInError
    }

    if (error) {
      setErrorMsg(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-[2.5rem] bg-neutral-800/50 p-8 shadow-2xl border border-neutral-700/50 backdrop-blur-xl"
      >
        <h1 className="mb-2 text-center text-3xl font-black text-white tracking-tighter">
          {isSignUp ? 'Crear Cuenta' : 'MiVida'}
        </h1>
        <p className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-neutral-500">
          {isSignUp ? 'Empieza a organizar tu rutina' : 'Inicia sesión para continuar'}
        </p>

        {/* MENSAJES DE ESTADO */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20"
            >
              <AlertCircle size={18} className="shrink-0" />
              <p>{errorMsg}</p>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20"
            >
              {isSignUp ? <Mail size={18} className="shrink-0" /> : <CheckCircle size={18} className="shrink-0" />}
              <p className="font-medium leading-tight">{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form className="space-y-4" onSubmit={handleAuth}>
          {isSignUp && (
            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Tu Nombre
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none transition-all"
                placeholder="Ej. Nacho"
              />
            </div>
          )}

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none transition-all"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-white px-4 py-4 text-sm font-black text-neutral-900 hover:bg-neutral-200 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            {loading ? 'Sincronizando...' : isSignUp ? 'CREAR CUENTA' : 'ENTRAR'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="text-xs font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}