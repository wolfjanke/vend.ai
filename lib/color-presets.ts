export type ColorPreset = {
  id:      string
  label:   string
  primary: string
  accent:  string
  pageBg:  string
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'classico', label: 'Clássico', primary: '#1A1A1A', accent: '#C9A054', pageBg: '#0F0F0F' },
  { id: 'boutique', label: 'Boutique', primary: '#8B6F5E', accent: '#D4AF7A', pageBg: '#FAF9F7' },
  { id: 'moderno',  label: 'Moderno',  primary: '#7B6EFF', accent: '#00E5A0', pageBg: '#08080F' },
  { id: 'rose',     label: 'Rosé',     primary: '#C97B8B', accent: '#E8A598', pageBg: '#FAF5F6' },
  { id: 'street',   label: 'Street',   primary: '#FF2D20', accent: '#F5FF00', pageBg: '#121212' },
  { id: 'nature',   label: 'Nature',   primary: '#2A5C45', accent: '#C9A054', pageBg: '#F4F7F4' },
  { id: 'ocean',    label: 'Ocean',    primary: '#1A4A6B', accent: '#00BFA5', pageBg: '#F0F6FA' },
  { id: 'nude',     label: 'Nude',     primary: '#8B7355', accent: '#E8D5A3', pageBg: '#FAF8F5' },
  { id: 'bold',     label: 'Bold',     primary: '#2D2D2D', accent: '#FF6B35', pageBg: '#111111' },
  { id: 'luxo',     label: 'Luxo',     primary: '#0C0A08', accent: '#C9A054', pageBg: '#0A0908' },
]
