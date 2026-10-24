'use client'

import { useState, type FormEvent } from 'react'
import { Box, MapPinned, Package, Ruler, Type } from 'lucide-react'

type RegistrationTarget = 'space' | 'item'
type SpaceRegistrationMode = 'simple' | 'map'

const spaceParents = ['우리 집', '거실', 'TV장', '오른쪽 서랍']
const itemLocations = ['거실', 'TV장', '오른쪽 서랍']

export function CreateRegistrationForm() {
  const [target, setTarget] = useState<RegistrationTarget>('space')
  const [spaceMode, setSpaceMode] = useState<SpaceRegistrationMode>('simple')
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('등록 양식 확인이 완료됐어요. 다음 단계에서 이 값을 Supabase 저장과 배치 검증에 연결합니다.')
  }

  const isSpace = target === 'space'
  const isMapRegistration = isSpace && spaceMode === 'map'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <SectionTitle icon={Box} title="무엇을 등록할까요?" description="공간은 계층과 지도를 만들고, 물건은 특정 공간에 보관됩니다." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            selected={isSpace}
            icon={MapPinned}
            title="공간 등록"
            description="방, 수납장, 서랍, 상자처럼 다른 것을 담는 구조"
            onClick={() => {
              setTarget('space')
              setMessage(null)
            }}
          />
          <ChoiceCard
            selected={!isSpace}
            icon={Package}
            title="물건 등록"
            description="수량과 보관 공간을 기록하는 실제 물건"
            onClick={() => {
              setTarget('item')
              setMessage(null)
            }}
          />
        </div>
      </section>

      {isSpace && (
        <section>
          <SectionTitle icon={Type} title="어떤 방식으로 등록할까요?" description="좌표 없이 먼저 기록하거나, 현재 지도에 바로 배치할 수 있습니다." />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={spaceMode === 'simple'}
              icon={Type}
              title="간편 등록"
              description="이름과 부모 공간만 기록합니다. 지도 배치는 나중에 할 수 있어요."
              onClick={() => {
                setSpaceMode('simple')
                setMessage(null)
              }}
            />
            <ChoiceCard
              selected={spaceMode === 'map'}
              icon={Ruler}
              title="지도 배치 등록"
              description="이름과 부모 공간에 더해 좌표·크기·형태를 입력합니다."
              onClick={() => {
                setSpaceMode('map')
                setMessage(null)
              }}
            />
          </div>
        </section>
      )}

      {!isSpace && (
        <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
          물건에는 좌표와 크기를 입력하지 않습니다. 보관 공간을 지정하면 해당 공간의 물건 목록에서 확인할 수 있습니다.
        </p>
      )}

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          {isSpace ? '공간 정보' : '물건 정보'}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="이름" name="name" placeholder={isSpace ? '예: 오른쪽 서랍' : '예: AA 건전지'} />
          {isSpace ? (
            <SelectField label="부모 공간" name="parent" options={spaceParents} />
          ) : (
            <SelectField label="보관 공간" name="location" options={itemLocations} />
          )}
          {!isSpace && <Field label="수량" name="quantity" type="number" min="0" defaultValue="1" />}
          {!isSpace && <Field label="단위" name="unit" placeholder="예: 개" required={false} />}
        </div>

        {isMapRegistration && <MapFields />}
      </section>

      {message && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700">
          {message}
        </p>
      )}

      <button className="w-full rounded-2xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
        등록 내용 확인
      </button>
    </form>
  )
}

function MapFields() {
  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <Ruler size={18} />
        </span>
        <div>
          <h3 className="font-bold text-slate-900">지도 배치 정보</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            입력은 cm 기준이며 저장할 때 m로 변환합니다. 저장 시 부모 여백과 다른 공간의 겹침을 검증합니다.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="X 좌표 (cm)" name="x" type="number" min="0" placeholder="예: 20" />
        <Field label="Y 좌표 (cm)" name="y" type="number" min="0" placeholder="예: 0" />
        <Field label="Z 좌표 (cm)" name="z" type="number" min="0" placeholder="예: 30" />
        <Field label="너비 (cm)" name="width" type="number" min="1" placeholder="예: 120" />
        <Field label="높이 (cm)" name="height" type="number" min="1" placeholder="예: 80" />
        <Field label="깊이 (cm)" name="depth" type="number" min="1" placeholder="예: 45" />
      </div>
      <div className="mt-4 max-w-xs">
        <SelectField label="표시 형태" name="displayKind" options={['방', '수납장', '서랍', '상자']} />
      </div>
    </div>
  )
}

type ChoiceCardProps = {
  selected: boolean
  icon: typeof Box
  title: string
  description: string
  onClick: () => void
}

function ChoiceCard({ selected, icon: Icon, title, description, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-violet-500 bg-violet-50 ring-4 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'}`}
    >
      <span className={`grid size-9 place-items-center rounded-xl ${selected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
        <Icon size={18} />
      </span>
      <span className="mt-4 block text-sm font-extrabold text-slate-900">{title}</span>
      <span className="mt-1.5 block text-sm leading-6 text-slate-500">{description}</span>
    </button>
  )
}

type SectionTitleProps = {
  icon: typeof Box
  title: string
  description: string
}

function SectionTitle({ icon: Icon, title, description }: SectionTitleProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
        <Icon size={18} />
      </span>
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

type FieldProps = {
  label: string
  name: string
  placeholder?: string
  type?: 'text' | 'number'
  min?: string
  defaultValue?: string
  required?: boolean
}

function Field({ label, name, placeholder, type = 'text', min, defaultValue, required = true }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <input
        required={required}
        name={name}
        type={type}
        min={min}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  )
}

type SelectFieldProps = {
  label: string
  name: string
  options: string[]
}

function SelectField({ label, name, options }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <select
        name={name}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
