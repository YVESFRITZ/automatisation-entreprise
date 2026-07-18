import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react'
import { useApp } from '../lib/store'
import { money, monthKey, monthLabel, dateLabel, todayISO, nowISO, uid } from '../lib/format'
import { TX_CATEGORIES, type Transaction, type TxType } from '../lib/types'
import { Modal, StatCard, EmptyState, Segmented, Field, PageHeader } from '../components/ui'
import { GroupedBars } from '../components/Charts'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { format, subMonths } from 'date-fns'

export default function Caisse() {
  const { data, settings, addTransaction, deleteTransaction } = useApp()
  const [month, setMonth] = useState(monthKey(nowISO()))
  const [open, setOpen] = useState(false)
  const [presetType, setPresetType] = useState<TxType>('entree')

  const currency = settings.currency

  const monthTx = useMemo(
    () =>
      data.transactions
        .filter((t) => monthKey(t.date) === month)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.transactions, month],
  )

  const totals = useMemo(() => {
    const entree = monthTx.filter((t) => t.type === 'entree').reduce((s, t) => s + t.amount, 0)
    const sortie = monthTx.filter((t) => t.type === 'sortie').reduce((s, t) => s + t.amount, 0)
    const globalEntree = data.transactions.filter((t) => t.type === 'entree').reduce((s, t) => s + t.amount, 0)
    const globalSortie = data.transactions.filter((t) => t.type === 'sortie').reduce((s, t) => s + t.amount, 0)
    return { entree, sortie, net: entree - sortie, global: globalEntree - globalSortie }
  }, [monthTx, data.transactions])

  const chartData = useMemo(() => {
    const base = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(base, 5 - i)
      const key = format(d, 'yyyy-MM')
      const tx = data.transactions.filter((t) => monthKey(t.date) === key)
      return {
        label: format(d, 'MMM').replace('.', ''),
        entree: tx.filter((t) => t.type === 'entree').reduce((s, t) => s + t.amount, 0),
        sortie: tx.filter((t) => t.type === 'sortie').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [data.transactions])

  function shiftMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    setMonth(format(new Date(y, m - 1 + delta, 1), 'yyyy-MM'))
  }

  function openAdd(type: TxType) {
    setPresetType(type)
    setOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Caisse"
        subtitle="Vos entrées et sorties, totalisées automatiquement"
        action={
          <button className="btn-primary hidden sm:inline-flex" onClick={() => openAdd('entree')}>
            <Plus size={18} /> Ajouter
          </button>
        }
      />

      {/* Sélecteur de mois */}
      <div className="flex items-center justify-between card px-3 py-2">
        <button className="p-2 rounded-lg hover:bg-bg-hover text-ink3" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-ink capitalize">{monthLabel(month)}</span>
        <button className="p-2 rounded-lg hover:bg-bg-hover text-ink3" onClick={() => shiftMonth(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Statistiques */}
      <div className="stagger grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Entrées du mois" value={<AnimatedNumber value={totals.entree} currency={currency} />} icon={<TrendingUp size={18} />} accent="ok" />
        <StatCard label="Sorties du mois" value={<AnimatedNumber value={totals.sortie} currency={currency} />} icon={<TrendingDown size={18} />} accent="danger" />
        <StatCard
          label="Solde du mois"
          value={<AnimatedNumber value={totals.net} currency={currency} />}
          sub={totals.net >= 0 ? 'Bénéfice' : 'Déficit'}
          icon={<Scale size={18} />}
          accent={totals.net >= 0 ? 'ok' : 'danger'}
        />
        <StatCard label="Solde total (cumul)" value={<AnimatedNumber value={totals.global} currency={currency} />} icon={<Wallet size={18} />} accent="brand" />
      </div>

      {/* Graphique 6 mois */}
      <div className="card p-4 sm:p-5">
        <p className="text-sm font-semibold text-ink2 mb-4">6 derniers mois</p>
        <GroupedBars data={chartData} currency={currency} />
      </div>

      {/* Boutons rapides mobile */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <button className="btn bg-ok/15 text-ok border border-ok/30" onClick={() => openAdd('entree')}>
          <ArrowDownLeft size={18} /> Entrée
        </button>
        <button className="btn bg-danger/15 text-danger border border-danger/30" onClick={() => openAdd('sortie')}>
          <ArrowUpRight size={18} /> Sortie
        </button>
      </div>

      {/* Liste */}
      <div>
        <p className="text-sm font-semibold text-ink2 mb-3">
          Opérations · <span className="text-ink3">{monthTx.length}</span>
        </p>
        {monthTx.length === 0 ? (
          <EmptyState
            icon={<Wallet size={26} />}
            title="Aucune opération ce mois-ci"
            hint="Ajoutez une entrée (vente, service) ou une sortie (achat, dépense) pour commencer le calcul automatique."
            action={
              <button className="btn-primary" onClick={() => openAdd('entree')}>
                <Plus size={18} /> Ajouter une opération
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {monthTx.map((t) => (
              <TxRow key={t.id} tx={t} currency={currency} onDelete={() => deleteTransaction(t.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Bouton flottant mobile */}
      <button
        onClick={() => openAdd('entree')}
        className="sm:hidden fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-brand text-white shadow-glow grid place-items-center active:scale-95"
        aria-label="Ajouter une opération"
      >
        <Plus size={26} />
      </button>

      <TransactionModal
        open={open}
        onClose={() => setOpen(false)}
        presetType={presetType}
        onSave={(t) => {
          addTransaction(t)
          setOpen(false)
        }}
      />
    </div>
  )
}

function TxRow({ tx, currency, onDelete }: { tx: Transaction; currency: string; onDelete: () => void }) {
  const isIn = tx.type === 'entree'
  return (
    <div className="card px-3.5 py-3 flex items-center gap-3 group">
      <div
        className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
          isIn ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'
        }`}
      >
        {isIn ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink truncate">{tx.label || tx.category}</p>
        <p className="text-xs text-ink3">
          {tx.category} · {dateLabel(tx.date)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums ${isIn ? 'text-ok' : 'text-danger'}`}>
          {isIn ? '+' : '−'}
          {money(tx.amount, currency)}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-ink4 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition"
        aria-label="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

function TransactionModal({
  open,
  onClose,
  presetType,
  onSave,
}: {
  open: boolean
  onClose: () => void
  presetType: TxType
  onSave: (t: Transaction) => void
}) {
  const [type, setType] = useState<TxType>(presetType)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(TX_CATEGORIES[0])
  const [label, setLabel] = useState('')
  const [method, setMethod] = useState<Transaction['method']>('especes')
  const [date, setDate] = useState(todayISO())

  // Réinitialise le type quand on ouvre via un bouton spécifique
  useEffect(() => setType(presetType), [presetType, open])

  const amountNum = Number(amount.replace(/\s/g, '').replace(',', '.'))
  const valid = amount !== '' && !Number.isNaN(amountNum) && amountNum > 0

  function save() {
    if (!valid) return
    onSave({
      id: uid(),
      type,
      amount: amountNum,
      category,
      label: label.trim(),
      method,
      date,
      createdAt: nowISO(),
    })
    setAmount('')
    setLabel('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle opération"
      footer={
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary flex-1" disabled={!valid} onClick={save}>
            Enregistrer
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <Segmented
            value={type}
            onChange={setType}
            options={[
              { value: 'entree', label: 'Entrée', icon: <ArrowDownLeft size={15} /> },
              { value: 'sortie', label: 'Sortie', icon: <ArrowUpRight size={15} /> },
            ]}
          />
        </div>

        <Field label="Montant">
          <div className="relative">
            <input
              autoFocus
              inputMode="numeric"
              className="input text-2xl font-bold !py-3 pr-16"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d\s.,]/g, ''))}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink3 font-semibold text-sm">
              FCFA
            </span>
          </div>
        </Field>

        <Field label="Catégorie">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {TX_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Description (optionnel)">
          <input
            className="input"
            placeholder="Ex : Vente 3 sacs de ciment"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Moyen">
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as Transaction['method'])}>
              <option value="especes">Espèces</option>
              <option value="mobile">Mobile Money</option>
              <option value="virement">Virement</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
