import { useCallback, useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react'
import {
  ArrowRight,
  Bed,
  Building,
  CheckCircle2,
  Home,
  Keyboard,
  MapPin,
  Shield,
  X,
} from 'lucide-react'
import {
  MriBadge,
  MriButton,
  MriCard,
  MriCardContent,
  MriScrollArea,
  MriSpinner,
} from '@mriqbox/ui-kit'
import { cn } from './lib/utils'

declare function GetParentResourceName(): string

interface SpawnLocation {
  label: string
  coords: { x: number; y: number; z: number; w?: number }
  icon?: string
  description?: string
  propertyId?: string
  first_time?: boolean
}

interface MapIconData {
  index?: number
  x: number
  y: number
  icon: string
  label: string
  iconColor: string
  selected?: boolean
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const iconConfig: Record<
  string,
  {
    icon: IconComponent
    color: string
    iconColor: string
    glowColor: string
    ringColor: string
  }
> = {
  shield: {
    icon: Shield,
    color: 'text-blue-400',
    iconColor: '#60A5FA',
    glowColor: 'rgba(96, 165, 250, 0.35)',
    ringColor: 'rgba(96, 165, 250, 0.28)',
  },
  leaf: {
    icon: Building,
    color: 'text-emerald-400',
    iconColor: '#34D399',
    glowColor: 'rgba(52, 211, 153, 0.35)',
    ringColor: 'rgba(52, 211, 153, 0.28)',
  },
  umbrella: {
    icon: MapPin,
    color: 'text-amber-400',
    iconColor: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.35)',
    ringColor: 'rgba(251, 191, 36, 0.28)',
  },
  bed: {
    icon: Bed,
    color: 'text-violet-400',
    iconColor: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.35)',
    ringColor: 'rgba(167, 139, 250, 0.28)',
  },
  home: {
    icon: Home,
    color: 'text-orange-400',
    iconColor: '#FB923C',
    glowColor: 'rgba(251, 146, 60, 0.35)',
    ringColor: 'rgba(251, 146, 60, 0.28)',
  },
  building: {
    icon: Building,
    color: 'text-cyan-400',
    iconColor: '#22D3EE',
    glowColor: 'rgba(34, 211, 238, 0.35)',
    ringColor: 'rgba(34, 211, 238, 0.28)',
  },
  'map-pin': {
    icon: MapPin,
    color: 'text-rose-400',
    iconColor: '#FB7185',
    glowColor: 'rgba(251, 113, 133, 0.35)',
    ringColor: 'rgba(251, 113, 133, 0.28)',
  },
}

const getMapIconsSignature = (icons: MapIconData[]) => {
  if (!icons.length) return 'empty'

  return icons
    .map((icon, index) =>
      [
        icon.index ?? index,
        icon.icon,
        Math.round((icon.x || 0) * 1000),
        Math.round((icon.y || 0) * 1000),
        icon.label,
        icon.selected ? 1 : 0,
      ].join(':'),
    )
    .join('|')
}

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [spawns, setSpawns] = useState<SpawnLocation[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isReadyToSpawn, setIsReadyToSpawn] = useState(false)
  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  const [mapIcons, setMapIcons] = useState<MapIconData[]>([])
  const [title, setTitle] = useState('SPAWN SELECTOR')
  const lastMapIconsSignatureRef = useRef('empty')

  const getIcon = (iconName?: string, size = 'h-6 w-6', isSelected = false) => {
    const config = iconConfig[iconName || 'map-pin'] || iconConfig['map-pin']
    const Icon = config.icon

    return (
      <Icon
        className={cn(size, config.color, 'shrink-0 transition-transform duration-200', isSelected && 'scale-110')}
        style={{
          color: config.iconColor,
          filter: isSelected ? `drop-shadow(0 0 12px ${config.glowColor})` : 'none',
        }}
      />
    )
  }

  const getIconTone = (iconName?: string) => iconConfig[iconName || 'map-pin'] || iconConfig['map-pin']

  const handleConfirmSpawn = useCallback(async () => {
    if (!isReadyToSpawn) return

    try {
      const response = await fetch(`https://${GetParentResourceName()}/confirmSpawn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      if (data.success) {
        setIsReadyToSpawn(false)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Erro ao confirmar spawn:', error)
    }
  }, [isReadyToSpawn])

  const handleClose = useCallback(async () => {
    try {
      await fetch(`https://${GetParentResourceName()}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnToMultichar: true }),
      })
      setIsOpen(false)
      setIsReadyToSpawn(false)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Erro ao fechar:', error)
    }
  }, [])

  const loadSpawns = useCallback(async () => {
    try {
      const response = await fetch(`https://${GetParentResourceName()}/getSpawns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      console.log('[mri_Qspawn] Resposta do getSpawns:', data)

      if (data.success && data.spawns && Array.isArray(data.spawns) && data.spawns.length > 0) {
        console.log(`[mri_Qspawn] ${data.spawns.length} spawns carregados`)
        setSpawns(data.spawns)
        setSelectedIndex(0)
      } else {
        console.error('[mri_Qspawn] Nenhum spawn encontrado. Resposta:', JSON.stringify(data, null, 2))
        console.error('[mri_Qspawn] success:', data.success, 'spawns:', data.spawns, 'length:', data.spawns?.length)
      }
    } catch (error) {
      console.error('[mri_Qspawn] Erro ao carregar spawns:', error)
    }
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (data?.action !== 'updateMapIcon') {
        console.log('[mri_Qspawn] Mensagem recebida:', data)
      }

      if (data && data.action === 'open') {
        console.log('[mri_Qspawn] Acao: open. Spawns recebidos:', data.spawns)
        setIsOpen(true)
        setHasAutoSelected(false)
        lastMapIconsSignatureRef.current = 'empty'
        setMapIcons([])
        if (data.title) {
          setTitle(data.title)
        }
        if (data.spawns && Array.isArray(data.spawns) && data.spawns.length > 0) {
          console.log(`[mri_Qspawn] ${data.spawns.length} spawns recebidos via mensagem`)
          setSpawns(data.spawns)
          setSelectedIndex(0)
        } else {
          console.log('[mri_Qspawn] Nenhum spawn na mensagem, tentando carregar via callback')
          loadSpawns()
        }
      } else if (data && data.action === 'close') {
        setIsOpen(false)
        setSelectedIndex(0)
        setIsReadyToSpawn(false)
        setHasAutoSelected(false)
        lastMapIconsSignatureRef.current = 'empty'
        setMapIcons([])
      } else if (data && data.action === 'updateMapIcon') {
        const nextIcons = Array.isArray(data.allIcons) ? data.allIcons : []
        const nextSignature = getMapIconsSignature(nextIcons)

        if (nextSignature !== lastMapIconsSignatureRef.current) {
          lastMapIconsSignatureRef.current = nextSignature
          setMapIcons(nextIcons)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [loadSpawns])

  useEffect(() => {
    if (isOpen && spawns.length > 0 && !hasAutoSelected && !isReadyToSpawn) {
      const timer = setTimeout(() => {
        handleSelectSpawn(0)
        setHasAutoSelected(true)
      }, 400)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, spawns.length, hasAutoSelected])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      } else if (event.key === 'Enter' && isReadyToSpawn) {
        event.preventDefault()
        handleConfirmSpawn()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isReadyToSpawn, handleConfirmSpawn, handleClose])

  const handleSelectSpawn = useCallback(
    async (index: number) => {
      if (index < 0 || index >= spawns.length) return

      setSelectedIndex(index)
      try {
        const response = await fetch(`https://${GetParentResourceName()}/selectSpawn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ index: index }),
        })

        const data = await response.json()
        if (data.success) {
          setIsReadyToSpawn(true)
        }
      } catch (error) {
        console.error('Erro ao selecionar spawn:', error)
      }
    },
    [spawns.length],
  )

  if (!isOpen) return null

  const selectedSpawn = spawns[selectedIndex]

  return (
    <div className="fixed inset-0 z-50 pointer-events-none text-foreground">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.28) 0%, rgba(3,7,9,0.16) 38%, rgba(3,7,9,0.9) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-28 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.48), rgba(0,0,0,0))' }}
      />

      <div className="relative h-full w-full pointer-events-auto">
        <MriCard className="nui-solid-panel absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-lg border-primary/20">
          <MriCardContent className="flex items-center gap-3 px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary shadow-[0_0_22px_rgba(0,227,150,0.16)]">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase text-foreground">{title}</p>
              {selectedSpawn && <p className="truncate text-xs text-muted-foreground">{selectedSpawn.label}</p>}
            </div>
          </MriCardContent>
        </MriCard>

        {mapIcons.map(
          (mapIcon, index) =>
            mapIcon && (
              <div
                key={mapIcon.index ?? `${mapIcon.label}-${index}`}
                className="fixed pointer-events-none z-50 flex flex-col items-center justify-center gap-2 transition-transform duration-75"
                style={{
                  left: `${mapIcon.x * 100}%`,
                  top: `${mapIcon.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  className={cn(
                    'nui-map-marker grid h-12 w-12 place-items-center rounded-full border',
                    mapIcon.selected && 'border-primary/70',
                  )}
                  style={{
                    borderColor: mapIcon.selected ? 'rgba(0, 227, 150, 0.72)' : `rgba(${mapIcon.iconColor}, 0.38)`,
                    boxShadow: mapIcon.selected
                      ? '0 0 28px rgba(0,227,150,0.38), 0 14px 36px rgba(0,0,0,0.45)'
                      : `0 0 22px rgba(${mapIcon.iconColor}, 0.32), 0 14px 36px rgba(0,0,0,0.45)`,
                  }}
                >
                  {getIcon(mapIcon.icon, 'h-7 w-7', true)}
                </div>
                <MriBadge
                  variant="outline"
                  className="nui-marker-label rounded-md border-white/15 px-2 py-1 text-[11px] font-semibold text-white"
                >
                  {mapIcon.label}
                </MriBadge>
              </div>
            ),
        )}

        <MriCard className="nui-solid-panel absolute right-4 top-1/2 z-10 w-[calc(100vw-2rem)] max-w-[440px] -translate-y-1/2 rounded-lg border-white/10 sm:right-8">
          <MriCardContent className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-primary">Locais disponiveis</p>
                <h2 className="truncate text-xl font-semibold text-foreground">Destinos</h2>
              </div>
              <MriBadge variant="secondary" className="nui-chip shrink-0 rounded-md border border-white/10 text-secondary-foreground">
                {spawns.length}
              </MriBadge>
            </div>

            <MriScrollArea className="h-[68vh] min-h-[320px] max-h-[620px] pr-3">
              <div className="space-y-2">
                {spawns.length > 0 ? (
                  spawns.map((spawn, index) => {
                    const isSelected = selectedIndex === index
                    const tone = getIconTone(spawn.icon)
                    const displayLabel = spawn.label

                    return (
                      <MriButton
                        key={index}
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          handleSelectSpawn(index)
                        }}
                        onMouseEnter={() => {
                          if (!isSelected) {
                            setSelectedIndex(index)
                          }
                        }}
                        aria-pressed={isSelected}
                        className={cn(
                          'spawn-item h-auto min-h-[78px] w-full whitespace-normal rounded-lg border px-3 py-3 text-left shadow-none transition-colors duration-200 [&_svg]:size-5',
                          'nui-spawn-option justify-start text-foreground hover:text-foreground',
                          isSelected
                            ? 'nui-spawn-option-selected border-primary/60'
                            : 'border-white/10',
                        )}
                      >
                        <div className="flex w-full items-center gap-3">
                          <div
                            className={cn(
                              'grid h-11 w-11 shrink-0 place-items-center rounded-lg border bg-background/80 transition-transform duration-200',
                              'nui-icon-box',
                              isSelected && 'scale-105',
                            )}
                            style={{ borderColor: isSelected ? tone.ringColor : 'rgba(255,255,255,0.10)' }}
                          >
                            {getIcon(spawn.icon, 'h-5 w-5', isSelected)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-base font-semibold leading-tight text-foreground">
                                  {displayLabel}
                                </p>
                                <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                                  {spawn.description || `Iniciar em ${displayLabel.toLowerCase()}`}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                              )}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <MriBadge
                                variant={isSelected ? 'default' : 'outline'}
                                className={cn(
                                  'rounded-md px-2 py-0.5 text-[10px] uppercase',
                                  isSelected
                                    ? 'border-primary/30 bg-primary text-primary-foreground'
                                    : 'nui-chip border-white/10 text-muted-foreground',
                                )}
                              >
                                #{String(index + 1).padStart(2, '0')}
                              </MriBadge>
                              {spawn.propertyId && (
                                <MriBadge
                                  variant="outline"
                                  className="rounded-md border-cyan-500/25 bg-cyan-500/20 px-2 py-0.5 text-[10px] uppercase text-cyan-200"
                                >
                                  Propriedade
                                </MriBadge>
                              )}
                              {spawn.first_time && (
                                <MriBadge
                                  variant="outline"
                                  className="rounded-md border-emerald-500/25 bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase text-emerald-200"
                                >
                                  Inicial
                                </MriBadge>
                              )}
                            </div>
                          </div>
                        </div>
                      </MriButton>
                    )
                  })
                ) : (
                  <div className="nui-empty-state flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-white/10 text-muted-foreground">
                    <MriSpinner size="md" />
                    <p className="mt-4 text-sm font-medium">Carregando locais...</p>
                  </div>
                )}
              </div>
            </MriScrollArea>
          </MriCardContent>
        </MriCard>

        <MriCard className="nui-solid-panel absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-lg border-white/10">
          <MriCardContent className="flex items-center gap-2 p-2">
            {isReadyToSpawn ? (
              <MriButton
                type="button"
                onClick={handleConfirmSpawn}
                className="h-10 rounded-lg bg-primary px-4 text-primary-foreground shadow-[0_0_28px_rgba(0,227,150,0.20)] hover:bg-primary/90"
              >
                <ArrowRight className="h-4 w-4" />
                <span className="font-semibold">ENTER</span>
                <span className="text-xs font-medium opacity-80">Spawnar</span>
              </MriButton>
            ) : (
              <div className="nui-key-hint flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-muted-foreground">
                <Keyboard className="h-4 w-4 text-primary" />
                <MriBadge variant="outline" className="nui-key-badge rounded-md border-white/10 px-2 py-0.5 text-foreground">
                  E
                </MriBadge>
                <span>Selecionar</span>
              </div>
            )}

            <div className="nui-key-hint flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-muted-foreground">
              <X className="h-4 w-4 text-rose-300" />
              <MriBadge variant="outline" className="nui-key-badge rounded-md border-white/10 px-2 py-0.5 text-foreground">
                ESC
              </MriBadge>
              <span>Voltar</span>
            </div>

          </MriCardContent>
        </MriCard>
      </div>
    </div>
  )
}

export default App
