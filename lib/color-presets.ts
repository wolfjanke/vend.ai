export type ColorPreset = {
  id:      string
  label:   string
  primary: string
  accent:  string
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'classico', label: 'Clássico', primary: '#1A1A1A', accent: '#C9A054' },
  { id: 'boutique', label: 'Boutique', primary: '#8B6F5E', accent: '#D4AF7A' },
  { id: 'moderno',  label: 'Moderno',  primary: '#7B6EFF', accent: '#00E5A0' },
  { id: 'rose',     label: 'Rosé',     primary: '#C97B8B', accent: '#E8A598' },
  { id: 'street',   label: 'Street',   primary: '#FF2D20', accent: '#F5FF00' },
  { id: 'nature',   label: 'Nature',   primary: '#2A5C45', accent: '#C9A054' },
  { id: 'ocean',    label: 'Ocean',    primary: '#1A4A6B', accent: '#00BFA5' },
  { id: 'nude',     label: 'Nude',     primary: '#8B7355', accent: '#E8D5A3' },
  { id: 'bold',     label: 'Bold',     primary: '#2D2D2D', accent: '#FF6B35' },
  { id: 'luxo',     label: 'Luxo',     primary: '#0C0A08', accent: '#C9A054' },
]
