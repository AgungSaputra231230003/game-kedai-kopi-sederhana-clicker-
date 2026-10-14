import { useEffect, useMemo, useState } from 'react'
import {
  Coins,
  Coffee,
  Gauge,
  Gift,
  MapPinned,
  Package2,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'

const STORAGE_KEY = 'kedai-kopi-digital-save-v2'

const itemCatalog = [
  { id: 'gulaAren', name: 'Gula Aren Extra', type: 'click', basePrice: 15, effect: 1, icon: '🍯', color: 'from-amber-400 to-orange-500', description: 'Rasa lebih manis, klik makin nikmat.' },
  { id: 'filterV60', name: 'Filter V60', type: 'click', basePrice: 100, effect: 5, icon: '🫖', color: 'from-yellow-400 to-amber-500', description: 'Ekstraksi yang lebih konsisten.' },
  { id: 'baristaMagang', name: 'Barista Magang', type: 'auto', basePrice: 100, effect: 1, icon: '👨‍🍳', color: 'from-emerald-400 to-teal-500', description: 'Membantu menyeduh kopi setiap detik.' },
  { id: 'mesinEspresso', name: 'Mesin Espresso', type: 'auto', basePrice: 1100, effect: 8, icon: '⚙️', color: 'from-cyan-400 to-blue-500', description: 'Output kopi otomatis lebih cepat.' },
  { id: 'cabangBaru', name: 'Cabang Kedai Baru', type: 'auto', basePrice: 12000, effect: 47, icon: '🏪', color: 'from-violet-400 to-fuchsia-500', description: 'Bisnis tumbuh ke skala lebih besar.' },
]

const materialCatalog = [
  { id: 'beans', name: 'Biji Kopi', icon: '🌱', basePrice: 8, color: 'from-emerald-400 to-lime-500' },
  { id: 'milk', name: 'Susu', icon: '🥛', basePrice: 10, color: 'from-slate-200 to-slate-400' },
  { id: 'sugar', name: 'Gula', icon: '🍬', basePrice: 6, color: 'from-pink-300 to-rose-400' },
  { id: 'chocolate', name: 'Cokelat', icon: '🍫', basePrice: 12, color: 'from-amber-700 to-orange-700' },
  { id: 'ice', name: 'Es', icon: '🧊', basePrice: 5, color: 'from-cyan-300 to-blue-400' },
]

const recipeCatalog = [
  { id: 'espresso', name: 'Espresso', icon: '☕', reward: 12, unlockAt: 0, ingredients: { beans: 4 } },
  { id: 'latte', name: 'Latte', icon: '🥛', reward: 30, unlockAt: 150, ingredients: { beans: 6, milk: 3 } },
  { id: 'mocha', name: 'Mocha', icon: '🍫', reward: 75, unlockAt: 600, ingredients: { beans: 8, milk: 4, chocolate: 3 } },
  { id: 'coldbrew', name: 'Cold Brew', icon: '🧊', reward: 120, unlockAt: 2000, ingredients: { beans: 10, ice: 5, sugar: 3 } },
]

const branchCatalog = [
  { id: 'rumahan', name: 'Rumahan', multiplier: 1, unlockAt: 0 },
  { id: 'bandung', name: 'Bandung', multiplier: 1.5, unlockAt: 300 },
  { id: 'jakarta', name: 'Jakarta', multiplier: 2.2, unlockAt: 1800 },
  { id: 'bali', name: 'Bali', multiplier: 3.4, unlockAt: 7000 },
  { id: 'singapore', name: 'Singapore', multiplier: 5.5, unlockAt: 25000 },
]

const defaultPurchases = Object.fromEntries(itemCatalog.map((item) => [item.id, 0]))
const defaultInventory = Object.fromEntries(materialCatalog.map((item) => [item.id, 0]))

function getPrice(item, owned) {
  return Math.floor(item.basePrice * Math.pow(1.15, owned))
}

function getBranchMultiplier(game) {
  const branch = branchCatalog[game.branchIndex] || branchCatalog[0]
  return branch.multiplier
}

function getClickPower(game) {
  const prestigeBoost = 1 + game.prestigeLevel * 0.2
  const upgradeBonus = itemCatalog.reduce((total, item) => {
    if (item.type !== 'click') return total
    return total + item.effect * (game.purchases[item.id] || 0)
  }, 0)

  return (1 + upgradeBonus) * prestigeBoost
}

function getPassiveIncome(game) {
  const prestigeBoost = 1 + game.prestigeLevel * 0.2
  const upgradeIncome = itemCatalog.reduce((total, item) => {
    if (item.type !== 'auto') return total
    return total + item.effect * (game.purchases[item.id] || 0)
  }, 0)

  return upgradeIncome * prestigeBoost * getBranchMultiplier(game)
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0'
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  if (value >= 100) return value.toFixed(0)
  if (value >= 1) return value.toFixed(1)
  return value.toFixed(2)
}

function createInitialGame() {
  return {
    pk: 0,
    totalEarned: 0,
    totalClicks: 0,
    totalSales: 0,
    purchases: { ...defaultPurchases },
    inventory: { ...defaultInventory },
    unlockedRecipes: ['espresso'],
    branchIndex: 0,
    prestigeLevel: 0,
    claimedMissions: {},
    lastSavedAt: Date.now(),
  }
}

function loadSavedGame() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return createInitialGame()

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return createInitialGame()

    const next = {
      ...createInitialGame(),
      ...parsed,
      purchases: { ...defaultPurchases, ...(parsed.purchases || {}) },
      inventory: { ...defaultInventory, ...(parsed.inventory || {}) },
      claimedMissions: parsed.claimedMissions || {},
      unlockedRecipes: parsed.unlockedRecipes || ['espresso'],
    }

    const elapsedSeconds = (Date.now() - (next.lastSavedAt || Date.now())) / 1000
    const offlineIncome = Math.max(0, getPassiveIncome(next) * elapsedSeconds)

    next.pk = Number((next.pk + offlineIncome).toFixed(6))
    next.totalEarned = Number((next.totalEarned + offlineIncome).toFixed(6))
    next.lastSavedAt = Date.now()

    return next
  } catch {
    return createInitialGame()
  }
}

function hasEnoughIngredients(inventory, ingredients) {
  return Object.entries(ingredients).every(([key, amount]) => (inventory[key] || 0) >= amount)
}

function removeIngredients(inventory, ingredients) {
  const next = { ...inventory }
  Object.entries(ingredients).forEach(([key, amount]) => {
    next[key] = (next[key] || 0) - amount
  })
  return next
}

export default function App() {
  const [game, setGame] = useState(() => loadSavedGame())
  const [floatTexts, setFloatTexts] = useState([])

  const effectiveClickPower = useMemo(() => getClickPower(game), [game])
  const effectivePassiveIncome = useMemo(() => getPassiveIncome(game), [game])
  const selectedBranch = branchCatalog[game.branchIndex] || branchCatalog[0]

  const achievements = useMemo(
    () => [
      { id: 'firstSip', label: 'First Sip', unlocked: game.totalEarned >= 1 },
      { id: 'barista', label: 'Barista', unlocked: game.totalClicks >= 50 },
      { id: 'owner', label: 'Pemilik Kedai', unlocked: game.totalEarned >= 1000 },
      { id: 'empire', label: 'Empire Kopi', unlocked: game.totalEarned >= 50000 },
    ],
    [game],
  )

  const missions = useMemo(
    () => [
      {
        id: 'mission-1',
        title: 'Buat 10 minuman',
        target: 10,
        reward: 50,
        progress: game.totalSales,
      },
      {
        id: 'mission-2',
        title: 'Kumpulkan 500 PK',
        target: 500,
        reward: 120,
        progress: game.totalEarned,
      },
      {
        id: 'mission-3',
        title: 'Beli 5 upgrade',
        target: 5,
        reward: 200,
        progress: Object.values(game.purchases).reduce((sum, value) => sum + value, 0),
      },
      {
        id: 'mission-4',
        title: 'Buka cabang baru',
        target: 1,
        reward: 250,
        progress: game.branchIndex >= 1 ? 1 : 0,
      },
    ],
    [game],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setGame((prev) => {
        const incomePerTick = effectivePassiveIncome / 10
        if (incomePerTick <= 0) return prev

        return {
          ...prev,
          pk: Number((prev.pk + incomePerTick).toFixed(6)),
          totalEarned: Number((prev.totalEarned + incomePerTick).toFixed(6)),
          lastSavedAt: Date.now(),
        }
      })
    }, 100)

    return () => clearInterval(interval)
  }, [effectivePassiveIncome])

  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...game, lastSavedAt: Date.now() }))
    }, 10000)

    return () => clearInterval(saveInterval)
  }, [game])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...game, lastSavedAt: Date.now() }))
  }, [game])

  const addFloatingText = (amount, x = 50, y = 50) => {
    const id = `${Date.now()}-${Math.random()}`
    setFloatTexts((prev) => [...prev, { id, amount, x, y }])
    setTimeout(() => {
      setFloatTexts((prev) => prev.filter((item) => item.id !== id))
    }, 900)
  }

  const handleCoffeeClick = () => {
    setGame((prev) => ({
      ...prev,
      pk: Number((prev.pk + effectiveClickPower).toFixed(6)),
      totalEarned: Number((prev.totalEarned + effectiveClickPower).toFixed(6)),
      totalClicks: prev.totalClicks + 1,
      lastSavedAt: Date.now(),
    }))

    addFloatingText(`+${formatNumber(effectiveClickPower)}`, 52, 52)
  }

  const buyItem = (itemId) => {
    const item = itemCatalog.find((entry) => entry.id === itemId)
    if (!item) return

    setGame((prev) => {
      const owned = prev.purchases[item.id] || 0
      const cost = getPrice(item, owned)
      if (prev.pk < cost) return prev

      return {
        ...prev,
        pk: Number((prev.pk - cost).toFixed(6)),
        purchases: {
          ...prev.purchases,
          [item.id]: owned + 1,
        },
        lastSavedAt: Date.now(),
      }
    })
  }

  const buyMaterial = (materialId) => {
    const material = materialCatalog.find((item) => item.id === materialId)
    if (!material) return

    setGame((prev) => {
      const cost = material.basePrice
      if (prev.pk < cost) return prev

      return {
        ...prev,
        pk: Number((prev.pk - cost).toFixed(6)),
        inventory: {
          ...prev.inventory,
          [material.id]: (prev.inventory[material.id] || 0) + 1,
        },
        lastSavedAt: Date.now(),
      }
    })
  }

  const craftRecipe = (recipeId) => {
    const selectedRecipe = recipeCatalog.find((recipe) => recipe.id === recipeId)
    if (!selectedRecipe) return

    setGame((prev) => {
      const unlocked = (prev.unlockedRecipes || []).includes(recipeId)
      if (!unlocked) return prev
      if (!hasEnoughIngredients(prev.inventory, selectedRecipe.ingredients)) return prev

      const reward = selectedRecipe.reward * (1 + prev.prestigeLevel * 0.15) * getBranchMultiplier(prev)
      const nextInventory = removeIngredients(prev.inventory, selectedRecipe.ingredients)

      return {
        ...prev,
        pk: Number((prev.pk + reward).toFixed(6)),
        totalEarned: Number((prev.totalEarned + reward).toFixed(6)),
        totalSales: prev.totalSales + 1,
        inventory: nextInventory,
        lastSavedAt: Date.now(),
      }
    })

    addFloatingText(`+${formatNumber(selectedRecipe.reward)}`, 50, 42)
  }

  const unlockBranch = (branchIndex) => {
    const branch = branchCatalog[branchIndex]
    if (!branch) return

    setGame((prev) => {
      if (prev.totalEarned < branch.unlockAt) return prev
      if (prev.branchIndex === branchIndex) return prev

      return {
        ...prev,
        branchIndex,
        lastSavedAt: Date.now(),
      }
    })
  }

  const claimMission = (missionId) => {
    const mission = missions.find((item) => item.id === missionId)
    if (!mission) return

    setGame((prev) => {
      if (prev.claimedMissions[missionId]) return prev
      const progress = mission.progress
      if (progress < mission.target) return prev

      return {
        ...prev,
        pk: Number((prev.pk + mission.reward).toFixed(6)),
        totalEarned: Number((prev.totalEarned + mission.reward).toFixed(6)),
        claimedMissions: {
          ...prev.claimedMissions,
          [missionId]: true,
        },
        lastSavedAt: Date.now(),
      }
    })
  }

  const prestige = () => {
    const available = Math.max(0, Math.floor(game.totalEarned / 10000))
    if (available <= 0) return

    setGame((prev) => {
      const gained = Math.max(1, Math.floor(prev.totalEarned / 10000))
      const resetGame = createInitialGame()
      resetGame.prestigeLevel = prev.prestigeLevel + gained
      return resetGame
    })
  }

  const resetGame = () => {
    const confirmed = window.confirm('Reset progres kedai dan mulai dari awal?')
    if (!confirmed) return
    const newGame = createInitialGame()
    setGame(newGame)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGame))
  }

  const totalOwnedItems = Object.values(game.purchases).reduce((sum, value) => sum + value, 0)
  const prestigeReady = game.totalEarned >= 10000

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_25%),linear-gradient(180deg,#2b1a17_0%,#120c0a_100%)] px-4 py-6 text-amber-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300/80">Idle Clicker</p>
            <h1 className="mt-2 font-['Fredoka',sans-serif] text-3xl text-amber-100">Kedai Kopi Digital</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-50">
              <span className="text-amber-300">PK</span>
              <div className="mt-1 text-xl font-bold">{formatNumber(game.pk)}</div>
            </div>
            <button
              onClick={resetGame}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </header>

        <div className="mb-5 grid gap-3 md:grid-cols-5">
          <StatCard icon={<Coins size={18} />} label="KpK" value={`${formatNumber(effectiveClickPower)}`} accent="amber" />
          <StatCard icon={<Gauge size={18} />} label="KpD" value={`${formatNumber(effectivePassiveIncome)}`} accent="cyan" />
          <StatCard icon={<TrendingUp size={18} />} label="Total Earned" value={`${formatNumber(game.totalEarned)}`} accent="emerald" />
          <StatCard icon={<Sparkles size={18} />} label="Klik" value={`${formatNumber(game.totalClicks)}`} accent="violet" />
          <StatCard icon={<Star size={18} />} label="Prestige" value={`${game.prestigeLevel}`} accent="pink" />
        </div>

        <main className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_1.2fr]">
          <section className="rounded-[32px] border border-amber-400/20 bg-coffee-900/60 p-4 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-amber-100/80">
              <span className="inline-flex items-center gap-2"><Coffee size={16} /> Play Area</span>
              <span>Level: <strong>{selectedBranch.name}</strong></span>
            </div>

            <div className="relative flex min-h-[460px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-amber-500/20 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.12),_rgba(30,27,75,0.1)_40%,_rgba(12,14,19,0.7)_100%)] p-6">
              <div className="absolute inset-x-10 top-8 flex justify-between text-4xl opacity-30">
                <span>☕</span>
                <span>🌿</span>
                <span>✨</span>
              </div>

              <button
                onClick={handleCoffeeClick}
                className="coffee-button group relative flex h-56 w-56 items-center justify-center rounded-full border-4 border-amber-300/40 bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 text-8xl shadow-[0_0_60px_rgba(251,191,36,0.4)] transition hover:scale-105 active:scale-95"
                aria-label="Buat kopi"
              >
                <span className="absolute inset-4 rounded-full border border-white/30" />
                <span className="absolute -top-3 left-8 h-12 w-10 rounded-full bg-white/30 blur-md opacity-60" />
                <span className="absolute -bottom-2 right-6 h-14 w-12 rounded-full bg-amber-950/20 blur-sm" />
                <span className="relative">☕</span>
              </button>

              <div className="mt-6 flex flex-col items-center">
                <p className="text-2xl font-bold text-amber-100">{formatNumber(game.pk)} PK</p>
                <p className="mt-2 text-sm text-amber-100/70">Klik untuk membuat kopi dan menambah pendapatan</p>
              </div>

              <div className="pointer-events-none absolute inset-0">
                {floatTexts.map((item) => (
                  <div
                    key={item.id}
                    className="float-text absolute font-bold text-amber-300"
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  >
                    {item.amount}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-amber-100">
              <TrendingUp size={18} />
              <span className="font-semibold">Dashboard</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status saat ini</p>
              <div className="mt-3 space-y-3 text-sm">
                <InfoRow label="Poin Kopi" value={`${formatNumber(game.pk)} PK`} />
                <InfoRow label="Kopi / Klik" value={`${formatNumber(effectiveClickPower)} PK`} />
                <InfoRow label="Kopi / Detik" value={`${formatNumber(effectivePassiveIncome)} PK/s`} />
                <InfoRow label="Total Klik" value={`${formatNumber(game.totalClicks)}`} />
                <InfoRow label="Cabang" value={selectedBranch.name} />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Achievement</p>
              <div className="mt-3 space-y-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      achievement.unlocked
                        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
                        : 'border-white/10 bg-slate-900/20 text-slate-400'
                    }`}
                  >
                    <span>{achievement.label}</span>
                    <span>{achievement.unlocked ? '✅' : '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-violet-100"><MapPinned size={16} /> <span className="font-semibold">Cabang</span></div>
              <div className="space-y-2">
                {branchCatalog.map((branch, index) => {
                  const unlocked = game.totalEarned >= branch.unlockAt
                  const active = game.branchIndex === index

                  return (
                    <button
                      key={branch.id}
                      onClick={() => unlockBranch(index)}
                      disabled={!unlocked}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'border-violet-300 bg-violet-500/20 text-violet-50'
                          : unlocked
                            ? 'border-white/10 bg-slate-900/20 text-slate-200 hover:bg-slate-800/40'
                            : 'cursor-not-allowed border-white/5 bg-slate-900/10 text-slate-500'
                      }`}
                    >
                      <span>{branch.name}</span>
                      <span>{unlocked ? `${branch.multiplier}x` : `${formatNumber(branch.unlockAt)} PK`}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-[32px] border border-amber-500/20 bg-coffee-950/80 p-4 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-amber-100">
              <ShoppingCart size={18} />
              <span className="font-semibold">Toko & Sistem</span>
            </div>

            <div className="space-y-4">
              {['click', 'auto'].map((type) => (
                <div key={type} className="rounded-2xl border border-white/10 bg-slate-900/30 p-3">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-200">
                    {type === 'click' ? <Zap size={15} /> : <Users size={15} />}
                    {type === 'click' ? 'Upgrade Klik' : 'Otomatisasi'}
                  </div>

                  <div className="space-y-3">
                    {itemCatalog
                      .filter((item) => item.type === type)
                      .map((item) => {
                        const owned = game.purchases[item.id] || 0
                        const cost = getPrice(item, owned)
                        const affordable = game.pk >= cost

                        return (
                          <button
                            key={item.id}
                            onClick={() => buyItem(item.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                              affordable
                                ? 'border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/15'
                                : 'border-white/10 bg-slate-900/20 opacity-80'
                            }`}
                          >
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-xl`}>
                              {item.icon}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-amber-50">{item.name}</span>
                                <span className="text-xs text-amber-200/80">x{owned}</span>
                              </div>
                              <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                              <div className="mt-2 flex items-center justify-between text-xs text-amber-100/80">
                                <span>{owned === 0 ? 'Belum dibeli' : `+${formatNumber(item.effect)} ${type === 'click' ? 'KpK' : 'KpD'}`}</span>
                                <span className="font-bold">{formatNumber(cost)} PK</span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-200">
                  <Package2 size={15} /> Bahan Baku
                </div>
                <div className="space-y-2">
                  {materialCatalog.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => buyMaterial(material.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900/20 px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800/60"
                    >
                      <span className="flex items-center gap-2"><span>{material.icon}</span> {material.name}</span>
                      <span className="text-emerald-200">{formatNumber(game.inventory[material.id] || 0)}</span>
                      <span className="text-amber-200">{formatNumber(material.basePrice)} PK</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-200">
                  <Gift size={15} /> Misi Harian
                </div>
                <div className="space-y-2">
                  {missions.map((mission) => {
                    const progress = Math.min(mission.progress, mission.target)
                    const isDone = progress >= mission.target
                    const isClaimed = Boolean(game.claimedMissions[mission.id])

                    return (
                      <div key={mission.id} className="rounded-xl border border-white/10 bg-slate-900/20 p-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-amber-50">{mission.title}</span>
                          <span className="text-amber-200">{formatNumber(mission.reward)} PK</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                          <span>{progress}/{mission.target}</span>
                          <button
                            onClick={() => claimMission(mission.id)}
                            disabled={!isDone || isClaimed}
                            className={`rounded-lg px-2 py-1 ${
                              isClaimed
                                ? 'bg-emerald-500/20 text-emerald-200'
                                : isDone
                                  ? 'bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
                                  : 'bg-slate-700/40 text-slate-400'
                            }`}
                          >
                            {isClaimed ? 'Dibayar' : isDone ? 'Ambil' : 'Belum siap'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-pink-500/20 bg-pink-500/10 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-pink-200">
                  <Trophy size={15} /> Prestige
                </div>
                <div className="space-y-2 text-sm text-pink-50">
                  <p>Bonus permanen: +{game.prestigeLevel * 20}%</p>
                  <p>Prestige siap: {prestigeReady ? 'Ya' : 'Belum'} ({formatNumber(Math.max(0, 10000 - game.totalEarned))} PK lagi)</p>
                  <button
                    onClick={prestige}
                    disabled={!prestigeReady}
                    className={`w-full rounded-xl px-3 py-2 font-semibold ${
                      prestigeReady
                        ? 'bg-pink-500/30 text-pink-50 hover:bg-pink-500/40'
                        : 'cursor-not-allowed bg-slate-700/40 text-slate-400'
                    }`}
                  >
                    Prestige sekarang
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-amber-100">
            <Coffee size={18} />
            <span className="font-semibold">Resep Kopi</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recipeCatalog.map((recipe) => {
              const unlocked = game.totalEarned >= recipe.unlockAt || game.unlockedRecipes.includes(recipe.id)
              const canCraft = unlocked && hasEnoughIngredients(game.inventory, recipe.ingredients)

              return (
                <div key={recipe.id} className="rounded-2xl border border-white/10 bg-slate-900/20 p-3">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-3xl">{recipe.icon}</div>
                      <h3 className="mt-2 font-bold text-amber-50">{recipe.name}</h3>
                    </div>
                    <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-200">{formatNumber(recipe.reward)} PK</span>
                  </div>

                  <div className="mb-3 text-xs text-slate-300">
                    <p className="mb-1 font-medium text-slate-200">Bahan:</p>
                    <div className="space-y-1">
                      {Object.entries(recipe.ingredients).map(([key, amount]) => {
                        const material = materialCatalog.find((item) => item.id === key)
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span>{material ? material.name : key}</span>
                            <span>{amount}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => craftRecipe(recipe.id)}
                    disabled={!unlocked}
                    className={`w-full rounded-xl px-3 py-2 font-semibold ${
                      unlocked
                        ? canCraft
                          ? 'bg-emerald-500/30 text-emerald-100 hover:bg-emerald-500/40'
                          : 'bg-slate-700/40 text-slate-200 hover:bg-slate-600/40'
                        : 'cursor-not-allowed bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    {unlocked ? 'Buat minuman' : `Buka di ${formatNumber(recipe.unlockAt)} PK`}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent }) {
  const accentMap = {
    amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    cyan: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
    emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    violet: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
    pink: 'border-pink-400/30 bg-pink-500/10 text-pink-200',
  }

  return (
    <div className={`rounded-2xl border p-3 ${accentMap[accent]}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="rounded-lg bg-white/10 p-2">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
      <span className="text-slate-300">{label}</span>
      <span className="font-semibold text-amber-50">{value}</span>
    </div>
  )
}
