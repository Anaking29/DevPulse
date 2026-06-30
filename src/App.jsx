import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', Go: '#00ADD8', Rust: '#dea584',
  Java: '#b07219', 'C#': '#239120', PHP: '#4F5D95', Ruby: '#701516',
  Shell: '#89e051', Vue: '#41b883', Svelte: '#ff3e00', Dart: '#00B4AB',
}

function StatCard({ label, value, sub, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[#e8e8e6] p-6 bg-white"
    >
      <p className="text-xs font-mono tracking-widest uppercase text-[#999] mb-3">{label}</p>
      <p className="text-4xl font-bold text-[#111] leading-none mb-1" style={accent ? { color: accent } : {}}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#bbb] mt-1">{sub}</p>}
    </motion.div>
  )
}

function LangBar({ lang, pct, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-[#333] w-24 shrink-0">{lang}</span>
      <div className="flex-1 h-1.5 bg-[#f0f0ee] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color || '#111' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-mono text-[#999] w-10 text-right">{pct.toFixed(1)}%</span>
    </div>
  )
}

function RepoCard({ repo }) {
  const lang = repo.language
  const color = LANG_COLORS[lang] || '#888'
  const updated = new Date(repo.updated_at)
  const days = Math.floor((Date.now() - updated) / 86400000)
  const timeAgo = days === 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days}d`

  return (
    <motion.a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="block border border-[#e8e8e6] p-5 hover:border-[#111] transition-colors duration-200 group bg-white"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-[#111] group-hover:underline truncate">{repo.name}</h3>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5 text-[#ccc] group-hover:text-[#111] transition-colors">
          <path d="M2 12L12 2M12 2H5M12 2v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {repo.description && (
        <p className="text-xs text-[#888] mb-3 leading-relaxed line-clamp-2">{repo.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {lang && <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />}
          <span className="text-xs text-[#888]">{lang || '—'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#bbb] font-mono">
          <span>⭐ {repo.stargazers_count}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </motion.a>
  )
}

function EmptyState({ onSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-16 h-16 border-2 border-dashed border-[#ddd] rounded-full flex items-center justify-center mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
          <path d="M12 8v4l3 3"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#111] mb-2">Buscá un perfil de GitHub</h2>
      <p className="text-sm text-[#999] max-w-xs">Ingresá un nombre de usuario para ver sus métricas, repositorios y lenguajes favoritos.</p>
    </div>
  )
}

export default function App() {
  const [input, setInput] = useState('')
  const [username, setUsername] = useState('')
  const [user, setUser] = useState(null)
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (uname) => {
    if (!uname.trim()) return
    setLoading(true)
    setError(null)
    setUser(null)
    setRepos([])
    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${uname}`),
        fetch(`https://api.github.com/users/${uname}/repos?sort=updated&per_page=30`),
      ])
      if (!userRes.ok) throw new Error(userRes.status === 404 ? 'Usuario no encontrado' : 'Error al conectar con GitHub')
      const userData = await userRes.json()
      const reposData = await reposRes.json()
      setUser(userData)
      setRepos(Array.isArray(reposData) ? reposData : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return
    setUsername(input.trim())
    fetchData(input.trim())
  }

  // Language stats
  const langMap = {}
  repos.forEach(r => { if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1 })
  const totalLangRepos = Object.values(langMap).reduce((a, b) => a + b, 0)
  const langs = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([lang, count]) => ({ lang, pct: (count / totalLangRepos) * 100 }))

  const totalStars = repos.reduce((a, r) => a + r.stargazers_count, 0)
  const forked = repos.filter(r => r.fork).length
  const original = repos.length - forked

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <header className="border-b border-[#e8e8e6] bg-[#f8f8f6] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-[#111] rounded flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.748-1.026 2.748-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111] font-mono">DevPulse</span>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2 max-w-lg">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Buscar usuario de GitHub..."
              className="flex-1 border border-[#e0e0de] bg-white px-4 py-2 text-sm text-[#111] placeholder-[#bbb] outline-none focus:border-[#111] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#111] text-white px-5 py-2 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Ver'}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="border border-red-200 bg-red-50 text-red-600 px-5 py-4 text-sm font-medium mb-6">
              {error}
            </motion.div>
          )}

          {!user && !loading && !error && <EmptyState key="empty" />}

          {user && (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Profile */}
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-[#e8e8e6]">
                <img src={user.avatar_url} alt={user.login} className="w-16 h-16 rounded-full border-2 border-[#e8e8e6]" />
                <div>
                  <h1 className="text-2xl font-bold text-[#111]">{user.name || user.login}</h1>
                  <a href={user.html_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-mono text-[#888] hover:text-[#111] transition-colors">
                    @{user.login}
                  </a>
                  {user.bio && <p className="text-sm text-[#666] mt-1 max-w-lg">{user.bio}</p>}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <StatCard label="Repositorios" value={repos.length} sub={`${original} propios · ${forked} forks`} />
                <StatCard label="Seguidores" value={user.followers.toLocaleString()} sub={`siguiendo ${user.following}`} />
                <StatCard label="Estrellas totales" value={totalStars} accent="#f59e0b" />
                <StatCard label="Miembro desde" value={new Date(user.created_at).getFullYear()} sub={user.location || '—'} />
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Languages */}
                {langs.length > 0 && (
                  <div className="md:col-span-1">
                    <h2 className="text-xs font-mono tracking-widest uppercase text-[#999] mb-4">Lenguajes</h2>
                    <div className="flex flex-col gap-3">
                      {langs.map(({ lang, pct }) => (
                        <LangBar key={lang} lang={lang} pct={pct} color={LANG_COLORS[lang]} />
                      ))}
                    </div>

                    {/* Lang dots legend */}
                    <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-[#e8e8e6]">
                      {langs.map(({ lang }) => (
                        <div key={lang} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[lang] || '#888' }} />
                          <span className="text-xs text-[#888]">{lang}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repos */}
                <div className={langs.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}>
                  <h2 className="text-xs font-mono tracking-widest uppercase text-[#999] mb-4">
                    Repositorios recientes
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {repos.slice(0, 8).map(r => <RepoCard key={r.id} repo={r} />)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
