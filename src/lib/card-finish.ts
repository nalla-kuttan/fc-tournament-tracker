import type { CardTier, PlayerCardData } from './player-cards';

export interface Finish {
  background: string;
  ink: string;
  muted: string;
  rim: string;
  glow: string;
  label: string;
}

// Each tier has its own finish; the reigning champion gets a holographic one.
export const FINISHES: Record<CardTier | 'champion', Finish> = {
  champion: {
    background: 'linear-gradient(155deg, #FFD27A 0%, #EA6C56 38%, #621122 72%, #334075 100%)',
    ink: '#FFF7F6',
    muted: 'rgba(255, 247, 246, 0.78)',
    rim: 'rgba(255, 214, 140, 0.9)',
    glow: 'rgba(245, 158, 11, 0.45)',
    label: 'Reigning champion',
  },
  elite: {
    background: 'linear-gradient(155deg, #FF8A73 0%, #EA6C56 30%, #852A3D 70%, #3B0B16 100%)',
    ink: '#FFF7F6',
    muted: 'rgba(255, 247, 246, 0.78)',
    rim: 'rgba(255, 138, 115, 0.85)',
    glow: 'rgba(234, 108, 86, 0.45)',
    label: 'Elite',
  },
  gold: {
    background: 'linear-gradient(155deg, #FCE7A8 0%, #F2C150 35%, #C98A1B 75%, #8A5A0B 100%)',
    ink: '#2A1705',
    muted: 'rgba(42, 23, 5, 0.72)',
    rim: 'rgba(255, 236, 170, 0.9)',
    glow: 'rgba(245, 158, 11, 0.3)',
    label: 'Gold',
  },
  silver: {
    background: 'linear-gradient(155deg, #F4EEF0 0%, #D3C8CC 38%, #9C8C93 78%, #6E5F66 100%)',
    ink: '#1E1216',
    muted: 'rgba(30, 18, 22, 0.7)',
    rim: 'rgba(255, 255, 255, 0.85)',
    glow: 'rgba(201, 185, 190, 0.25)',
    label: 'Silver',
  },
  bronze: {
    background: 'linear-gradient(155deg, #E7B48A 0%, #C98552 38%, #8E5430 78%, #5C3219 100%)',
    ink: '#24120A',
    muted: 'rgba(36, 18, 10, 0.72)',
    rim: 'rgba(255, 210, 170, 0.8)',
    glow: 'rgba(183, 121, 74, 0.25)',
    label: 'Bronze',
  },
};

// The FUT-style silhouette: square shoulders with a notched crown and a
// tapered base.
export const CARD_SHAPE = 'polygon(8% 0, 38% 0, 44% 3%, 56% 3%, 62% 0, 92% 0, 100% 6%, 100% 88%, 50% 100%, 0 88%, 0 6%)';

export function cardFinish(card: Pick<PlayerCardData, 'tier' | 'reigningChampion'>) {
  return FINISHES[card.reigningChampion ? 'champion' : card.tier];
}

