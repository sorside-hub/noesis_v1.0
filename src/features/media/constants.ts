import { 
  Mic, 
  Music, 
  Image as ImageIcon, 
  FileText, 
  AlertCircle, 
  Trash2 
} from 'lucide-react';
import { CategoryConfig } from './types';

export const CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    id: 'voice_memo',
    title: 'Voice Memo',
    description: 'Rekaman suara kilat dan memo audio instan',
    icon: Mic,
    iconBg: 'bg-bg-primary',
    iconColor: 'text-accent-primary',
    accentBorder: 'hover:border-accent-primary/40'
  },
  {
    id: 'audio',
    title: 'Audio',
    description: 'Musik, suara latar, dan rekaman audio eksternal',
    icon: Music,
    iconBg: 'bg-bg-primary',
    iconColor: 'text-accent-primary',
    accentBorder: 'hover:border-accent-primary/40'
  },
  {
    id: 'image',
    title: 'Gambar',
    description: 'Diagram, foto lampiran, dan screenshot',
    icon: ImageIcon,
    iconBg: 'bg-bg-primary',
    iconColor: 'text-accent-primary',
    accentBorder: 'hover:border-accent-primary/40'
  },
  {
    id: 'document',
    title: 'Dokumen',
    description: 'File PDF, dokumen teks, dan file pendukung',
    icon: FileText,
    iconBg: 'bg-bg-primary',
    iconColor: 'text-accent-primary',
    accentBorder: 'hover:border-accent-primary/40'
  },
  {
    id: 'unused',
    title: 'Tidak Digunakan',
    description: 'File yang belum disisipkan ke dalam catatan mana pun',
    icon: AlertCircle,
    iconBg: 'bg-bg-primary',
    iconColor: 'text-amber-500',
    accentBorder: 'hover:border-amber-500/40'
  },
  {
    id: 'trash',
    title: 'Sampah',
    description: 'Media yang dihapus sementara',
    icon: Trash2,
    iconBg: 'bg-bg-primary',
    iconColor: 'text-red-500',
    accentBorder: 'hover:border-red-500/40'
  }
];
