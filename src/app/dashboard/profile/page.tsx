
// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { Loader2, UserCircle, Save, UploadCloud, Music, KeyRound, Palette, Edit, ShieldQuestion, SaveIcon, CalendarClock, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { changePassword } from '@/app/auth/actions'; 

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg"];

// Expanded sample avatars - 100 options
const sampleAvatars = [
  // DiceBear - Adventurer
  { id: 'db_adv_01', name: 'Adventurer Uno', url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Uno&size=150', dataAiHint: 'adventurer male' },
  { id: 'db_adv_02', name: 'Adventurer Duo', url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Duo&size=150&flip=true', dataAiHint: 'adventurer female' },
  { id: 'db_adv_03', name: 'Adventurer Tres', url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Tres&size=150&skinColor=variant02', dataAiHint: 'adventurer dark' },
  { id: 'db_adv_04', name: 'Adventurer Quat', url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Quat&size=150&hair=long01', dataAiHint: 'adventurer longHair' },
  { id: 'db_adv_05', name: 'Adventurer Cinq', url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Cinq&size=150&mouth=variant05', dataAiHint: 'adventurer smile' },
  // DiceBear - Pixel Art
  { id: 'db_pix_01', name: 'Pixel Pal', url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=PixelPal&size=150', dataAiHint: 'pixel human' },
  { id: 'db_pix_02', name: 'Pixel Gem', url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=PixelGem&size=150&hair=short02', dataAiHint: 'pixel shortHair' },
  { id: 'db_pix_03', name: 'Pixel Bit', url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=PixelBit&size=150&glasses=variant01', dataAiHint: 'pixel glasses' },
  { id: 'db_pix_04', name: 'Pixel Byte', url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=PixelByte&size=150&skinColor=variant03', dataAiHint: 'pixel character' },
  { id: 'db_pix_05', name: 'Pixel Chip', url: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=PixelChip&size=150&mouth=variant03', dataAiHint: 'pixel happy' },
  // DiceBear - Bottts
  { id: 'db_bot_01', name: 'Bot Alpha', url: 'https://api.dicebear.com/8.x/bottts/svg?seed=AlphaBot&size=150', dataAiHint: 'robot head' },
  { id: 'db_bot_02', name: 'Bot Beta', url: 'https://api.dicebear.com/8.x/bottts/svg?seed=BetaBot&size=150&colors=blue', dataAiHint: 'blue robot' },
  { id: 'db_bot_03', name: 'Bot Gamma', url: 'https://api.dicebear.com/8.x/bottts/svg?seed=GammaBot&size=150&colorful=true', dataAiHint: 'colorful robot' },
  { id: 'db_bot_04', name: 'Bot Delta', url: 'https://api.dicebear.com/8.x/bottts/svg?seed=DeltaBot&size=150&mouthChance=100', dataAiHint: 'robot mouth' },
  { id: 'db_bot_05', name: 'Bot Epsilon', url: 'https://api.dicebear.com/8.x/bottts/svg?seed=EpsilonBot&size=150&textureChance=100', dataAiHint: 'robot texture' },
  // DiceBear - Lorelei
  { id: 'db_lor_01', name: 'Lorelei Hue', url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=LoreHue&size=150', dataAiHint: 'cartoon face' },
  { id: 'db_lor_02', name: 'Lorelei Shade', url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=LoreShade&size=150&flip=true', dataAiHint: 'cartoon girl' },
  { id: 'db_lor_03', name: 'Lorelei Tint', url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=LoreTint&size=150&hair=variant10', dataAiHint: 'cartoon boy' },
  { id: 'db_lor_04', name: 'Lorelei Tone', url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=LoreTone&size=150&mouth=variant02', dataAiHint: 'cartoon smile' },
  { id: 'db_lor_05', name: 'Lorelei Value', url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=LoreValue&size=150&eyes=variant03', dataAiHint: 'cartoon eyes' },
  // RoboHash - Set 1 (Robots)
  { id: 'rh_s1_01', name: 'Robo One', url: 'https://robohash.org/roboone?set=set1&size=150x150', dataAiHint: 'robot design' },
  { id: 'rh_s1_02', name: 'Robo Two', url: 'https://robohash.org/robotwo?set=set1&size=150x150', dataAiHint: 'robot metallic' },
  { id: 'rh_s1_03', name: 'Robo Three', url: 'https://robohash.org/robothree?set=set1&size=150x150', dataAiHint: 'robot futuristic' },
  { id: 'rh_s1_04', name: 'Robo Four', url: 'https://robohash.org/robofour?set=set1&size=150x150', dataAiHint: 'robot headshot' },
  { id: 'rh_s1_05', name: 'Robo Five', url: 'https://robohash.org/robofive?set=set1&size=150x150', dataAiHint: 'robot face' },
  // RoboHash - Set 2 (Monsters)
  { id: 'rh_s2_01', name: 'Monster Uno', url: 'https://robohash.org/monsteruno?set=set2&size=150x150', dataAiHint: 'monster cute' },
  { id: 'rh_s2_02', name: 'Monster Duo', url: 'https://robohash.org/monsterduo?set=set2&size=150x150', dataAiHint: 'monster friendly' },
  { id: 'rh_s2_03', name: 'Monster Tres', url: 'https://robohash.org/monstertres?set=set2&size=150x150', dataAiHint: 'monster illustration' },
  { id: 'rh_s2_04', name: 'Monster Quat', url: 'https://robohash.org/monsterquat?set=set2&size=150x150', dataAiHint: 'monster character' },
  { id: 'rh_s2_05', name: 'Monster Cinq', url: 'https://robohash.org/monstercinq?set=set2&size=150x150', dataAiHint: 'monster art' },
  // RoboHash - Set 3 (Robot Heads)
  { id: 'rh_s3_01', name: 'Head Bot A', url: 'https://robohash.org/headbota?set=set3&size=150x150', dataAiHint: 'robot head' },
  { id: 'rh_s3_02', name: 'Head Bot B', url: 'https://robohash.org/headbotb?set=set3&size=150x150', dataAiHint: 'robot profile' },
  { id: 'rh_s3_03', name: 'Head Bot C', url: 'https://robohash.org/headbotc?set=set3&size=150x150', dataAiHint: 'robot illustration' },
  { id: 'rh_s3_04', name: 'Head Bot D', url: 'https://robohash.org/headbotd?set=set3&size=150x150', dataAiHint: 'robot schematic' },
  { id: 'rh_s3_05', name: 'Head Bot E', url: 'https://robohash.org/headbote?set=set3&size=150x150', dataAiHint: 'robot simple' },
  // RoboHash - Set 4 (Kittens)
  { id: 'rh_s4_01', name: 'Kitten Alpha', url: 'https://robohash.org/kittenalpha?set=set4&size=150x150', dataAiHint: 'kitten cute' },
  { id: 'rh_s4_02', name: 'Kitten Beta', url: 'https://robohash.org/kittenbeta?set=set4&size=150x150', dataAiHint: 'kitten small' },
  { id: 'rh_s4_03', name: 'Kitten Gamma', url: 'https://robohash.org/kittengamma?set=set4&size=150x150', dataAiHint: 'kitten playful' },
  { id: 'rh_s4_04', name: 'Kitten Delta', url: 'https://robohash.org/kittendelta?set=set4&size=150x150', dataAiHint: 'kitten avatar' },
  { id: 'rh_s4_05', name: 'Kitten Epsilon', url: 'https://robohash.org/kittenepsilon?set=set4&size=150x150', dataAiHint: 'kitten illustration' },
  // DiceBear - Initials
  { id: 'db_ini_01', name: 'Initials AP', url: 'https://api.dicebear.com/8.x/initials/svg?seed=AP&size=150', dataAiHint: 'initials logo' },
  { id: 'db_ini_02', name: 'Initials ZY', url: 'https://api.dicebear.com/8.x/initials/svg?seed=ZY&size=150&backgroundColor=blue', dataAiHint: 'initials colorful' },
  { id: 'db_ini_03', name: 'Initials TS', url: 'https://api.dicebear.com/8.x/initials/svg?seed=TS&size=150&fontWeight=700', dataAiHint: 'initials bold' },
  { id: 'db_ini_04', name: 'Initials JK', url: 'https://api.dicebear.com/8.x/initials/svg?seed=JK&size=150&radius=50', dataAiHint: 'initials circle' },
  { id: 'db_ini_05', name: 'Initials NP', url: 'https://api.dicebear.com/8.x/initials/svg?seed=NP&size=150&chars=1', dataAiHint: 'initials single' },
  // DiceBear - FunEmoji
  { id: 'db_fun_01', name: 'Emoji Smile', url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Smile&size=150', dataAiHint: 'emoji happy' },
  { id: 'db_fun_02', name: 'Emoji Cool', url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Cool&size=150&mouth=variant12', dataAiHint: 'emoji cool' },
  { id: 'db_fun_03', name: 'Emoji Love', url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Love&size=150&eyes=variant02', dataAiHint: 'emoji love' },
  { id: 'db_fun_04', name: 'Emoji Wink', url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Wink&size=150&mouth=variant22', dataAiHint: 'emoji wink' },
  { id: 'db_fun_05', name: 'Emoji Sad', url: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Sad&size=150&eyes=variant07', dataAiHint: 'emoji sad' },
  // Placehold.co - Text based
  { id: 'ph_cat', name: 'Placeholder Cat', url: 'https://placehold.co/150x150/7B59E0/FFFFFF.png?text=CAT', dataAiHint: 'cat illustration' },
  { id: 'ph_dog', name: 'Placeholder Dog', url: 'https://placehold.co/150x150/FFA726/FFFFFF.png?text=DOG', dataAiHint: 'dog illustration' },
  { id: 'ph_owl', name: 'Placeholder Owl', url: 'https://placehold.co/150x150/4CAF50/FFFFFF.png?text=OWL', dataAiHint: 'owl illustration' },
  { id: 'ph_fox', name: 'Placeholder Fox', url: 'https://placehold.co/150x150/FF7043/FFFFFF.png?text=FOX', dataAiHint: 'fox illustration' },
  { id: 'ph_bot', name: 'Placeholder Bot', url: 'https://placehold.co/150x150/26A69A/FFFFFF.png?text=BOT', dataAiHint: 'robot simple' },

  // Adding more DiceBear variations to reach 100
  // Adventurer Neutral
  { id: 'db_advn_01', name: 'Neutral Explorer', url: 'https://api.dicebear.com/8.x/adventurer-neutral/svg?seed=ExplorerN&size=150', dataAiHint: 'explorer neutral' },
  { id: 'db_advn_02', name: 'Neutral Pathfinder', url: 'https://api.dicebear.com/8.x/adventurer-neutral/svg?seed=PathfinderN&size=150&glasses=variant01', dataAiHint: 'explorer glasses' },
  { id: 'db_advn_03', name: 'Neutral Voyager', url: 'https://api.dicebear.com/8.x/adventurer-neutral/svg?seed=VoyagerN&size=150&skinColor=variant01', dataAiHint: 'explorer skin' },
  { id: 'db_advn_04', name: 'Neutral Scout', url: 'https://api.dicebear.com/8.x/adventurer-neutral/svg?seed=ScoutN&size=150&earrings=variant01', dataAiHint: 'explorer earrings' },
  { id: 'db_advn_05', name: 'Neutral Ranger', url: 'https://api.dicebear.com/8.x/adventurer-neutral/svg?seed=RangerN&size=150&features=variant01', dataAiHint: 'explorer features' },

  // Big Ears
  { id: 'db_bear_01', name: 'Big Ears 1', url: 'https://api.dicebear.com/8.x/big-ears/svg?seed=BigEars1&size=150', dataAiHint: 'ears character' },
  { id: 'db_bear_02', name: 'Big Ears 2', url: 'https://api.dicebear.com/8.x/big-ears/svg?seed=BigEars2&size=150&earringsProbability=100', dataAiHint: 'ears earrings' },
  { id: 'db_bear_03', name: 'Big Ears 3', url: 'https://api.dicebear.com/8.x/big-ears/svg?seed=BigEars3&size=150&eyes=variant02', dataAiHint: 'ears eyes' },
  { id: 'db_bear_04', name: 'Big Ears 4', url: 'https://api.dicebear.com/8.x/big-ears/svg?seed=BigEars4&size=150&mouth=variant03', dataAiHint: 'ears mouth' },
  { id: 'db_bear_05', name: 'Big Ears 5', url: 'https://api.dicebear.com/8.x/big-ears/svg?seed=BigEars5&size=150&hair=variant05', dataAiHint: 'ears hair' },

  // Big Smile
  { id: 'db_bsml_01', name: 'Big Smile 1', url: 'https://api.dicebear.com/8.x/big-smile/svg?seed=BigSmile1&size=150', dataAiHint: 'smile cartoon' },
  { id: 'db_bsml_02', name: 'Big Smile 2', url: 'https://api.dicebear.com/8.x/big-smile/svg?seed=BigSmile2&size=150&eyes=variant04', dataAiHint: 'smile eyes' },
  { id: 'db_bsml_03', name: 'Big Smile 3', url: 'https://api.dicebear.com/8.x/big-smile/svg?seed=BigSmile3&size=150&hair=variant01', dataAiHint: 'smile hair' },
  { id: 'db_bsml_04', name: 'Big Smile 4', url: 'https://api.dicebear.com/8.x/big-smile/svg?seed=BigSmile4&size=150&skinColor=variant03', dataAiHint: 'smile skin' },
  { id: 'db_bsml_05', name: 'Big Smile 5', url: 'https://api.dicebear.com/8.x/big-smile/svg?seed=BigSmile5&size=150&accessories=variant01', dataAiHint: 'smile accessory' },

  // Croodles
  { id: 'db_croo_01', name: 'Croodle Doodle', url: 'https://api.dicebear.com/8.x/croodles/svg?seed=Doodle&size=150', dataAiHint: 'doodle monster' },
  { id: 'db_croo_02', name: 'Croodle Scribble', url: 'https://api.dicebear.com/8.x/croodles/svg?seed=Scribble&size=150&components=1', dataAiHint: 'doodle simple' },
  { id: 'db_croo_03', name: 'Croodle Sketch', url: 'https://api.dicebear.com/8.x/croodles/svg?seed=Sketch&size=150&colorful=true', dataAiHint: 'doodle colorful' },
  { id: 'db_croo_04', name: 'Croodle Blot', url: 'https://api.dicebear.com/8.x/croodles/svg?seed=Blot&size=150&backgroundColor=transparent', dataAiHint: 'doodle transparent' },
  { id: 'db_croo_05', name: 'Croodle Wisp', url: 'https://api.dicebear.com/8.x/croodles/svg?seed=Wisp&size=150&strokeWidth=3', dataAiHint: 'doodle thick' },

  // Miniavs
  { id: 'db_mini_01', name: 'Miniav Atom', url: 'https://api.dicebear.com/8.x/miniavs/svg?seed=Atom&size=150', dataAiHint: 'mini avatar' },
  { id: 'db_mini_02', name: 'Miniav Blob', url: 'https://api.dicebear.com/8.x/miniavs/svg?seed=Blob&size=150&backgroundColor=accent', dataAiHint: 'mini simple' },
  { id: 'db_mini_03', name: 'Miniav Cub', url: 'https://api.dicebear.com/8.x/miniavs/svg?seed=Cub&size=150&hair=true', dataAiHint: 'mini hair' },
  { id: 'db_mini_04', name: 'Miniav Dot', url: 'https://api.dicebear.com/8.x/miniavs/svg?seed=Dot&size=150&mouth=true', dataAiHint: 'mini mouth' },
  { id: 'db_mini_05', name: 'Miniav Elf', url: 'https://api.dicebear.com/8.x/miniavs/svg?seed=Elf&size=150&eyes=true', dataAiHint: 'mini eyes' },

  // Open Peeps
  { id: 'db_opep_01', name: 'Peep One', url: 'https://api.dicebear.com/8.x/open-peeps/svg?seed=PeepOne&size=150', dataAiHint: 'peep character' },
  { id: 'db_opep_02', name: 'Peep Two', url: 'https://api.dicebear.com/8.x/open-peeps/svg?seed=PeepTwo&size=150&face=variant02', dataAiHint: 'peep face' },
  { id: 'db_opep_03', name: 'Peep Three', url: 'https://api.dicebear.com/8.x/open-peeps/svg?seed=PeepThree&size=150&hair=variant03', dataAiHint: 'peep hair' },
  { id: 'db_opep_04', name: 'Peep Four', url: 'https://api.dicebear.com/8.x/open-peeps/svg?seed=PeepFour&size=150&facialHair=variant01', dataAiHint: 'peep beard' },
  { id: 'db_opep_05', name: 'Peep Five', url: 'https://api.dicebear.com/8.x/open-peeps/svg?seed=PeepFive&size=150&accessories=variant01', dataAiHint: 'peep accessory' },

  // Personas
  { id: 'db_pers_01', name: 'Persona A', url: 'https://api.dicebear.com/8.x/personas/svg?seed=PersonaA&size=150', dataAiHint: 'persona male' },
  { id: 'db_pers_02', name: 'Persona B', url: 'https://api.dicebear.com/8.x/personas/svg?seed=PersonaB&size=150&hair=long', dataAiHint: 'persona female' },
  { id: 'db_pers_03', name: 'Persona C', url: 'https://api.dicebear.com/8.x/personas/svg?seed=PersonaC&size=150&skinColor=variant02', dataAiHint: 'persona skin' },
  { id: 'db_pers_04', name: 'Persona D', url: 'https://api.dicebear.com/8.x/personas/svg?seed=PersonaD&size=150&glasses=variant01', dataAiHint: 'persona glasses' },
  { id: 'db_pers_05', name: 'Persona E', url: 'https://api.dicebear.com/8.x/personas/svg?seed=PersonaE&size=150&facialHair=variant02', dataAiHint: 'persona facialHair' },

  // Pixel Art Neutral
  { id: 'db_pixn_01', name: 'Pixel Hero', url: 'https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=HeroPixN&size=150', dataAiHint: 'pixel hero' },
  { id: 'db_pixn_02', name: 'Pixel Mage', url: 'https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=MagePixN&size=150&hair=variant03', dataAiHint: 'pixel mage' },
  { id: 'db_pixn_03', name: 'Pixel Rogue', url: 'https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=RoguePixN&size=150&accessories=variant01', dataAiHint: 'pixel rogue' },
  { id: 'db_pixn_04', name: 'Pixel King', url: 'https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=KingPixN&size=150&hat=variant01', dataAiHint: 'pixel king' },
  { id: 'db_pixn_05', name: 'Pixel Queen', url: 'https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=QueenPixN&size=150&hat=variant02', dataAiHint: 'pixel queen' },

  // Rings
  { id: 'db_ring_01', name: 'Ringed Being', url: 'https://api.dicebear.com/8.x/rings/svg?seed=RingBeing&size=150', dataAiHint: 'rings abstract' },
  { id: 'db_ring_02', name: 'Circle Form', url: 'https://api.dicebear.com/8.x/rings/svg?seed=CircleForm&size=150&mouth=variant02', dataAiHint: 'rings face' },
  { id: 'db_ring_03', name: 'Orbital Spirit', url: 'https://api.dicebear.com/8.x/rings/svg?seed=OrbitalSpirit&size=150&eyes=variant03', dataAiHint: 'rings eyes' },
  { id: 'db_ring_04', name: 'Sphere Soul', url: 'https://api.dicebear.com/8.x/rings/svg?seed=SphereSoul&size=150&hair=variant01', dataAiHint: 'rings hair' },
  { id: 'db_ring_05', name: 'Round Entity', url: 'https://api.dicebear.com/8.x/rings/svg?seed=RoundEntity&size=150&backgroundColor=primary', dataAiHint: 'rings colorful' },
];


const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(50).optional().or(z.literal('')),
  full_name: z.string().min(3, 'Full name must be at least 3 characters.').max(100).optional().or(z.literal('')),
  class_level: z.enum(['11', '12']).optional(),
  target_year: z.coerce.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 10).optional(),
  theme: z.enum(['light', 'dark']).default('dark'),
  alarm_tone_upload: z
    .custom<FileList>()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE_BYTES, `Max audio file size is ${MAX_FILE_SIZE_MB}MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_AUDIO_TYPES.includes(files?.[0]?.type),
      "Only MP3, WAV, OGG formats are supported."
    ),
  custom_countdown_event_name: z.string().max(50).optional().or(z.literal('')),
  custom_countdown_target_date: z.string().optional().or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
  selectedAvatarUrl: z.string().url().optional().or(z.literal('')), // For selected avatar
}).refine(data => {
    if (data.custom_countdown_target_date && !data.custom_countdown_event_name) {
        return false;
    }
    if (data.custom_countdown_event_name && !data.custom_countdown_target_date) {
        return false;
    }
    return true;
}, {
    message: "Both event name and target date are required for custom countdown, or neither.",
    path: ["custom_countdown_event_name"],
}).refine(data => {
    if (data.newPassword && (!data.currentPassword || !data.confirmNewPassword)) {
        return false; // If new password is set, old and confirm must be set
    }
    if (data.newPassword && data.newPassword.length < 6) {
        return false; // New password min length
    }
    if (data.newPassword !== data.confirmNewPassword) {
        return false; // New passwords must match
    }
    return true;
}, {
    message: "To change password, all password fields are required. New password must be at least 6 characters and match confirmation.",
    path: ["confirmNewPassword"],
});


type ProfileFormData = z.infer<typeof profileSchema>;
type ProfileData = Tables<'profiles'>;

export default function ProfileSettingsPage() {
  const [isGeneralSaving, startGeneralSavingTransition] = useTransition();
  const [isAlarmSaving, startAlarmSavingTransition] = useTransition();
  const [isCountdownSaving, startCountdownSavingTransition] = useTransition();
  const [isPasswordChanging, startPasswordChangingTransition] = useTransition();
  const [isAvatarSaving, startAvatarSavingTransition] = useTransition();


  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [currentAlarmToneUrl, setCurrentAlarmToneUrl] = useState<string | null>(null);
  const [selectedAlarmFile, setSelectedAlarmFile] = useState<File | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const alarmFileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      full_name: '',
      theme: 'dark',
      custom_countdown_event_name: '',
      custom_countdown_target_date: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      selectedAvatarUrl: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        startGeneralSavingTransition(async () => { 
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            toast({ variant: 'destructive', title: 'Error fetching profile', description: error.message });
          } else if (data) {
            setProfileData(data);
            form.reset({
              username: data.username || '',
              full_name: data.full_name || '',
              class_level: data.class_level as '11' | '12' || undefined,
              target_year: data.target_year || undefined,
              theme: (data.theme as 'light' | 'dark') || 'dark',
              custom_countdown_event_name: data.custom_countdown_event_name || '',
              custom_countdown_target_date: data.custom_countdown_target_date ? new Date(data.custom_countdown_target_date).toISOString().split('T')[0] : '',
              selectedAvatarUrl: data.avatar_url || '',
            });
            setCurrentAlarmToneUrl(data.alarm_tone_url);
            if (data.theme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
            }
          }
        });
      } else {
        toast({ variant: 'destructive', title: 'Not authenticated' });
      }
    };
    fetchProfile();
  }, [supabase, toast, form]);

  const handleAlarmFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast({ variant: "destructive", title: "Audio file too large", description: `Max ${MAX_FILE_SIZE_MB}MB.` });
            setSelectedAlarmFile(null);
            if(alarmFileInputRef.current) alarmFileInputRef.current.value = "";
            return;
        }
        if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
            toast({ variant: "destructive", title: "Invalid audio file type", description: "Use MP3, WAV, OGG." });
            setSelectedAlarmFile(null);
            if(alarmFileInputRef.current) alarmFileInputRef.current.value = "";
            return;
        }
        setSelectedAlarmFile(file);
    } else {
        setSelectedAlarmFile(null);
    }
  };

  const handleSaveAlarmTone = async () => {
    if (!userId || !selectedAlarmFile) {
      toast({ variant: 'destructive', title: 'No alarm file selected or not authenticated.' });
      return;
    }
    startAlarmSavingTransition(async () => {
      try {
        const file = selectedAlarmFile;
        const filePath = `${userId}/alarm_tones/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('user-uploads').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ alarm_tone_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', userId);
        
        if (profileUpdateError) throw profileUpdateError;

        setCurrentAlarmToneUrl(publicUrl);
        setSelectedAlarmFile(null);
        if(alarmFileInputRef.current) alarmFileInputRef.current.value = "";
        toast({ title: 'Alarm Tone Updated!', description: 'Your new alarm tone has been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving alarm tone', description: error.message });
      }
    });
  };

  const handleSaveGeneralSettings = async () => {
    if (!userId) return;
    const values = form.getValues();
    startGeneralSavingTransition(async () => {
        try {
            const updateData: Partial<TablesUpdate<'profiles'>> = {
                username: values.username,
                full_name: values.full_name,
                class_level: values.class_level,
                target_year: values.target_year,
                theme: values.theme,
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
            if (error) throw error;
            toast({ title: 'General Settings Updated!', description: 'Your profile details and theme have been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
            if (values.theme === 'light') document.documentElement.classList.remove('dark');
            else document.documentElement.classList.add('dark');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error updating general settings', description: error.message });
        }
    });
  };
  
  const handleSaveCustomCountdown = async () => {
    if (!userId) return;
    const values = form.getValues();
    const countdownValidation = profileSchema.safeParse(values); 
    if (!countdownValidation.success && (countdownValidation.error.flatten().fieldErrors.custom_countdown_event_name || countdownValidation.error.flatten().fieldErrors.custom_countdown_target_date)) {
        toast({variant: "destructive", title: "Countdown Error", description: "Both event name and date are required for custom countdown, or leave both empty."});
        return;
    }

    startCountdownSavingTransition(async () => {
        try {
            const updateData: Partial<TablesUpdate<'profiles'>> = {
                custom_countdown_event_name: values.custom_countdown_event_name || null,
                custom_countdown_target_date: values.custom_countdown_target_date ? new Date(values.custom_countdown_target_date).toISOString() : null,
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
            if (error) throw error;
            toast({ title: 'Custom Countdown Updated!', description: 'Your countdown settings have been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error updating countdown', description: error.message });
        }
    });
  };

  const handlePasswordChange = async () => {
    if (!userId) return;
    const values = form.getValues();
    
    if (!values.currentPassword || !values.newPassword || !values.confirmNewPassword) {
        form.setError("currentPassword", { type: "manual", message: "All password fields are required to change password." });
        form.setError("newPassword", { type: "manual", message: "" });
        form.setError("confirmNewPassword", { type: "manual", message: "" });
        return;
    }
    if (values.newPassword.length < 6) {
        form.setError("newPassword", { type: "manual", message: "New password must be at least 6 characters."});
        return;
    }
    if (values.newPassword !== values.confirmNewPassword) {
        form.setError("confirmNewPassword", { type: "manual", message: "New passwords do not match." });
        return;
    }

    startPasswordChangingTransition(async () => {
      const result = await changePassword({
        currentPassword: values.currentPassword!,
        newPassword: values.newPassword!,
      });

      if (result.error) {
        toast({ variant: 'destructive', title: 'Password Change Failed', description: result.error });
        form.setError("currentPassword", { type: "manual", message: result.error });
      } else {
        toast({ title: 'Password Changed Successfully!', description: 'Your password has been updated.', className: 'bg-green-500/20 text-green-300 border-green-400/50'});
        form.resetField("currentPassword");
        form.resetField("newPassword");
        form.resetField("confirmNewPassword");
      }
    });
  };
  
  const handleAvatarSelect = (avatarUrl: string) => {
    form.setValue('selectedAvatarUrl', avatarUrl); 
  };

  const handleSaveAvatar = async () => {
    if (!userId) return;
    const selectedAvatarUrl = form.getValues('selectedAvatarUrl');
    if (!selectedAvatarUrl) {
        toast({variant: 'destructive', title: "No Avatar Selected", description: "Please select an avatar first."});
        return;
    }
    startAvatarSavingTransition(async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: selectedAvatarUrl, updated_at: new Date().toISOString() })
                .eq('id', userId);
            if (error) throw error;
            setProfileData(prev => prev ? {...prev, avatar_url: selectedAvatarUrl} : null); 
            toast({ title: 'Avatar Updated!', description: 'Your new avatar has been saved.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error saving avatar', description: error.message });
        }
    });
  };


  if (isGeneralSaving && !profileData) { 
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <UserCircle className="mr-4 h-10 w-10" /> Profile & Settings
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Personalize your experience and manage your account details.
        </p>
      </header>

      <Form {...form}>
        {/* General Info & Avatar Display Card */}
        <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
                        <AvatarImage src={form.watch('selectedAvatarUrl') || profileData?.avatar_url || undefined} alt={profileData?.full_name || 'User'} data-ai-hint="user profile large"/>
                        <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                            {profileData?.full_name ? profileData.full_name.charAt(0).toUpperCase() : profileData?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left">
                        <CardTitle className="text-3xl font-headline glow-text-primary">{profileData?.full_name || profileData?.username || 'Your Profile'}</CardTitle>
                        <CardDescription className="text-base">{profileData?.email || 'Edit your personal information and app preferences below.'}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="username" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">Username</FormLabel>
                            <FormControl><Input placeholder="Your unique username" {...field} className="h-11 input-glow" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="full_name" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">Full Name</FormLabel>
                            <FormControl><Input placeholder="Your full name" {...field} className="h-11 input-glow" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="class_level" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">Class</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger className="h-11 input-glow"><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="11">Class 11</SelectItem><SelectItem value="12">Class 12</SelectItem></SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="target_year" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">Target NEET Year</FormLabel>
                            <FormControl><Input type="number" placeholder="E.g., 2026" {...field} onChange={event => field.onChange(+event.target.value)} className="h-11 input-glow" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                  </div>
                  <Card className="bg-card/50 border-border/50 shadow-inner">
                    <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-accent"><Palette className="mr-2" /> Theme</CardTitle></CardHeader>
                    <CardContent>
                        <FormField control={form.control} name="theme" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/30">
                                <div className="space-y-0.5">
                                    <FormLabel>Dark Mode</FormLabel>
                                    <FormDescription>Toggle between dark and light themes.</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value === 'dark'} onCheckedChange={(checked) => field.onChange(checked ? 'dark' : 'light')} />
                                </FormControl>
                            </FormItem>
                        )} />
                    </CardContent>
                  </Card>
                  <Button type="button" onClick={handleSaveGeneralSettings} className="w-full sm:w-auto glow-button" disabled={isGeneralSaving}>
                      {isGeneralSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save General & Theme Settings
                  </Button>
            </CardContent>
          </Card>

        {/* Avatar Selection Card */}
        <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-purple-500/10">
            <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-purple-400"><UserCircle className="mr-2"/> Choose Your Avatar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-2 border rounded-md bg-background/20">
                    {sampleAvatars.map(avatar => (
                        <div 
                            key={avatar.id}
                            className={`p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-100 hover:shadow-lg ${form.watch('selectedAvatarUrl') === avatar.url ? 'border-primary shadow-primary/40 opacity-100 scale-105' : 'border-transparent opacity-70'}`}
                            onClick={() => handleAvatarSelect(avatar.url)}
                        >
                            <Avatar className="h-20 w-20 mx-auto">
                                <AvatarImage src={avatar.url} alt={avatar.name} data-ai-hint={avatar.dataAiHint}/>
                                <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="text-xs text-center mt-1 text-muted-foreground truncate">{avatar.name}</p>
                        </div>
                    ))}
                </div>
                 <Button type="button" onClick={handleSaveAvatar} className="w-full sm:w-auto glow-button" disabled={isAvatarSaving || !form.getValues('selectedAvatarUrl')}>
                    {isAvatarSaving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />} Set Selected Avatar
                </Button>
            </CardContent>
        </Card>


          <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-accent/10">
            <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-accent"><Music className="mr-2" /> Alarm Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <FormItem>
                    <FormLabel className="text-base font-medium">Upload Custom Alarm Tone</FormLabel>
                    <FormControl>
                        <Input type="file" accept={ACCEPTED_AUDIO_TYPES.join(',')} ref={alarmFileInputRef} onChange={handleAlarmFileChange} className="input-glow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                    </FormControl>
                    <FormDescription>Upload an MP3, WAV, or OGG file ({MAX_FILE_SIZE_MB}MB max).</FormDescription>
                </FormItem>
                {currentAlarmToneUrl && (
                    <div>
                        <p className="text-sm text-muted-foreground">Current alarm tone:</p>
                        <audio controls src={currentAlarmToneUrl} className="w-full mt-1 rounded-md">Your browser does not support the audio element.</audio>
                    </div>
                )}
                <Button type="button" onClick={handleSaveAlarmTone} className="w-full sm:w-auto glow-button" disabled={isAlarmSaving || !selectedAlarmFile}>
                    {isAlarmSaving ? <Loader2 className="animate-spin mr-2" /> : <SaveIcon className="mr-2" />} Save Alarm Tone
                </Button>
            </CardContent>
          </Card>
          
          <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-secondary/10">
            <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-secondary"><CalendarClock className="mr-2" /> Custom Countdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <FormField control={form.control} name="custom_countdown_event_name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Event Name</FormLabel>
                        <FormControl><Input placeholder="E.g., NEET 2026 Exam" {...field} className="h-11 input-glow" /></FormControl>
                         <FormDescription>Name of the event for your custom countdown on the dashboard.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="custom_countdown_target_date" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Target Date</FormLabel>
                        <FormControl><Input type="date" {...field} className="h-11 input-glow" /></FormControl>
                         <FormDescription>The date of your custom event.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="button" onClick={handleSaveCustomCountdown} className="w-full sm:w-auto glow-button" disabled={isCountdownSaving}>
                    {isCountdownSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save Custom Countdown
                </Button>
            </CardContent>
          </Card>

          <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-destructive/10">
            <CardHeader><CardTitle className="flex items-center text-xl font-headline glow-text-destructive"><KeyRound className="mr-2" /> Account Security</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="currentPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Current Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Enter your current password" {...field} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">New Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Enter new password (min 6 chars)" {...field} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="confirmNewPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-base font-medium">Confirm New Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Confirm new password" {...field} className="h-11 input-glow" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <Button type="button" onClick={handlePasswordChange} className="w-full sm:w-auto glow-button border-destructive/70 text-destructive/90 hover:bg-destructive/20 hover:text-destructive" disabled={isPasswordChanging}>
                    {isPasswordChanging ? <Loader2 className="animate-spin mr-2" /> : <ShieldQuestion className="mr-2" />} Change Password
                </Button>
            </CardContent>
          </Card>
      </Form>
    </div>
  );
}

