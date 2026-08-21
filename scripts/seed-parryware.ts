import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="%2394a3b8" dominant-baseline="middle" text-anchor="middle">Parryware Product Image</text></svg>`;

interface RawProduct {
  category: string;
  name: string;
  description?: string;
  variants: Array<{
    code: string;
    sizeName?: string;
    length?: number;
    width?: number;
    height?: number;
    price: number;
    sku?: string;
  }>;
}

const CATALOG_DATA: RawProduct[] = [
  // CATEGORY 1: ONE PIECE WC (S-TRAP)
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Aquiline One Piece WC',
    description: 'Aquiline premium One Piece WC with dual flush capability.',
    variants: [
      { code: 'C8901(S-290)', sizeName: 'C8901 (S-290)', length: 690, width: 380, height: 750, price: 23490, sku: 'C8901-S290' },
      { code: 'C8902(S-220)', sizeName: 'C8902 (S-220)', length: 690, width: 380, height: 750, price: 23490, sku: 'C8902-S220' },
    ],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Inslim One Piece WC (C8935)',
    description: 'Inslim One Piece WC, S-220 trap.',
    variants: [{ code: 'C8935(S-220)', sizeName: 'C8935 (S-220)', length: 750, width: 405, height: 780, price: 22990, sku: 'C8935-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Inslim One Piece WC (C8905)',
    description: 'Inslim One Piece WC, S-290 trap.',
    variants: [{ code: 'C8905(S-290)', sizeName: 'C8905 (S-290)', length: 710, width: 365, height: 750, price: 22990, sku: 'C8905-S290' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Reeve One Piece WC',
    variants: [{ code: 'C8900(S-220)', sizeName: 'C8900 (S-220)', length: 685, width: 380, height: 745, price: 19490, sku: 'C8900-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Zest One Piece WC',
    variants: [{ code: 'C8810(S-110)', sizeName: 'C8810 (S-110)', length: 665, width: 350, height: 705, price: 17990, sku: 'C8810-S110' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Atlas One Piece WC',
    variants: [
      { code: 'C899E(S-110)', sizeName: 'C899E (S-110)', length: 640, width: 355, height: 695, price: 17990, sku: 'C899E-S110' },
      { code: 'C899D(S-285)', sizeName: 'C899D (S-285)', length: 640, width: 355, height: 695, price: 17990, sku: 'C899D-S285' },
    ],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Viva One Piece WC',
    variants: [
      { code: 'C8917(S-305)', sizeName: 'C8917 (S-305) - Joy One Piece', length: 660, width: 350, height: 700, price: 17990, sku: 'C8917-S305' },
      { code: 'C899F(S-220)', sizeName: 'C899F (S-220)', length: 660, width: 350, height: 700, price: 17990, sku: 'C899F-S220' },
    ],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Prime Plus One Piece WC',
    variants: [{ code: 'C8918(S-220)', sizeName: 'C8918 (S-220)', length: 620, width: 350, height: 720, price: 17490, sku: 'C8918-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Canvas One Piece WC',
    variants: [{ code: 'C897K(S-220)', sizeName: 'C897K (S-220)', length: 730, width: 380, height: 790, price: 16990, sku: 'C897K-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Millenia One Piece WC',
    variants: [{ code: 'C897I(S-220)', sizeName: 'C897I (S-220)', length: 700, width: 425, height: 770, price: 16990, sku: 'C897I-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Marvel One Piece WC',
    variants: [{ code: 'C8938(S-220)', sizeName: 'C8938 (S-220)', length: 640, width: 345, height: 700, price: 15990, sku: 'C8938-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Vista One Piece WC',
    variants: [{ code: 'C899G(S-220)', sizeName: 'C899G (S-220)', length: 660, width: 365, height: 780, price: 15990, sku: 'C899G-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Apex One Piece WC',
    variants: [{ code: 'C8643(S-220)', sizeName: 'C8643 (S-220)', length: 650, width: 360, height: 740, price: 15490, sku: 'C8643-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Ovalo One Piece WC',
    variants: [{ code: 'C8967(S-220)', sizeName: 'C8967 (S-220)', length: 645, width: 380, height: 755, price: 15490, sku: 'C8967-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Crystal One Piece WC',
    variants: [{ code: 'C8644(S-220)', sizeName: 'C8644 (S-220)', length: 650, width: 365, height: 750, price: 15490, sku: 'C8644-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Opal One Piece WC',
    variants: [{ code: 'C8645(S-220)', sizeName: 'C8645 (S-220)', length: 670, width: 370, height: 750, price: 15490, sku: 'C8645-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Jeta One Piece WC (Inbuilt Jet)',
    variants: [{ code: 'C8602(S-220)', sizeName: 'C8602 (S-220) Inbuilt Jet', length: 660, width: 350, height: 755, price: 15490, sku: 'C8602-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Honor One Piece WC',
    variants: [{ code: 'C899J(S-220)', sizeName: 'C899J (S-220)', length: 660, width: 360, height: 735, price: 14990, sku: 'C899J-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Brezza One Piece WC',
    variants: [{ code: 'C8601(S-230)', sizeName: 'C8601 (S-230)', length: 640, width: 365, height: 740, price: 14990, sku: 'C8601-S230' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Aster One Piece WC',
    variants: [
      { code: 'C8966(S-230)', sizeName: 'C8966 (S-230)', length: 665, width: 360, height: 720, price: 14990, sku: 'C8966-S230' },
      { code: 'C893X(S-300)', sizeName: 'C893X (S-300)', length: 665, width: 360, height: 720, price: 14990, sku: 'C893X-S300' },
    ],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Claret One Piece WC',
    variants: [
      { code: 'C8640(S-230)', sizeName: 'C8640 (S-230)', length: 640, width: 365, height: 735, price: 14490, sku: 'C8640-S230' },
      { code: 'C8633(S-300)', sizeName: 'C8633 (S-300)', length: 640, width: 365, height: 735, price: 14490, sku: 'C8633-S300' },
    ],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Prime One Piece WC',
    variants: [
      { code: 'C8853(S-220)', sizeName: 'C8853 (S-220)', length: 660, width: 360, height: 700, price: 14490, sku: 'C8853-S220' },
      { code: 'C8833(S-300)', sizeName: 'C8833 (S-300)', length: 660, width: 360, height: 700, price: 14490, sku: 'C8833-S300' },
    ],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Jupiter One Piece WC',
    variants: [
      { code: 'C8598(S-220)', sizeName: 'C8598 (S-220)', length: 650, width: 350, height: 705, price: 14490, sku: 'C8598-S220' },
      { code: 'C8611(S-300)', sizeName: 'C8611 (S-300)', length: 650, width: 350, height: 705, price: 14490, sku: 'C8611-S300' },
    ],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Aura One Piece WC',
    variants: [
      { code: 'C8641(S-300)', sizeName: 'C8641 (S-300)', length: 690, width: 365, height: 750, price: 13990, sku: 'C8641-S300' },
      { code: 'C862X(S-220)', sizeName: 'C862X (S-220)', length: 690, width: 365, height: 750, price: 13990, sku: 'C862X-S220' },
    ],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Sutra One Piece WC',
    variants: [{ code: 'C8965(S-220)', sizeName: 'C8965 (S-220)', length: 680, width: 360, height: 710, price: 13990, sku: 'C8965-S220' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Peri One Piece WC',
    variants: [{ code: 'C889Q(S-300)', sizeName: 'C889Q (S-300)', length: 640, width: 360, height: 715, price: 13490, sku: 'C889Q-S300' }],
  },
  {
    category: 'One Piece WC (S-Trap)',
    name: 'Tiger One Piece WC',
    variants: [{ code: 'C8599(S-230)', sizeName: 'C8599 (S-230)', length: 700, width: 360, height: 760, price: 13490, sku: 'C8599-S230' }],
  },

  // CATEGORY 2: WALL HUNG WC
  {
    category: 'Wall Hung WC',
    name: 'Grand Hi-Jet Wall Hung WC',
    variants: [{ code: 'C8934', sizeName: 'RBD-180mm', length: 510, width: 350, height: 360, price: 20990, sku: 'C8934' }],
  },
  {
    category: 'Wall Hung WC',
    name: 'Rombi Wall Hung WC',
    variants: [{ code: 'C894B', sizeName: 'RBD-180mm', length: 525, width: 370, height: 335, price: 16490, sku: 'C894B' }],
  },
  {
    category: 'Wall Hung WC',
    name: 'Helix Wall Hung WC',
    variants: [{ code: 'C8895', sizeName: 'RBD-180mm', length: 490, width: 325, height: 350, price: 15990, sku: 'C8895' }],
  },
  {
    category: 'Wall Hung WC',
    name: 'Confident Wall Hung WC',
    variants: [{ code: 'C890U', sizeName: 'RBD-180mm', length: 490, width: 370, height: 340, price: 15990, sku: 'C890U' }],
  },
  {
    category: 'Wall Hung WC',
    name: 'Blaze Wall Hung WC',
    variants: [{ code: 'C890V', sizeName: 'RBD-180mm', length: 570, width: 390, height: 355, price: 15990, sku: 'C890V' }],
  },
  {
    category: 'Wall Hung WC',
    name: 'Superio Rimless Wall Hung WC',
    variants: [{ code: 'C890X', sizeName: 'RBD-180mm', length: 520, width: 360, height: 410, price: 15490, sku: 'C890X' }],
  },
  {
    category: 'Wall Hung WC',
    name: 'Luco Wall Hung WC',
    variants: [
      { code: 'C022U', sizeName: 'UF Seat Cover - White', length: 525, width: 355, height: 360, price: 14490, sku: 'C022U' },
      { code: 'C023U', sizeName: 'PP Seat Cover - White', length: 525, width: 355, height: 360, price: 12990, sku: 'C023U' },
      { code: 'C022U-4H', sizeName: 'Moon Ivory (4H)', length: 525, width: 355, height: 360, price: 14490, sku: 'C022U-4H' },
      { code: 'C022U-4K', sizeName: 'Platinum Grey (4K)', length: 525, width: 355, height: 360, price: 14490, sku: 'C022U-4K' },
      { code: 'C022U-7C', sizeName: 'Matte Black (7C)', length: 525, width: 355, height: 360, price: 14490, sku: 'C022U-7C' },
    ],
  },
  {
    category: 'Wall Hung WC',
    name: 'Verve AM Rimless Wall Hung WC',
    variants: [{ code: 'C022G', sizeName: 'RBD-260mm', length: 560, width: 360, height: 350, price: 14990, sku: 'C022G' }],
  },
  {
    category: 'Wall Hung WC',
    name: 'Zest N Rimless Wall Hung WC',
    variants: [{ code: 'C8896', sizeName: 'RBD-230mm', length: 540, width: 350, height: 365, price: 12490, sku: 'C8896' }],
  },

  // CATEGORY 3: FLOOR MOUNTED COUPLED CLOSET WITH DUAL FLUSH CISTERN
  {
    category: 'Floor Mounted Coupled Closet',
    name: 'Niagara Coupled Closet Set',
    description: 'Includes C0293 Closet (S-230), E8306 Seat Cover, C0767 Cistern Set.',
    variants: [{ code: 'C0293+E8306+C0767', sizeName: 'Complete Set (White)', length: 690, width: 380, height: 820, price: 14900, sku: 'NIAGARA-CC' }],
  },
  {
    category: 'Floor Mounted Coupled Closet',
    name: 'Casa Coupled Closet Set',
    description: 'Includes C022X Closet (S-110 Concealed Trap) and C022Z Cistern Set.',
    variants: [
      { code: 'C022X+C022Z-WHITE', sizeName: 'White Set', length: 730, width: 370, height: 845, price: 10200, sku: 'CASA-CC-W' },
      { code: 'C022X+C022Z-4A', sizeName: 'Silky Off White (4A)', length: 730, width: 370, height: 845, price: 14250, sku: 'CASA-CC-4A' },
      { code: 'C022X+C022Z-4I', sizeName: 'Alpine Blue (4I)', length: 730, width: 370, height: 845, price: 14250, sku: 'CASA-CC-4I' },
      { code: 'C022X+C022Z-4H', sizeName: 'Moon Ivory (4H)', length: 730, width: 370, height: 845, price: 14250, sku: 'CASA-CC-4H' },
      { code: 'C022X+C022Z-4N', sizeName: 'Magenta (4N)', length: 730, width: 370, height: 845, price: 14250, sku: 'CASA-CC-4N' },
    ],
  },

  // CATEGORY 4: WALL HUNG WITH DUAL FLUSH CISTERN
  {
    category: 'Wall Hung with Dual Flush Cistern',
    name: 'Verve AM Wall Hung Suite',
    description: 'C022N Closet + C0716 Cistern Set.',
    variants: [{ code: 'C022N+C0716', sizeName: 'Complete Suite', length: 665, width: 360, height: 725, price: 24500, sku: 'C022N-SET' }],
  },
  {
    category: 'Wall Hung with Dual Flush Cistern',
    name: 'Flair Wall Hung Suite',
    description: 'C0210 Closet + E8293 Seat Cover + C0768 Cistern Set.',
    variants: [{ code: 'C0210+E8293+C0768', sizeName: 'Complete Suite', length: 655, width: 365, height: 760, price: 17250, sku: 'FLAIR-SET' }],
  },
  {
    category: 'Wall Hung with Dual Flush Cistern',
    name: 'Indus Wall Hung Suite',
    description: 'C0265 Closet + E8356 Seat Cover + C0769 Cistern Set.',
    variants: [{ code: 'C0265+E8356+C0769', sizeName: 'Complete Suite', length: 615, width: 380, height: 770, price: 15450, sku: 'INDUS-WH-SET' }],
  },
  {
    category: 'Wall Hung with Dual Flush Cistern',
    name: 'Casa Wall Hung Suite',
    description: 'C022W Closet + C022Y Cistern Set.',
    variants: [{ code: 'C022W+C022Y', sizeName: 'Complete Suite', length: 680, width: 365, height: 780, price: 15000, sku: 'CASA-WH-SET' }],
  },

  // CATEGORY 5: FLOOR MOUNTED WC (EWC)
  {
    category: 'Floor Mounted WC (EWC)',
    name: 'Universal EWC Suite',
    variants: [
      { code: 'C0271/C0272-WHITE', sizeName: 'White (S/P-Trap)', length: 575, width: 465, height: 395, price: 9300, sku: 'UNI-EWC-W' },
      { code: 'C0271/C0272-4A', sizeName: 'Silky Off White (4A)', length: 575, width: 465, height: 395, price: 12975, sku: 'UNI-EWC-4A' },
      { code: 'C0271/C0272-4I', sizeName: 'Alpine Blue (4I)', length: 575, width: 465, height: 395, price: 12975, sku: 'UNI-EWC-4I' },
      { code: 'C0271/C0272-4H', sizeName: 'Moon Ivory (4H)', length: 575, width: 465, height: 395, price: 12975, sku: 'UNI-EWC-4H' },
      { code: 'C0271/C0272-4N', sizeName: 'Magenta (4N)', length: 575, width: 465, height: 395, price: 12975, sku: 'UNI-EWC-4N' },
    ],
  },
  {
    category: 'Floor Mounted WC (EWC)',
    name: 'Niagara EWC Suite',
    variants: [
      { code: 'C0252-WHITE', sizeName: 'White (S-Trap)', length: 550, width: 380, height: 400, price: 5850, sku: 'NIAGARA-EWC-W' },
      { code: 'C0252-4A', sizeName: 'Silky Off White (4A)', length: 550, width: 380, height: 400, price: 8175, sku: 'NIAGARA-EWC-4A' },
      { code: 'C0252-4I', sizeName: 'Alpine Blue (4I)', length: 550, width: 380, height: 400, price: 8175, sku: 'NIAGARA-EWC-4I' },
      { code: 'C0252-4H', sizeName: 'Moon Ivory (4H)', length: 550, width: 380, height: 400, price: 8175, sku: 'NIAGARA-EWC-4H' },
      { code: 'C0252-4N', sizeName: 'Magenta (4N)', length: 550, width: 380, height: 400, price: 8175, sku: 'NIAGARA-EWC-4N' },
    ],
  },
  {
    category: 'Floor Mounted WC (EWC)',
    name: 'Verve Plus EWC',
    variants: [{ code: 'C022Q(S-Trap)', sizeName: 'C022Q S-Trap', length: 600, width: 340, height: 390, price: 6700, sku: 'C022Q' }],
  },
  {
    category: 'Floor Mounted WC (EWC)',
    name: 'Camry / Verve EWC',
    variants: [
      { code: 'C022T', sizeName: 'C022T S-Trap', length: 535, width: 350, height: 400, price: 4750, sku: 'C022T' },
      { code: 'C8964', sizeName: 'C8964 S-Trap', length: 535, width: 350, height: 400, price: 4750, sku: 'C8964' },
      { code: 'C0279', sizeName: 'C0279 P-Trap', length: 535, width: 350, height: 400, price: 4750, sku: 'C0279' },
    ],
  },
  {
    category: 'Floor Mounted WC (EWC)',
    name: 'Petite Concealed EWC',
    description: 'C022O Concealed S-Trap Closet + E8309 Seat Cover.',
    variants: [{ code: 'C022O+E8309', sizeName: 'Complete Set', length: 560, width: 360, height: 400, price: 4200, sku: 'C022O-SET' }],
  },
  {
    category: 'Floor Mounted WC (EWC)',
    name: 'Elite EWC (ISI Certified)',
    variants: [
      { code: 'C0297/C0278-WHITE', sizeName: 'White (S/P-Trap)', length: 530, width: 380, height: 400, price: 4050, sku: 'ELITE-EWC-W' },
      { code: 'C0297/C0278-4A', sizeName: 'Silky Off White (4A)', length: 530, width: 380, height: 400, price: 5725, sku: 'ELITE-EWC-4A' },
      { code: 'C0297/C0278-4I', sizeName: 'Alpine Blue (4I)', length: 530, width: 380, height: 400, price: 5725, sku: 'ELITE-EWC-4I' },
      { code: 'C0297/C0278-4H', sizeName: 'Moon Ivory (4H)', length: 530, width: 380, height: 400, price: 5725, sku: 'ELITE-EWC-4H' },
      { code: 'C0297/C0278-4N', sizeName: 'Magenta (4N)', length: 530, width: 380, height: 400, price: 5725, sku: 'ELITE-EWC-4N' },
    ],
  },
  {
    category: 'Floor Mounted WC (EWC)',
    name: 'Petite EWC (ISI Certified)',
    variants: [
      { code: 'C0287/C0288-WHITE', sizeName: 'White (S/P-Trap)', length: 515, width: 360, height: 405, price: 3750, sku: 'PETITE-EWC-W' },
      { code: 'C0287/C0288-4A', sizeName: 'Silky Off White (4A)', length: 515, width: 360, height: 405, price: 5250, sku: 'PETITE-EWC-4A' },
      { code: 'C0287/C0288-4I', sizeName: 'Alpine Blue (4I)', length: 515, width: 360, height: 405, price: 5250, sku: 'PETITE-EWC-4I' },
      { code: 'C0287/C0288-4H', sizeName: 'Moon Ivory (4H)', length: 515, width: 360, height: 405, price: 5250, sku: 'PETITE-EWC-4H' },
      { code: 'C0287/C0288-4N', sizeName: 'Magenta (4N)', length: 515, width: 360, height: 405, price: 5250, sku: 'PETITE-EWC-4N' },
    ],
  },

  // CATEGORY 6: SQUATTING PAN
  {
    category: 'Squatting Pan',
    name: 'New Asian Pan',
    variants: [
      { code: 'C0131-W', sizeName: 'White', length: 500, width: 410, height: 175, price: 3450, sku: 'C0131-W' },
      { code: 'C0131-COLOR', sizeName: 'Color (4 Options)', length: 500, width: 410, height: 175, price: 4850, sku: 'C0131-C' },
    ],
  },
  {
    category: 'Squatting Pan',
    name: 'Rapti Pan',
    variants: [{ code: 'C0145', sizeName: 'Standard', length: 500, width: 395, height: 200, price: 2250, sku: 'C0145' }],
  },
  {
    category: 'Squatting Pan',
    name: 'Utsav Pan XL 580mm (ISI Certified)',
    variants: [
      { code: 'C0117CS-W', sizeName: 'White', length: 580, width: 440, height: 300, price: 2600, sku: 'C0117CS-W' },
      { code: 'C0117CS-COLOR', sizeName: 'Color (4 Options)', length: 580, width: 440, height: 300, price: 3650, sku: 'C0117CS-C' },
    ],
  },
  {
    category: 'Squatting Pan',
    name: 'Utsav Pan 500mm',
    variants: [
      { code: 'C0133CS-W', sizeName: 'White', length: 500, width: 405, height: 255, price: 2500, sku: 'C0133CS-W' },
      { code: 'C0133CS-COLOR', sizeName: 'Color (4 Options)', length: 500, width: 405, height: 255, price: 3500, sku: 'C0133CS-C' },
    ],
  },
  {
    category: 'Squatting Pan',
    name: 'Ace Pan 580mm',
    variants: [{ code: 'C894F', sizeName: 'Standard', length: 580, width: 440, height: 300, price: 2600, sku: 'C894F' }],
  },
  {
    category: 'Squatting Pan',
    name: 'Ace Pan 500mm',
    variants: [{ code: 'C8893', sizeName: 'Standard', length: 500, width: 400, height: 260, price: 2500, sku: 'C8893' }],
  },
  {
    category: 'Squatting Pan',
    name: 'Utsav Pan 580mm',
    variants: [{ code: 'C0126CS', sizeName: 'Standard', length: 580, width: 420, height: 260, price: 2550, sku: 'C0126CS' }],
  },
  {
    category: 'Squatting Pan',
    name: 'Rimfree Pan',
    variants: [{ code: 'C0129', sizeName: 'Standard', length: 500, width: 400, height: 250, price: 2050, sku: 'C0129' }],
  },

  // CATEGORY 7: WALL HUNG BASIN
  { category: 'Wall Hung Basin', name: 'Resolute Wall Hung Basin', variants: [{ code: 'C8982', sizeName: 'Standard', length: 450, width: 350, height: 160, price: 2400, sku: 'C8982' }] },
  { category: 'Wall Hung Basin', name: 'Oxford Wall Hung Basin (ISI Certified)', variants: [{ code: 'C0434', sizeName: 'CTH', length: 550, width: 400, height: 200, price: 2200, sku: 'C0434' }] },
  {
    category: 'Wall Hung Basin',
    name: 'Corner Basin',
    variants: [
      { code: 'C0408-W', sizeName: 'White', length: 410, width: 410, height: 200, price: 2200, sku: 'C0408-W' },
      { code: 'C0408-COLOR', sizeName: 'Color (4 Options)', length: 410, width: 410, height: 200, price: 3100, sku: 'C0408-C' },
    ],
  },
  { category: 'Wall Hung Basin', name: 'Cooper Wall Hung Basin', variants: [{ code: 'C042Q', sizeName: 'Standard', length: 500, width: 400, height: 180, price: 2200, sku: 'C042Q' }] },
  { category: 'Wall Hung Basin', name: 'Indus Standard Basin', variants: [{ code: 'C041B', sizeName: 'Standard', length: 500, width: 400, height: 180, price: 2150, sku: 'C041B' }] },
  {
    category: 'Wall Hung Basin',
    name: 'Indus Basin',
    variants: [
      { code: 'C0471/C0472-W', sizeName: 'White', length: 500, width: 400, height: 210, price: 2150, sku: 'C0471-W' },
      { code: 'C0471/C0472-COLOR', sizeName: 'Color (4 Options)', length: 500, width: 400, height: 210, price: 2975, sku: 'C0471-C' },
    ],
  },
  { category: 'Wall Hung Basin', name: 'Kolar Sumo Basin', variants: [{ code: 'C042P', sizeName: 'Standard', length: 530, width: 380, height: 210, price: 2100, sku: 'C042P' }] },
  { category: 'Wall Hung Basin', name: 'Apex Basin', variants: [{ code: 'C8656', sizeName: 'Standard', length: 400, width: 320, height: 145, price: 2050, sku: 'C8656' }] },
  {
    category: 'Wall Hung Basin',
    name: 'Tapti Basin',
    variants: [
      { code: 'C0490-W', sizeName: 'White', length: 450, width: 330, height: 210, price: 2050, sku: 'C0490-W' },
      { code: 'C0490-COLOR', sizeName: 'Color (4 Options)', length: 450, width: 330, height: 210, price: 2875, sku: 'C0490-C' },
    ],
  },
  { category: 'Wall Hung Basin', name: 'Vault Basin', variants: [{ code: 'C8654', sizeName: 'Standard', length: 470, width: 370, height: 125, price: 2050, sku: 'C8654' }] },
  {
    category: 'Wall Hung Basin',
    name: 'Kolar Basin',
    variants: [
      { code: 'C042E-W', sizeName: 'White', length: 460, width: 330, height: 200, price: 1950, sku: 'C042E-W' },
      { code: 'C042E-COLOR', sizeName: 'Color (4 Options)', length: 460, width: 330, height: 200, price: 2725, sku: 'C042E-C' },
    ],
  },
  { category: 'Wall Hung Basin', name: 'Atom Prime Basin', variants: [{ code: 'C049A', sizeName: 'Standard', length: 400, width: 300, height: 110, price: 1900, sku: 'C049A' }] },
  { category: 'Wall Hung Basin', name: 'Atom Pro / Plus Basin', variants: [{ code: 'C897Q/C8992', sizeName: 'C897Q / C8992', length: 400, width: 300, height: 110, price: 1900, sku: 'C897Q' }] },
  { category: 'Wall Hung Basin', name: 'Cascade Classic Basin', variants: [{ code: 'C0476', sizeName: 'Standard', length: 500, width: 400, height: 190, price: 1900, sku: 'C0476' }] },
  { category: 'Wall Hung Basin', name: 'Uno Basin', variants: [{ code: 'C042L', sizeName: 'Standard', length: 450, width: 350, height: 160, price: 1800, sku: 'C042L' }] },

  // CATEGORY 8: LONG PEDESTAL
  { category: 'Long Pedestal', name: 'Standard Pedestal', variants: [{ code: 'C0371', sizeName: 'Standard', length: 155, width: 170, height: 630, price: 2950, sku: 'C0371' }] },
  { category: 'Long Pedestal', name: 'Sepia Pedestal', variants: [{ code: 'C8873', sizeName: 'Standard', length: 165, width: 190, height: 720, price: 2800, sku: 'C8873' }] },
  { category: 'Long Pedestal', name: 'Glory Pedestal', variants: [{ code: 'C0383', sizeName: 'Standard', length: 170, width: 190, height: 710, price: 2450, sku: 'C0383' }] },
  { category: 'Long Pedestal', name: 'Sepia S Pedestal', variants: [{ code: 'C8991', sizeName: 'Standard', length: 175, width: 185, height: 715, price: 2300, sku: 'C8991' }] },
  { category: 'Long Pedestal', name: 'Star Pedestal', variants: [{ code: 'C0325', sizeName: 'Standard', length: 155, width: 180, height: 650, price: 2100, sku: 'C0325' }] },
  { category: 'Long Pedestal', name: 'Flex Pedestal', variants: [{ code: 'C8629', sizeName: 'Standard', length: 165, width: 200, height: 710, price: 1900, sku: 'C8629' }] },
  { category: 'Long Pedestal', name: 'Novel Pedestal', variants: [{ code: 'C0324', sizeName: 'Standard', length: 155, width: 225, height: 725, price: 1900, sku: 'C0324' }] },
  { category: 'Long Pedestal', name: 'Luco Pedestal', variants: [{ code: 'C898E', sizeName: 'Standard', length: 170, width: 190, height: 710, price: 1850, sku: 'C898E' }] },
  { category: 'Long Pedestal', name: 'Grace Pedestal', variants: [{ code: 'C898H', sizeName: 'Standard', length: 160, width: 190, height: 700, price: 1800, sku: 'C898H' }] },

  // CATEGORY 9: URINALS — ELECTRONIC
  { category: 'Urinals — Electronic', name: 'Integrated N Electronic Urinal', variants: [{ code: 'C0588', sizeName: 'Integrated DC Power', length: 430, width: 420, height: 655, price: 21850, sku: 'C0588' }] },
  { category: 'Urinals — Electronic', name: 'Sensurn Electronic Urinal Set', description: 'C0592 Integrated AC/DC + C859299 P-Trap Outlet', variants: [{ code: 'C0592+C859299', sizeName: 'Complete Set', length: 350, width: 340, height: 650, price: 16700, sku: 'SENSURN-SET' }] },
  { category: 'Urinals — Electronic', name: 'Craft Electronic Urinal', variants: [{ code: 'C0589/C0599', sizeName: 'AC/DC Source', length: 365, width: 370, height: 550, price: 11900, sku: 'C0589' }] },

  // CATEGORY 10: URINALS — REGULAR
  { category: 'Urinals — Regular', name: 'Whiz Urinal Set', description: 'C0580 Urinal + C8123 Assembly Kit', variants: [{ code: 'C0580+C8123', sizeName: 'Complete Set', length: 360, width: 345, height: 570, price: 10100, sku: 'WHIZ-SET' }] },
  { category: 'Urinals — Regular', name: 'New Magnum Combo Set (ISI Certified)', variants: [{ code: 'C0583', sizeName: 'Combo Set', length: 380, width: 405, height: 590, price: 8300, sku: 'C0583' }] },
  { category: 'Urinals — Regular', name: 'Luna Urinal', variants: [{ code: 'C8681', sizeName: 'Standard', length: 280, width: 305, height: 385, price: 3000, sku: 'C8681' }] },
  { category: 'Urinals — Regular', name: 'Niagara N Urinal Set', description: 'C0579 Urinal + E8113 Spreader Set', variants: [{ code: 'C0579+E8113', sizeName: 'Complete Set', length: 280, width: 335, height: 465, price: 3000, sku: 'NIAGARA-UR-SET' }] },
  { category: 'Urinals — Regular', name: 'Flat Back Urinal (ISI Certified)', variants: [{ code: 'C0501', sizeName: 'Standard', length: 270, width: 360, height: 440, price: 2450, sku: 'C0501' }] },
  { category: 'Urinals — Regular', name: 'Squatting Urinal', variants: [{ code: 'C0503', sizeName: 'Standard', length: 350, width: 600, height: 100, price: 2850, sku: 'C0503' }] },

  // CATEGORY 11: FAUCETS — CLARET COLLECTION > BASIN
  { category: 'Faucets — Claret Collection > Basin', name: 'Single Lever Basin Mixer', variants: [{ code: 'T4665A1', sizeName: 'Standard Chrome', length: 0, width: 0, height: 0, price: 4700, sku: 'T4665A1' }] },
  {
    category: 'Faucets — Claret Collection > Basin',
    name: 'Single Lever Basin Mixer (Cold Start)',
    variants: [
      { code: 'G5265A1', sizeName: 'Chrome', length: 0, width: 0, height: 0, price: 4700, sku: 'G5265A1' },
      { code: 'G5265A1GE', sizeName: 'Gold / Emerald (GE)', length: 0, width: 0, height: 0, price: 4850, sku: 'G5265A1GE' },
      { code: 'G5265A1GJ', sizeName: 'Gold / Jade (GJ)', length: 0, width: 0, height: 0, price: 4950, sku: 'G5265A1GJ' },
    ],
  },
  { category: 'Faucets — Claret Collection > Basin', name: 'Tall Body Basin Mixer', variants: [{ code: 'T4663A1/T4646A1', sizeName: 'Tall Body', length: 0, width: 0, height: 0, price: 6100, sku: 'T4663A1' }] },
  { category: 'Faucets — Claret Collection > Basin', name: 'Wall Mounted Basin Mixer Upper Trim (G5277A1)', variants: [{ code: 'G5277A1', sizeName: 'Upper Trim (compat G9002A1)', length: 0, width: 0, height: 0, price: 3200, sku: 'G5277A1' }] },
  { category: 'Faucets — Claret Collection > Basin', name: 'Wall Mounted Basin Mixer Upper Trim (G5276A1)', variants: [{ code: 'G5276A1', sizeName: 'Upper Trim (compat G9002A1)', length: 0, width: 0, height: 0, price: 2700, sku: 'G5276A1' }] },
  { category: 'Faucets — Claret Collection > Basin', name: 'Center Hole Basin Mixer', variants: [{ code: 'T4614A1', sizeName: 'Standard', length: 0, width: 0, height: 0, price: 4600, sku: 'T4614A1' }] },
  {
    category: 'Faucets — Claret Collection > Basin',
    name: 'Claret Pillar Cock',
    variants: [
      { code: 'T4601A1/G5201A1', sizeName: 'Chrome', length: 0, width: 0, height: 0, price: 1500, sku: 'G5201A1' },
      { code: 'G5201A1GE', sizeName: 'Gold / Emerald (GE)', length: 0, width: 0, height: 0, price: 1650, sku: 'G5201A1GE' },
      { code: 'G5201A1GJ', sizeName: 'Gold / Jade (GJ)', length: 0, width: 0, height: 0, price: 1750, sku: 'G5201A1GJ' },
    ],
  },
  { category: 'Faucets — Claret Collection > Basin', name: 'Tall Body Pillar Cock', variants: [{ code: 'T4602A1/T4642A1', sizeName: 'Tall Body', length: 0, width: 0, height: 0, price: 3050, sku: 'T4602A1' }] },
  { category: 'Faucets — Claret Collection > Basin', name: 'Wall Mounted Basin Tap Upper Trim', variants: [{ code: 'G5296A1', sizeName: 'Upper Trim (compat G2797A1)', length: 0, width: 0, height: 0, price: 2450, sku: 'G5296A1' }] },
  { category: 'Faucets — Claret Collection > Basin', name: 'Swan Neck Pillar Cock', variants: [{ code: 'T4668A1', sizeName: 'Swan Neck', length: 0, width: 0, height: 0, price: 2450, sku: 'T4668A1' }] },
  { category: 'Faucets — Claret Collection > Basin', name: 'Angle Valve', variants: [{ code: 'T4607A1/G5207A1', sizeName: 'Standard', length: 0, width: 0, height: 0, price: 1300, sku: 'G5207A1' }] },

  // CATEGORY 12: FAUCETS — CLARET COLLECTION > BATH
  { category: 'Faucets — Claret Collection > Bath', name: 'Concealed Diverter Upper Trim', variants: [{ code: 'G5250A1', sizeName: 'Upper Trim (compat G5051A1)', length: 0, width: 0, height: 0, price: 1650, sku: 'G5250A1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: 'Ultra High Flow Concealed Diverter Upper Trim', variants: [{ code: 'G522KA1', sizeName: 'Upper Trim (compat G4888A1)', length: 0, width: 0, height: 0, price: 1800, sku: 'G522KA1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: '3-Inlet Diverter Upper Trim', variants: [{ code: 'G5284A1', sizeName: 'Upper Trim (compat G9969A1)', length: 0, width: 0, height: 0, price: 1800, sku: 'G5284A1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: 'Deusch Mixer Upper Trim', variants: [{ code: 'G521HA1', sizeName: 'Upper Trim (compat G4257A1/G4258A1)', length: 0, width: 0, height: 0, price: 1550, sku: 'G521HA1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: 'Non Telephonic Wall Mixer', variants: [{ code: 'T4641A1', sizeName: 'Standard', length: 0, width: 0, height: 0, price: 4700, sku: 'T4641A1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: 'Wall Mixer 2-in-1', variants: [{ code: 'T4616A1/G5216A1', sizeName: '2-in-1 Wall Mixer', length: 0, width: 0, height: 0, price: 7000, sku: 'G5216A1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: 'Wall Mixer 3-in-1', variants: [{ code: 'T4617A1', sizeName: '3-in-1 Wall Mixer', length: 0, width: 0, height: 0, price: 8200, sku: 'T4617A1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: 'Wall Mixer with Crutch', variants: [{ code: 'G5219A1', sizeName: 'With Crutch', length: 0, width: 0, height: 0, price: 7650, sku: 'G5219A1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: 'Wall Spout', variants: [{ code: 'T4628A1', sizeName: 'Plain Spout', length: 0, width: 0, height: 0, price: 1750, sku: 'T4628A1' }] },
  { category: 'Faucets — Claret Collection > Bath', name: 'Wall Spout with Diverter', variants: [{ code: 'T4627A1', sizeName: 'Spout with Diverter', length: 0, width: 0, height: 0, price: 2500, sku: 'T4627A1' }] },

  // CATEGORY 13: FAUCETS — CLARET COLLECTION > KITCHEN
  { category: 'Faucets — Claret Collection > Kitchen', name: 'Sink Mixer (Wall Mounted)', variants: [{ code: 'T4635A1', sizeName: 'Wall Mounted', length: 0, width: 0, height: 0, price: 4950, sku: 'T4635A1' }] },
  { category: 'Faucets — Claret Collection > Kitchen', name: 'Wall Mounted Sink Mixer Top Outlet', variants: [{ code: 'G291XA1', sizeName: 'Top Outlet', length: 0, width: 0, height: 0, price: 5650, sku: 'G291XA1' }] },
  { category: 'Faucets — Claret Collection > Kitchen', name: 'Single Lever Sink Mixer', variants: [{ code: 'G521GA1', sizeName: 'Standard', length: 0, width: 0, height: 0, price: 6600, sku: 'G521GA1' }] },
  { category: 'Faucets — Claret Collection > Kitchen', name: 'Sink Cock (Wall Mounted)', variants: [{ code: 'T4621A1/G5221A1', sizeName: 'Wall Mounted', length: 0, width: 0, height: 0, price: 2450, sku: 'G5221A1' }] },
  { category: 'Faucets — Claret Collection > Kitchen', name: 'Sink Cock Long Spout (Wall Mounted)', variants: [{ code: 'G5223A1', sizeName: 'Long Spout', length: 0, width: 0, height: 0, price: 2650, sku: 'G5223A1' }] },
  { category: 'Faucets — Claret Collection > Kitchen', name: 'Single Lever Deck Mounted Sink Mixer', variants: [{ code: 'G5237A1', sizeName: 'Deck Mounted', length: 0, width: 0, height: 0, price: 5200, sku: 'G5237A1' }] },
  { category: 'Faucets — Claret Collection > Kitchen', name: 'Single Lever Sink Mixer (Deck Mounted)', variants: [{ code: 'G5249A1', sizeName: 'Deck Mounted Heavy', length: 0, width: 0, height: 0, price: 7300, sku: 'G5249A1' }] },

  // CATEGORY 14: FAUCETS — CLARET COLLECTION > UTILITY
  {
    category: 'Faucets — Claret Collection > Utility',
    name: 'Claret Bib Cock',
    variants: [
      { code: 'T4604A1/G5204A1', sizeName: 'Chrome', length: 0, width: 0, height: 0, price: 1450, sku: 'G5204A1' },
      { code: 'G5204A1GE', sizeName: 'Gold / Emerald (GE)', length: 0, width: 0, height: 0, price: 1600, sku: 'G5204A1GE' },
      { code: 'G5204A1GJ', sizeName: 'Gold / Jade (GJ)', length: 0, width: 0, height: 0, price: 1700, sku: 'G5204A1GJ' },
    ],
  },
  { category: 'Faucets — Claret Collection > Utility', name: 'Two Way Bib Cock', variants: [{ code: 'G5234A1', sizeName: '2-Way', length: 0, width: 0, height: 0, price: 2300, sku: 'G5234A1' }] },
  { category: 'Faucets — Claret Collection > Utility', name: 'Two Way Angle Valve', variants: [{ code: 'T4643A1/G5243A1', sizeName: '2-Way Angle Valve', length: 0, width: 0, height: 0, price: 2200, sku: 'G5243A1' }] },
  { category: 'Faucets — Claret Collection > Utility', name: 'Bib Cock with Nozzle', variants: [{ code: 'G5279A1', sizeName: 'With Nozzle', length: 0, width: 0, height: 0, price: 1500, sku: 'G5279A1' }] },
  {
    category: 'Faucets — Claret Collection > Utility',
    name: 'Long Body Bib Cock',
    variants: [
      { code: 'G5206A1/T4606A1', sizeName: 'Chrome', length: 0, width: 0, height: 0, price: 1700, sku: 'G5206A1' },
      { code: 'G5206A1GE', sizeName: 'Gold / Emerald (GE)', length: 0, width: 0, height: 0, price: 1850, sku: 'G5206A1GE' },
      { code: 'G5206A1GJ', sizeName: 'Gold / Jade (GJ)', length: 0, width: 0, height: 0, price: 1950, sku: 'G5206A1GJ' },
    ],
  },
  { category: 'Faucets — Claret Collection > Utility', name: 'Long Neck Bib Cock', variants: [{ code: 'G5271A1', sizeName: 'Long Neck', length: 0, width: 0, height: 0, price: 1850, sku: 'G5271A1' }] },
  { category: 'Faucets — Claret Collection > Utility', name: 'Concealed Stop Cock 1/2" (incl body)', variants: [{ code: 'T4611A1', sizeName: '1/2 inch', length: 0, width: 0, height: 0, price: 1600, sku: 'T4611A1' }] },
  { category: 'Faucets — Claret Collection > Utility', name: 'Concealed Stop Cock 3/4" (incl body)', variants: [{ code: 'T4612A1', sizeName: '3/4 inch', length: 0, width: 0, height: 0, price: 1700, sku: 'T4612A1' }] },
  { category: 'Faucets — Claret Collection > Utility', name: 'Concealed Stop Cock Upper Trim', variants: [{ code: 'G5283A1', sizeName: 'Upper Trim (compat G5052A1/G5053A1)', length: 0, width: 0, height: 0, price: 420, sku: 'G5283A1' }] },
  { category: 'Faucets — Claret Collection > Utility', name: 'Exposed Part of Flush Cock', variants: [{ code: 'T982CA1', sizeName: 'Exposed Part (compat T9823A1)', length: 0, width: 0, height: 0, price: 1150, sku: 'T982CA1' }] },

  // CATEGORY 15: FAUCETS — JADE COLLECTION > BASIN
  {
    category: 'Faucets — Jade Collection > Basin',
    name: 'Jade Basin Mixer without Pop-Up',
    variants: [
      { code: 'G0214A1', sizeName: 'Chrome', length: 0, width: 0, height: 0, price: 5050, sku: 'G0214A1' },
      { code: 'G0214A1GE', sizeName: 'Gold / Emerald (GE)', length: 0, width: 0, height: 0, price: 5200, sku: 'G0214A1GE' },
      { code: 'G0214A1GJ', sizeName: 'Gold / Jade (GJ)', length: 0, width: 0, height: 0, price: 5300, sku: 'G0214A1GJ' },
    ],
  },
  {
    category: 'Faucets — Jade Collection > Basin',
    name: 'Jade Pillar Cock with Aerator',
    variants: [
      { code: 'G0202A1', sizeName: 'Chrome', length: 0, width: 0, height: 0, price: 1750, sku: 'G0202A1' },
      { code: 'G0202A1GE', sizeName: 'Gold / Emerald (GE)', length: 0, width: 0, height: 0, price: 1900, sku: 'G0202A1GE' },
      { code: 'G0202A1GJ', sizeName: 'Gold / Jade (GJ)', length: 0, width: 0, height: 0, price: 2000, sku: 'G0202A1GJ' },
    ],
  },
  {
    category: 'Faucets — Jade Collection > Basin',
    name: 'Jade Swan Neck Pillar Cock',
    variants: [
      { code: 'G0268A1', sizeName: 'Chrome', length: 0, width: 0, height: 0, price: 3050, sku: 'G0268A1' },
      { code: 'G0268A1GE', sizeName: 'Gold / Emerald (GE)', length: 0, width: 0, height: 0, price: 3200, sku: 'G0268A1GE' },
      { code: 'G0268A1GJ', sizeName: 'Gold / Jade (GJ)', length: 0, width: 0, height: 0, price: 3300, sku: 'G0268A1GJ' },
    ],
  },
  { category: 'Faucets — Jade Collection > Basin', name: 'Jade Angle Valve', variants: [{ code: 'G0253A1', sizeName: 'Standard', length: 0, width: 0, height: 0, price: 1550, sku: 'G0253A1' }] },

  // CATEGORY 16: FAUCETS — JADE COLLECTION > BATH
  { category: 'Faucets — Jade Collection > Bath', name: 'Jade Wall Mixer 2-in-1', variants: [{ code: 'G022EA1', sizeName: '2-in-1 Wall Mixer', length: 0, width: 0, height: 0, price: 7750, sku: 'G022EA1' }] },
  { category: 'Faucets — Jade Collection > Bath', name: 'Jade Wall Mixer 3-in-1', variants: [{ code: 'G022FA1', sizeName: '3-in-1 Wall Mixer', length: 0, width: 0, height: 0, price: 8550, sku: 'G022FA1' }] },
  { category: 'Faucets — Jade Collection > Bath', name: 'Jade Wall Mixer with Crutch', variants: [{ code: 'G022GA1', sizeName: 'With Crutch', length: 0, width: 0, height: 0, price: 7750, sku: 'G022GA1' }] },

  // CATEGORY 17: FAUCETS — JADE COLLECTION > KITCHEN
  { category: 'Faucets — Jade Collection > Kitchen', name: 'Jade Sink Mixer (Wall Mounted)', variants: [{ code: 'G0235A1', sizeName: 'Wall Mounted', length: 0, width: 0, height: 0, price: 5550, sku: 'G0235A1' }] },
  {
    category: 'Faucets — Jade Collection > Kitchen',
    name: 'Jade Sink Cock (Wall Mounted)',
    variants: [
      { code: 'G0221A1', sizeName: 'Chrome', length: 0, width: 0, height: 0, price: 3000, sku: 'G0221A1' },
      { code: 'G0221A1GE', sizeName: 'Gold / Emerald (GE)', length: 0, width: 0, height: 0, price: 3150, sku: 'G0221A1GE' },
      { code: 'G0221A1GJ', sizeName: 'Gold / Jade (GJ)', length: 0, width: 0, height: 0, price: 3250, sku: 'G0221A1GJ' },
    ],
  },
  { category: 'Faucets — Jade Collection > Kitchen', name: 'Jade Sink Cock (Deck Mounted)', variants: [{ code: 'G0238A1', sizeName: 'Deck Mounted', length: 0, width: 0, height: 0, price: 3450, sku: 'G0238A1' }] },
  { category: 'Faucets — Jade Collection > Kitchen', name: 'Jade Sink Mixer (Deck Mounted) Two Knob', variants: [{ code: 'G0245A1', sizeName: 'Two Knob Deck Mounted', length: 0, width: 0, height: 0, price: 5200, sku: 'G0245A1' }] },

  // CATEGORY 18: FAUCETS — JADE COLLECTION > UTILITY
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Bib Cock', variants: [{ code: 'G0204A1', sizeName: 'Standard', length: 0, width: 0, height: 0, price: 1700, sku: 'G0204A1' }] },
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Long Spout Bib Cock', variants: [{ code: 'G0205A1', sizeName: 'Long Spout', length: 0, width: 0, height: 0, price: 2200, sku: 'G0205A1' }] },
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Two Way Bib Cock with Aerator', variants: [{ code: 'G021ZA1', sizeName: '2-Way with Aerator', length: 0, width: 0, height: 0, price: 2400, sku: 'G021ZA1' }] },
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Bib Cock With Nozzle', variants: [{ code: 'G0279A1', sizeName: 'With Nozzle', length: 0, width: 0, height: 0, price: 1750, sku: 'G0279A1' }] },
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Long Body Bib Cock', variants: [{ code: 'G0206A1', sizeName: 'Long Body', length: 0, width: 0, height: 0, price: 2200, sku: 'G0206A1' }] },
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Bib Cock (G0269A1)', variants: [{ code: 'G0269A1', sizeName: 'Standard', length: 0, width: 0, height: 0, price: 2100, sku: 'G0269A1' }] },
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Two Way Angle Valve', variants: [{ code: 'G021YA1', sizeName: '2-Way Angle Valve', length: 0, width: 0, height: 0, price: 2900, sku: 'G021YA1' }] },
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Concealed Stop Cock Upper Trim', variants: [{ code: 'G0251A1', sizeName: 'Upper Trim (compat G5052A1/G5053A1)', length: 0, width: 0, height: 0, price: 520, sku: 'G0251A1' }] },
  { category: 'Faucets — Jade Collection > Utility', name: 'Jade Exposed Part of Flush Cock', variants: [{ code: 'T9824A1', sizeName: 'Exposed Part (compat T9823A1)', length: 0, width: 0, height: 0, price: 1200, sku: 'T9824A1' }] },

  // CATEGORY 19: CONCEALED BODIES
  { category: 'Concealed Bodies', name: '3-Inlet Concealed Diverter Body (G9969A1)', variants: [{ code: 'G9969A1', sizeName: '3-Inlet Body', length: 0, width: 0, height: 0, price: 4600, sku: 'G9969A1' }] },
  { category: 'Concealed Bodies', name: '3-Inlet Concealed Diverter Body (T9969A1)', variants: [{ code: 'T9969A1', sizeName: '3-Inlet Body', length: 0, width: 0, height: 0, price: 4600, sku: 'T9969A1' }] },
  { category: 'Concealed Bodies', name: 'Ultra High Flow Concealed Diverter Body', variants: [{ code: 'G4888A1', sizeName: 'Ultra High Flow Body', length: 0, width: 0, height: 0, price: 4300, sku: 'G4888A1' }] },
  { category: 'Concealed Bodies', name: 'Concealed Diverter Body', variants: [{ code: 'G5051A1', sizeName: 'Standard Diverter Body', length: 0, width: 0, height: 0, price: 4000, sku: 'G5051A1' }] },
  { category: 'Concealed Bodies', name: 'Concealed Body Basin Mixer', variants: [{ code: 'G9002A1', sizeName: 'Basin Mixer Body', length: 0, width: 0, height: 0, price: 3750, sku: 'G9002A1' }] },
  { category: 'Concealed Bodies', name: 'Wall Mounted Pillar Cock Body - Pressmatic', variants: [{ code: 'G2078A1', sizeName: 'Pressmatic Body', length: 0, width: 0, height: 0, price: 3050, sku: 'G2078A1' }] },
  { category: 'Concealed Bodies', name: 'Concealed Deusch Mixer Body', variants: [{ code: 'G4257A1', sizeName: 'Deusch Body', length: 0, width: 0, height: 0, price: 2300, sku: 'G4257A1' }] },
  { category: 'Concealed Bodies', name: 'Concealed Deusch Mixer Body (Reverse)', variants: [{ code: 'G4258A1', sizeName: 'Reverse Deusch Body', length: 0, width: 0, height: 0, price: 2150, sku: 'G4258A1' }] },
  { category: 'Concealed Bodies', name: 'Concealed Wall Mounted Basin Tap Body', variants: [{ code: 'G2797A1', sizeName: 'Single Water Body', length: 0, width: 0, height: 0, price: 2000, sku: 'G2797A1' }] },
  { category: 'Concealed Bodies', name: 'Concealed Body of Flush Cock (Universal)', variants: [{ code: 'T9823A1', sizeName: 'Universal Flush Cock Body', length: 0, width: 0, height: 0, price: 2000, sku: 'T9823A1' }] },
  { category: 'Concealed Bodies', name: 'Concealed Stop Cock Body (1/2")', variants: [{ code: 'G5052A1', sizeName: '1/2 inch Body', length: 0, width: 0, height: 0, price: 1500, sku: 'G5052A1' }] },
  { category: 'Concealed Bodies', name: 'Concealed Stop Cock Body (3/4")', variants: [{ code: 'G5053A1', sizeName: '3/4 inch Body', length: 0, width: 0, height: 0, price: 1500, sku: 'G5053A1' }] },

  // CATEGORY 20: HAND SHOWERS COLLECTION
  { category: 'Hand Showers Collection', name: '3 Modes Hand Shower 120mm (T9859A1)', variants: [{ code: 'T9859A1', sizeName: 'Chrome Finish', length: 120, width: 0, height: 0, price: 3300, sku: 'T9859A1' }] },
  { category: 'Hand Showers Collection', name: 'Galaxy 3 Flow Hand Shower Black', variants: [{ code: 'T98987C', sizeName: 'Black (Rain/Mist/Rain+Mist)', length: 264, width: 102, height: 0, price: 3200, sku: 'T98987C' }] },
  { category: 'Hand Showers Collection', name: 'Multiflow Hand Shower 100mm', variants: [{ code: 'T9983A1', sizeName: '100mm', length: 100, width: 0, height: 0, price: 2850, sku: 'T9983A1' }] },
  { category: 'Hand Showers Collection', name: 'Airmix Hand Shower 100mm', variants: [{ code: 'T9819A1', sizeName: 'Chrome Finish', length: 100, width: 0, height: 0, price: 2850, sku: 'T9819A1' }] },
  { category: 'Hand Showers Collection', name: 'Multiflow Hand Shower 80mm', variants: [{ code: 'T9982A1', sizeName: 'Chrome Finish', length: 80, width: 0, height: 0, price: 2650, sku: 'T9982A1' }] },
  { category: 'Hand Showers Collection', name: '3 Modes Hand Shower 105mm', variants: [{ code: 'T9865A1', sizeName: 'Chrome Finish', length: 105, width: 0, height: 0, price: 2600, sku: 'T9865A1' }] },
  { category: 'Hand Showers Collection', name: 'Single Flow Hand Shower 80mm', variants: [{ code: 'T9981A1', sizeName: 'Normal Rain Flow', length: 80, width: 0, height: 0, price: 2500, sku: 'T9981A1' }] },
  { category: 'Hand Showers Collection', name: '3 Modes Hand Shower 120mm (T9862A1)', variants: [{ code: 'T9862A1', sizeName: '120mm', length: 120, width: 0, height: 0, price: 2450, sku: 'T9862A1' }] },
  { category: 'Hand Showers Collection', name: '4 Modes Hand Shower 105mm', variants: [{ code: 'T9863A1', sizeName: 'Chrome Finish', length: 105, width: 0, height: 0, price: 2450, sku: 'T9863A1' }] },
  { category: 'Hand Showers Collection', name: 'Easy Cleaning Hand Shower', variants: [{ code: 'T9025A1', sizeName: 'Rain Flow Chrome', length: 0, width: 0, height: 0, price: 2150, sku: 'T9025A1' }] },
  { category: 'Hand Showers Collection', name: 'Easy Cleaning Hand Shower 100mm', variants: [{ code: 'T9870A1', sizeName: 'Rain Flow Chrome', length: 100, width: 0, height: 0, price: 1900, sku: 'T9870A1' }] },
  { category: 'Hand Showers Collection', name: '2 Modes Hand Shower 110mm', variants: [{ code: 'T9872A1', sizeName: '110mm', length: 110, width: 0, height: 0, price: 1900, sku: 'T9872A1' }] },
  { category: 'Hand Showers Collection', name: 'Single Flow Hand Shower (E8376A1)', variants: [{ code: 'E8376A1', sizeName: 'Rain Flow Chrome', length: 0, width: 0, height: 0, price: 1750, sku: 'E8376A1' }] },
  { category: 'Hand Showers Collection', name: 'Single Flow Hand Shower 80mm (T9902A1)', variants: [{ code: 'T9902A1', sizeName: 'Rain Flow Chrome', length: 80, width: 0, height: 0, price: 1750, sku: 'T9902A1' }] },
  { category: 'Hand Showers Collection', name: '3 Modes Hand Shower 120mm (T9866A1)', variants: [{ code: 'T9866A1', sizeName: '120mm', length: 120, width: 0, height: 0, price: 1500, sku: 'T9866A1' }] },
  { category: 'Hand Showers Collection', name: 'Opera Stick Hand Shower', variants: [{ code: 'T9701A1', sizeName: 'Rain Flow', length: 0, width: 0, height: 0, price: 1450, sku: 'T9701A1' }] },
  { category: 'Hand Showers Collection', name: 'Sinatra Stick Hand Shower 30mm', variants: [{ code: 'T9946A1', sizeName: 'Rain Flow', length: 30, width: 0, height: 0, price: 1400, sku: 'T9946A1' }] },
  { category: 'Hand Showers Collection', name: 'Comfort Hand Shower 80mm', variants: [{ code: 'T9871A1', sizeName: 'Rain Flow', length: 80, width: 0, height: 0, price: 900, sku: 'T9871A1' }] },

  // CATEGORY 21: HEALTH FAUCET COLLECTION
  { category: 'Health Faucet Collection', name: 'Cardiff Health Faucet Brass', variants: [{ code: 'T9941A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 2650, sku: 'T9941A1' }] },
  { category: 'Health Faucet Collection', name: 'Crust Health Faucet', variants: [{ code: 'E8342A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1950, sku: 'E8342A1' }] },
  { category: 'Health Faucet Collection', name: 'Euclid Plus Health Faucet', variants: [{ code: 'T9355A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1600, sku: 'T9355A1' }] },
  { category: 'Health Faucet Collection', name: 'Slimline Easy Cleaning Health Faucet', variants: [{ code: 'E8354A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1300, sku: 'E8354A1' }] },
  { category: 'Health Faucet Collection', name: 'Praseo Health Faucet', variants: [{ code: 'T9920A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1200, sku: 'T9920A1' }] },
  { category: 'Health Faucet Collection', name: 'Quattro Health Faucet', variants: [{ code: 'T9896A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1200, sku: 'T9896A1' }] },
  { category: 'Health Faucet Collection', name: 'Primo Health Faucet', variants: [{ code: 'E8383A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1150, sku: 'E8383A1' }] },
  { category: 'Health Faucet Collection', name: 'Pluto Health Faucet', variants: [{ code: 'E8384A1', sizeName: 'Satin / Chrome', length: 0, width: 0, height: 0, price: 1150, sku: 'E8384A1' }] },
  { category: 'Health Faucet Collection', name: 'Splash Health Faucet', variants: [{ code: 'T9805A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1050, sku: 'T9805A1' }] },
  { category: 'Health Faucet Collection', name: 'Uno Health Faucet', variants: [{ code: 'T9921A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1050, sku: 'T9921A1' }] },
  { category: 'Health Faucet Collection', name: 'Coral Neo Health Faucet', variants: [{ code: 'E8353A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 1000, sku: 'E8353A1' }] },
  { category: 'Health Faucet Collection', name: 'Ovalo Plus Anti Microbial Health Faucet', variants: [{ code: 'E8372A1', sizeName: 'With Hose & Hook', length: 0, width: 0, height: 0, price: 970, sku: 'E8372A1' }] },

  // CATEGORY 22: BOTTLE TRAPS
  { category: 'Bottle Traps', name: 'Bottle Trap - Light 9"', variants: [{ code: 'T3201A1', sizeName: '9 inch Light', length: 0, width: 0, height: 0, price: 2100, sku: 'T3201A1' }] },
  { category: 'Bottle Traps', name: 'Bottle Trap - Heavy 9"', variants: [{ code: 'T3202A1', sizeName: '9 inch Heavy', length: 0, width: 0, height: 0, price: 2700, sku: 'T3202A1' }] },
  { category: 'Bottle Traps', name: 'Bottle Trap - Light 12" Vertical Pipe', variants: [{ code: 'T3203A1', sizeName: '12 inch Vertical', length: 0, width: 0, height: 0, price: 2400, sku: 'T3203A1' }] },
  { category: 'Bottle Traps', name: 'Bottle Trap - Light 12" Horizontal Pipe', variants: [{ code: 'T3205A1', sizeName: '12 inch Horizontal', length: 0, width: 0, height: 0, price: 2400, sku: 'T3205A1' }] },

  // CATEGORY 23: CONNECTION HOSE
  {
    category: 'Connection Hose',
    name: 'SS Braided Hose Pipe 1.5ft',
    variants: [
      { code: 'T754099', sizeName: 'Per Pair (1.5ft)', length: 0, width: 0, height: 0, price: 420, sku: 'T754099' },
      { code: 'T989099', sizeName: 'Pack of 10 Pairs (1.5ft)', length: 0, width: 0, height: 0, price: 3850, sku: 'T989099' },
    ],
  },
  {
    category: 'Connection Hose',
    name: 'SS Braided Hose Pipe 2.0ft',
    variants: [
      { code: 'T754199', sizeName: 'Per Pair (2.0ft)', length: 0, width: 0, height: 0, price: 470, sku: 'T754199' },
      { code: 'T989199', sizeName: 'Pack of 10 Pairs (2.0ft)', length: 0, width: 0, height: 0, price: 4300, sku: 'T989199' },
    ],
  },
  {
    category: 'Connection Hose',
    name: 'Connection PVC Hose 1.5ft (Milky White)',
    variants: [
      { code: 'T991299', sizeName: 'Single Hose (1.5ft)', length: 0, width: 0, height: 0, price: 185, sku: 'T991299' },
      { code: 'T988899', sizeName: 'Pack of 20 (1.5ft)', length: 0, width: 0, height: 0, price: 3150, sku: 'T988899' },
    ],
  },
  {
    category: 'Connection Hose',
    name: 'Connection PVC Hose 2.0ft (Milky White)',
    variants: [
      { code: 'T991999', sizeName: 'Single Hose (2.0ft)', length: 0, width: 0, height: 0, price: 195, sku: 'T991999' },
      { code: 'T988999', sizeName: 'Pack of 20 (2.0ft)', length: 0, width: 0, height: 0, price: 3550, sku: 'T988999' },
    ],
  },

  // CATEGORY 24: WASTE COUPLING
  { category: 'Waste Coupling', name: 'Full Thread Waste Coupling-80mm', variants: [{ code: 'T9899A1', sizeName: '80mm Full Thread', length: 80, width: 0, height: 0, price: 570, sku: 'T9899A1' }] },
  { category: 'Waste Coupling', name: 'Full Thread Waste Coupling-130mm', variants: [{ code: 'T9898A1', sizeName: '130mm Full Thread', length: 130, width: 0, height: 0, price: 900, sku: 'T9898A1' }] },
  { category: 'Waste Coupling', name: 'Half Thread Waste Coupling', variants: [{ code: 'T9910A1', sizeName: 'Half Thread', length: 0, width: 0, height: 0, price: 800, sku: 'T9910A1' }] },
];

async function seed() {
  console.log('--- STARTING PARRYWARE SANITARYWARE SEEDING ---');

  // 1. Delete dependent records first
  console.log('Clearing dependent tables: inquiry_items, order_items, product_images, variants...');
  await supabase.from('inquiry_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Clearing mattresses & materials...');
  await supabase.from('mattresses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Extract unique categories and insert into materials table
  const categoryNames = Array.from(new Set(CATALOG_DATA.map((p) => p.category)));
  console.log(`Inserting ${categoryNames.length} categories into materials table...`);

  const categoryMap = new Map<string, string>();
  for (const catName of categoryNames) {
    const { data, error } = await supabase.from('materials').insert({ name: catName }).select().single();
    if (error || !data) {
      console.error(`Error inserting category "${catName}":`, error);
      process.exit(1);
    }
    categoryMap.set(catName, data.id);
  }

  // 3. Insert products (mattresses table) and variants & images
  console.log(`Inserting ${CATALOG_DATA.length} products into mattresses table...`);
  const categoryCounts = new Map<string, number>();

  for (const prod of CATALOG_DATA) {
    const materialId = categoryMap.get(prod.category)!;
    const { data: mData, error: mErr } = await supabase
      .from('mattresses')
      .insert({
        material_id: materialId,
        name: prod.name,
        description: prod.description || `${prod.name} from the official Parryware Sanitaryware collection.`,
        warranty_years: 10,
        is_active: true,
      })
      .select()
      .single();

    if (mErr || !mData) {
      console.error(`Error inserting product "${prod.name}":`, mErr);
      continue;
    }

    // Insert Image Placeholder
    await supabase.from('product_images').insert({
      mattress_id: mData.id,
      image_url: SVG_PLACEHOLDER,
      is_primary: true,
      sort_order: 1,
    });

    // Insert Variants
    for (const v of prod.variants) {
      await supabase.from('variants').insert({
        mattress_id: mData.id,
        size_name: v.sizeName || v.code,
        length: v.length || 0,
        width: v.width || 0,
        height: v.height || 0,
        price: v.price,
        stock: 50,
        sku: v.sku || `${v.code}-${Math.floor(Math.random() * 1000)}`,
      });
    }

    categoryCounts.set(prod.category, (categoryCounts.get(prod.category) || 0) + 1);
  }

  console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
  console.log('Per-Category Item Count Breakdown:');
  for (const [cat, count] of categoryCounts.entries()) {
    console.log(`  - ${cat}: ${count} product(s)`);
  }
}

seed().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
