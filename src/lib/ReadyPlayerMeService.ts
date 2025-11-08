export interface RPMAvatar {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  bodyType: 'fullbody' | 'halfbody';
  gender: 'male' | 'female';
}

export const DEMO_AVATARS: RPMAvatar[] = [
  {
    id: 'demo-male-1',
    name: 'Default Male',
    url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934f4.glb?morphTargets=ARKit&textureAtlas=none',
    imageUrl: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934f4.png',
    bodyType: 'fullbody',
    gender: 'male'
  },
  {
    id: 'demo-female-1',
    name: 'Default Female',
    url: 'https://models.readyplayer.me/64c0a0fcbb1e1c6ff46b8a5a.glb?morphTargets=ARKit&textureAtlas=none',
    imageUrl: 'https://models.readyplayer.me/64c0a0fcbb1e1c6ff46b8a5a.png',
    bodyType: 'fullbody',
    gender: 'female'
  },
  {
    id: 'demo-male-2',
    name: 'Casual Male',
    url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934f4.glb?morphTargets=ARKit&textureAtlas=none',
    imageUrl: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934f4.png',
    bodyType: 'fullbody',
    gender: 'male'
  }
];

export class ReadyPlayerMeService {
  private baseUrl = 'https://models.readyplayer.me';

  async loadAvatar(avatarId: string, options?: {
    morphTargets?: string;
    textureAtlas?: string;
    lod?: number;
    pose?: 'A' | 'T';
  }): Promise<string> {
    const params = new URLSearchParams();
    
    if (options?.morphTargets) params.append('morphTargets', options.morphTargets);
    if (options?.textureAtlas) params.append('textureAtlas', options.textureAtlas);
    if (options?.lod !== undefined) params.append('lod', options.lod.toString());
    if (options?.pose) params.append('pose', options.pose);

    const queryString = params.toString();
    return `${this.baseUrl}/${avatarId}.glb${queryString ? '?' + queryString : ''}`;
  }

  extractAvatarId(url: string): string {
    const match = url.match(/([a-f0-9]{24})/i);
    return match ? match[1] : '';
  }
}

export const rpmService = new ReadyPlayerMeService();