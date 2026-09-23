export const CATS: {
  slug: string;
  nameFr: string;
  description?: string;
  parentSlug?: string;
  deck?: number;
  img?: string | null;
  sortOrder?: number;
}[] = [
  // ===== Top-level categories =====
  { slug: "ordinateur", nameFr: "Ordinateur", deck: 1, sortOrder: 1, img: "https://pngimg.com/uploads/laptop/laptop_PNG5912.png", description: "PC portables, PC de bureau, tout-en-un, moniteurs, tablettes et serveurs." },
  { slug: "imprimante", nameFr: "Imprimante", deck: 1, sortOrder: 2, img: "https://pngimg.com/uploads/printer/printer_PNG7919.png", description: "Copieurs, scanners, traceurs, imprimantes codes-barres, badges, matricielles, consommables et fax." },
  { slug: "point-de-vente", nameFr: "Point de vente", deck: 1, sortOrder: 3, img: "https://pngimg.com/uploads/printer/printer_PNG7907.png", description: "Imprimantes tickets, tiroirs caisse, lecteurs codes-barres, afficheurs, écrans tactiles et packs." },
  { slug: "peripherique", nameFr: "Périphérique", deck: 1, sortOrder: 4, img: "https://pngimg.com/uploads/monitor/monitor_PNG8999.png", description: "Moniteurs, écrans TV LED, claviers, souris, câbles, casques, onduleurs et accessoires." },
  { slug: "projection", nameFr: "Projection", deck: 1, sortOrder: 5, img: "https://pngimg.com/uploads/projector/projector_PNG65.png", description: "Vidéoprojecteurs, écrans de projection, supports, écrans interactifs et visioconférence." },
  { slug: "reseau", nameFr: "Réseau", deck: 1, sortOrder: 6, img: "https://pngimg.com/uploads/router/router_PNG8019.png", description: "Switchs, points d'accès, routeurs, CPL, contrôleurs Wi-Fi, CPE, PoE et fibre." },
  { slug: "telephonie", nameFr: "Téléphonie", deck: 1, sortOrder: 7, img: "https://pngimg.com/uploads/phone/phone_PNG49056.png", description: "Téléphones filaires/sans fil, standards, passerelles et Talkie-Walkie." },
  { slug: "connectique", nameFr: "Connectique", deck: 1, sortOrder: 8, img: "https://pngimg.com/uploads/keyboard/keyboard_PNG5839.png", description: "Câbles HDMI/VGA/USB/DisplayPort, convertisseurs, hubs, KVM et cordons." },
  { slug: "gaming", nameFr: "Gaming", deck: 1, sortOrder: 9, img: "https://pngimg.com/uploads/keyboard/keyboard_PNG5839.png", description: "PC gamer, sièges, moniteurs et périphériques gaming." },

  // ===== Ordinateur =====
  { slug: "pc-portable", nameFr: "PC portable", parentSlug: "ordinateur", sortOrder: 1 },
  { slug: "pc-bureau", nameFr: "PC de bureau", parentSlug: "ordinateur", sortOrder: 2 },
  { slug: "all-in-one", nameFr: "Tout-en-un", parentSlug: "ordinateur", sortOrder: 3 },
  { slug: "ordinateur-moniteur", nameFr: "Moniteur", parentSlug: "ordinateur", sortOrder: 4 },
  { slug: "tablette", nameFr: "Tablette", parentSlug: "ordinateur", sortOrder: 5 },
  { slug: "ordinateur-serveur", nameFr: "Serveur", parentSlug: "ordinateur", sortOrder: 6 },

  // ===== Imprimante =====
  { slug: "copieur", nameFr: "Copieur", parentSlug: "imprimante", sortOrder: 1 },
  { slug: "scanner", nameFr: "Scanner", parentSlug: "imprimante", sortOrder: 2 },
  { slug: "traceur", nameFr: "Traceur", parentSlug: "imprimante", sortOrder: 3 },
  { slug: "imprimante-code-a-barre", nameFr: "Imprimante code à barre", parentSlug: "imprimante", sortOrder: 4 },
  { slug: "imprimante-badge", nameFr: "Imprimante badge", parentSlug: "imprimante", sortOrder: 5 },
  { slug: "matriciel", nameFr: "Imprimante matricielle", parentSlug: "imprimante", sortOrder: 6 },
  { slug: "imprimante-consommable", nameFr: "Consommable", parentSlug: "imprimante", sortOrder: 7 },
  { slug: "fax", nameFr: "Fax", parentSlug: "imprimante", sortOrder: 8 },

  // ===== Point de vente =====
  { slug: "imprimante-ticket", nameFr: "Imprimante ticket", parentSlug: "point-de-vente", sortOrder: 1 },
  { slug: "tiroir-caisse", nameFr: "Tiroir caisse", parentSlug: "point-de-vente", sortOrder: 2 },
  { slug: "lecteur-code-barre", nameFr: "Lecteur code barre", parentSlug: "point-de-vente", sortOrder: 3 },
  { slug: "afficheur", nameFr: "Afficheur", parentSlug: "point-de-vente", sortOrder: 4 },
  { slug: "ecran-tactile", nameFr: "Écran tactile", parentSlug: "point-de-vente", sortOrder: 5 },
  { slug: "pack", nameFr: "Pack caisse", parentSlug: "point-de-vente", sortOrder: 6 },
  { slug: "point-de-vente-consommable", nameFr: "Consommable", parentSlug: "point-de-vente", sortOrder: 7 },

  // ===== Périphérique =====
  { slug: "peripherique-moniteur", nameFr: "Moniteur", parentSlug: "peripherique", sortOrder: 1 },
  { slug: "ecran-tv-led", nameFr: "Écran TV LED", parentSlug: "peripherique", sortOrder: 2 },
  { slug: "clavier", nameFr: "Clavier", parentSlug: "peripherique", sortOrder: 3 },
  { slug: "souris", nameFr: "Souris", parentSlug: "peripherique", sortOrder: 4 },
  { slug: "cable", nameFr: "Câble", parentSlug: "peripherique", sortOrder: 5 },
  { slug: "casque", nameFr: "Casque", parentSlug: "peripherique", sortOrder: 6 },
  { slug: "pile", nameFr: "Pile", parentSlug: "peripherique", sortOrder: 7 },
  { slug: "sockage", nameFr: "Stockage", parentSlug: "peripherique", sortOrder: 8 },
  { slug: "bagagrie", nameFr: "Bagagerie", parentSlug: "peripherique", sortOrder: 9 },
  { slug: "multiprise", nameFr: "Multiprise", parentSlug: "peripherique", sortOrder: 10 },
  { slug: "onduleur", nameFr: "Onduleur", parentSlug: "peripherique", sortOrder: 11 },
  { slug: "stabilisateur", nameFr: "Stabilisateur", parentSlug: "peripherique", sortOrder: 12 },
  { slug: "support-moniteur", nameFr: "Support moniteur", parentSlug: "peripherique", sortOrder: 13 },
  { slug: "destructeur-papier", nameFr: "Destructeur de papier", parentSlug: "peripherique", sortOrder: 14 },

  // ===== Projection =====
  { slug: "videoprojecteur", nameFr: "Vidéoprojecteur", parentSlug: "projection", sortOrder: 1 },
  { slug: "ecran-projection", nameFr: "Écran de projection", parentSlug: "projection", sortOrder: 2 },
  { slug: "support-de-fixation", nameFr: "Support de fixation", parentSlug: "projection", sortOrder: 3 },
  { slug: "ecran-interactive", nameFr: "Écran interactif", parentSlug: "projection", sortOrder: 4 },
  { slug: "pointeur-laser-visioconference", nameFr: "Pointeur laser & visioconférence", parentSlug: "projection", sortOrder: 5 },
  { slug: "solution-d-affichage", nameFr: "Solution d'affichage", parentSlug: "projection", sortOrder: 6 },

  // ===== Réseau =====
  { slug: "switch", nameFr: "Switch", parentSlug: "reseau", sortOrder: 1 },
  { slug: "point-d-acce", nameFr: "Point d'accès", parentSlug: "reseau", sortOrder: 2 },
  { slug: "routeur", nameFr: "Routeur", parentSlug: "reseau", sortOrder: 3 },
  { slug: "cpl", nameFr: "CPL", parentSlug: "reseau", sortOrder: 4 },
  { slug: "controleur-wifi", nameFr: "Contrôleur Wi-Fi", parentSlug: "reseau", sortOrder: 5 },
  { slug: "cpe", nameFr: "CPE", parentSlug: "reseau", sortOrder: 6 },
  { slug: "injecteur-poe", nameFr: "Injecteur PoE", parentSlug: "reseau", sortOrder: 7 },
  { slug: "module-et-convertisseur-fibre", nameFr: "Module & convertisseur fibre", parentSlug: "reseau", sortOrder: 8 },
  { slug: "cle-bleutouth", nameFr: "Clé Bluetooth", parentSlug: "reseau", sortOrder: 9 },

  // ===== Téléphonie =====
  { slug: "telephone-fil", nameFr: "Téléphone filaire", parentSlug: "telephonie", sortOrder: 1 },
  { slug: "telephone-sans-fil", nameFr: "Téléphone sans fil", parentSlug: "telephonie", sortOrder: 2 },
  { slug: "standard-analogique", nameFr: "Standard analogique", parentSlug: "telephonie", sortOrder: 3 },
  { slug: "standard-ip", nameFr: "Standard IP", parentSlug: "telephonie", sortOrder: 4 },
  { slug: "passerelle", nameFr: "Passerelle", parentSlug: "telephonie", sortOrder: 5 },
  { slug: "telephonie-ip", nameFr: "Téléphonie IP", parentSlug: "telephonie", sortOrder: 6 },
  { slug: "talkie-walkie", nameFr: "Talkie-Walkie", parentSlug: "telephonie", sortOrder: 7 },

  // ===== Connectique =====
  { slug: "cable-hdmi", nameFr: "Câble HDMI", parentSlug: "connectique", sortOrder: 1 },
  { slug: "cable-vga", nameFr: "Câble VGA", parentSlug: "connectique", sortOrder: 2 },
  { slug: "cable-usb", nameFr: "Câble USB", parentSlug: "connectique", sortOrder: 3 },
  { slug: "cable-display-port", nameFr: "Câble DisplayPort", parentSlug: "connectique", sortOrder: 4 },
  { slug: "convertisseur", nameFr: "Convertisseur", parentSlug: "connectique", sortOrder: 5 },
  { slug: "hub-usb", nameFr: "Hub USB", parentSlug: "connectique", sortOrder: 6 },
  { slug: "kvm", nameFr: "KVM", parentSlug: "connectique", sortOrder: 7 },
  { slug: "cable-antivol", nameFr: "Câble antivol", parentSlug: "connectique", sortOrder: 8 },
  { slug: "cordon-reseau", nameFr: "Cordon réseau", parentSlug: "connectique", sortOrder: 9 },
  { slug: "cordon-telephonique", nameFr: "Cordon téléphonique", parentSlug: "connectique", sortOrder: 10 },

  // ===== Gaming =====
  { slug: "gaming-pc-bureau", nameFr: "PC de bureau", parentSlug: "gaming", sortOrder: 1 },
  { slug: "gaming-pc-portable", nameFr: "PC portable", parentSlug: "gaming", sortOrder: 2 },
  { slug: "gaming-moniteur", nameFr: "Moniteur", parentSlug: "gaming", sortOrder: 3 },
  { slug: "gaming-chaise", nameFr: "Chaise gaming", parentSlug: "gaming", sortOrder: 4 },
  { slug: "gaming-peripherique", nameFr: "Périphérique", parentSlug: "gaming", sortOrder: 5 },
];

export const BRANDS = [
  { slug: "acer", name: "Acer", logo: "https://cdn.simpleicons.org/acer/83B81A" },
  { slug: "aoc", name: "AOC", logo: "https://cdn.simpleicons.org/aoc/FF0000" },
  { slug: "asus", name: "Asus", logo: "https://cdn.simpleicons.org/asus/00529C" },
  { slug: "baseus", name: "Baseus", logo: "https://cdn.simpleicons.org/baseus/000000" },
  { slug: "brother", name: "Brother", logo: "https://cdn.simpleicons.org/brother/000000" },
  { slug: "canon", name: "Canon", logo: "https://cdn.simpleicons.org/canon/BC002D" },
  { slug: "corsair", name: "Corsair", logo: "https://cdn.simpleicons.org/corsair/F5C518" },
  { slug: "dlink", name: "D-Link", logo: "https://cdn.simpleicons.org/dlink/0066B3" },
  { slug: "dell", name: "Dell", logo: "https://cdn.simpleicons.org/dell/007DB8" },
  { slug: "epson", name: "Epson", logo: "https://cdn.simpleicons.org/epson/003399" },
  { slug: "gigabyte", name: "Gigabyte", logo: "https://cdn.simpleicons.org/gigabyte/F2930C" },
  { slug: "google", name: "Google", logo: "https://cdn.simpleicons.org/google/4285F4" },
  { slug: "hp", name: "HP", logo: "https://cdn.simpleicons.org/hp/0096D6" },
  { slug: "huawei", name: "Huawei", logo: "https://cdn.simpleicons.org/huawei/FF0000" },
  { slug: "intel", name: "Intel", logo: "https://cdn.simpleicons.org/intel/0071C5" },
  { slug: "jbl", name: "JBL", logo: "https://cdn.simpleicons.org/jbl/FF6600" },
  { slug: "kingston", name: "Kingston", logo: "https://cdn.simpleicons.org/kingston/E60012" },
  { slug: "lenovo", name: "Lenovo", logo: "https://cdn.simpleicons.org/lenovo/E2231A" },
  { slug: "logitech", name: "Logitech", logo: "https://cdn.simpleicons.org/logitech/00B8FC" },
  { slug: "microsoft", name: "Microsoft", logo: "https://cdn.simpleicons.org/microsoft/5E5E5E" },
  { slug: "msi", name: "MSI", logo: "https://cdn.simpleicons.org/msi/FF0000" },
  { slug: "nvidia", name: "Nvidia", logo: "https://cdn.simpleicons.org/nvidia/76B900" },
  { slug: "philips", name: "Philips", logo: "https://cdn.simpleicons.org/philips/0B5ED7" },
  { slug: "samsung", name: "Samsung", logo: "https://cdn.simpleicons.org/samsung/1428A0" },
  { slug: "sandisk", name: "SanDisk", logo: "https://cdn.simpleicons.org/sandisk/EB1C26" },
  { slug: "seagate", name: "Seagate", logo: "https://cdn.simpleicons.org/seagate/6CBBE0" },
  { slug: "sony", name: "Sony", logo: "https://cdn.simpleicons.org/sony/000000" },
  { slug: "tplink", name: "TP-Link", logo: "https://cdn.simpleicons.org/tp-link/4ACBD6" },
  { slug: "westerndigital", name: "Western Digital", logo: "https://cdn.simpleicons.org/westerndigital/005DAA" },
  { slug: "xerox", name: "Xerox", logo: "https://cdn.simpleicons.org/xerox/E31937" },
  { slug: "xiaomi", name: "Xiaomi", logo: "https://cdn.simpleicons.org/xiaomi/FF6900" },
  { slug: "apple", name: "Apple", logo: "https://cdn.simpleicons.org/apple/000000" },
  { slug: "amd", name: "AMD", logo: "https://cdn.simpleicons.org/amd/ED1C24" },
];

function leafImage(parent?: string): string {
  switch (parent) {
    case "ordinateur": return "https://pngimg.com/uploads/laptop/laptop_PNG5912.png";
    case "imprimante": return "https://pngimg.com/uploads/printer/printer_PNG7919.png";
    case "peripherique": return "https://pngimg.com/uploads/monitor/monitor_PNG8999.png";
    case "reseau": return "https://pngimg.com/uploads/router/router_PNG8019.png";
    case "telephonie": return "https://pngimg.com/uploads/phone/phone_PNG49056.png";
    case "gaming": return "https://pngimg.com/uploads/keyboard/keyboard_PNG5839.png";
    case "point-de-vente": return "https://pngimg.com/uploads/printer/printer_PNG7907.png";
    case "projection": return "https://pngimg.com/uploads/monitor/monitor_PNG8994.png";
    case "connectique": return "https://pngimg.com/uploads/laptop/laptop_PNG5912.png";
    default: return "https://pngimg.com/uploads/laptop/laptop_PNG5912.png";
  }
}

// Generate filler products so category counts look populated like iris.ma.
function genExtras() {
  const out: ReturnType<typeof P>[] = [];
  const leaves = CATS.filter((c) => c.parentSlug);
  const pool = BRANDS.map((b) => b.slug);
  let n = 0;
  for (const leaf of leaves) {
    for (let i = 0; i < 4; i++) {
      const brand = pool[(n + pool.length) % pool.length];
      const slug = `${leaf.slug}-${brand}-${i + 1}`;
      const price = 399 + ((n * 137) % 12000);
      const oldPrice = i === 0 ? price + 200 + (n % 800) : null;
      out.push(
        P(
          slug,
          `${brand.charAt(0).toUpperCase() + brand.slice(1)} ${leaf.nameFr} ${i + 1}`,
          brand,
          leaf.slug,
          price,
          oldPrice,
          leafImage(leaf.parentSlug),
          {
            popularity: 40 + (n % 60),
            stock: 5 + (n % 20),
            isNew: i % 3 === 0,
            featured: i === 0,
          },
        ),
      );
      n++;
    }
  }
  return out;
}

// ALL_PRODUCTS is defined after PRODUCTS below.

const P = (
  slug: string, name: string, brandSlug: string | null, categorySlug: string,
  price: number, oldPrice: number | null, img: string,
  opts: Partial<{ sku: string; taglineFr: string; descriptionFr: string; specs: [string, string][]; featured: boolean; isNew: boolean; popularity: number; stock: number; warrantyMonths: number }> = {},
) => ({
  slug,
  nameFr: name,
  brandSlug,
  categorySlug,
  price,
  oldPrice,
  discount: oldPrice ? Math.round((1 - price / oldPrice) * 100) : null,
  img,
  sku: opts.sku ?? slug.toUpperCase().replace(/-/g, "-"),
  summaryFr: opts.taglineFr ?? null,
  descriptionFr: opts.descriptionFr ?? null,
  specs: opts.specs ? JSON.stringify(opts.specs.map(([k, v]) => ({ k, v }))) : null,
  featured: opts.featured ?? false,
  isNew: opts.isNew ?? false,
  popularity: opts.popularity ?? 50,
  stock: opts.stock ?? 10,
  warrantyMonths: opts.warrantyMonths ?? 12,
});

const LAPTOP = "https://pngimg.com/uploads/laptop/";

export const PRODUCTS = [
  P("acer-nitro-v16", "Acer Nitro V16", "acer", "pc-portable", 13999, 15499, LAPTOP + "laptop_PNG5912.png", {
    featured: true, isNew: true, popularity: 95, stock: 7,
    taglineFr: "Le laptop gaming ultime pour dominer chaque session.",
    descriptionFr: "Le PC portable Acer Nitro V16 est l'outil ultime pour les passionnés de jeux vidéo et les professionnels exigeants. Il intègre des composants de dernière génération pour garantir une fluidité exceptionnelle lors de vos sessions de gaming intenses ou de vos tâches créatives complexes. Son système de refroidissement optimisé maintient des performances stables même sous forte charge. Chez PC Jahiz : livraison rapide partout au Maroc, paiement à la livraison et garantie 12 mois.",
    specs: [["Écran", "16\" FHD+ 165 Hz"], ["Processeur", "Intel Core i7 / Ryzen 7"], ["Carte graphique", "NVIDIA GeForce RTX"], ["RAM", "16 Go DDR5"], ["Stockage", "512 Go SSD NVMe"], ["Clavier", "Rétroéclairé RGB AZERTY"]],
  }),
  P("acer-aspire-5", "Acer Aspire 5", "acer", "pc-portable", 6799, 7499, LAPTOP + "laptop_PNG5909.png", {
    isNew: true, popularity: 80, stock: 12,
    taglineFr: "L'essentiel du quotidien, fiable et abordable.",
    descriptionFr: "L'Acer Aspire 5 est le compagnon idéal pour le travail, les études et le divertissement. Fin, léger et réactif, il embarque un écran lumineux et une autonomie longue durée. Disponible chez PC Jahiz avec livraison 24–48h partout au Maroc et paiement à la livraison.",
    specs: [["Écran", "15.6\" FHD IPS"], ["Processeur", "Intel Core i5"], ["RAM", "8 Go"], ["Stockage", "512 Go SSD"], ["Poids", "1.7 kg"]],
  }),
  P("msi-modern-14", "MSI Modern 14", "msi", "pc-portable", 6499, null, LAPTOP + "laptop_PNG5906.png", {
    popularity: 70, stock: 9,
    taglineFr: "Élégance nomade, puissance discrète.",
    descriptionFr: "Le MSI Modern 14 allie portabilité et performance pour les créateurs et professionnels en déplacement. Châssis fin, écran précis et réactivité remarquable au quotidien.",
    specs: [["Écran", "14\" FHD IPS"], ["Processeur", "Intel Core i5 / Ryzen 5"], ["RAM", "16 Go"], ["Stockage", "512 Go SSD"], ["Poids", "1.4 kg"]],
  }),
  P("msi-katana-gf63", "MSI Katana GF63", "msi", "pc-portable", 12999, 14499, LAPTOP + "laptop_PNG5903.png", {
    isNew: true, popularity: 85, stock: 6,
    taglineFr: "La lame du gaming, affûtée pour la victoire.",
    descriptionFr: "La MSI Katana GF63 est taillée pour le gaming : GPU dédié, écran haute fréquence et refroidissement musclé. Une machine de guerre au prix juste, livrée partout au Maroc par PC Jahiz.",
    specs: [["Écran", "15.6\" FHD 144 Hz"], ["Carte graphique", "NVIDIA GeForce RTX"], ["RAM", "16 Go"], ["Stockage", "512 Go SSD NVMe"]],
  }),
  P("asus-rog-strix", "Asus ROG Strix G16", "asus", "gaming", 21999, 24999, LAPTOP + "laptop_PNG5900.png", {
    featured: true, popularity: 98, stock: 4,
    taglineFr: "Le vaisseau amiral du gaming. Rien d'autre ne compte.",
    descriptionFr: "L'Asus ROG Strix G16 est le sommet de la chaîne alimentaire gaming : écran 165 Hz, RTX dernière génération, châssis RGB agressif et refroidissement Tri-Fan. Pour les joueurs qui refusent tout compromis.",
    specs: [["Écran", "16\" QHD+ 165 Hz"], ["Carte graphique", "NVIDIA GeForce RTX 40"], ["RAM", "16 Go DDR5"], ["Stockage", "1 To SSD NVMe"], ["Éclairage", "Aura Sync RGB"]],
  }),
  P("asus-vivobook-15", "Asus Vivobook 15", "asus", "pc-portable", 6999, null, LAPTOP + "laptop_PNG101835.png", {
    popularity: 75, stock: 14,
    taglineFr: "Le polyvalent qui ne recule devant rien.",
    descriptionFr: "L'Asus Vivobook 15 est le laptop de tous les jours par excellence : performant, stylé et abordable. Parfait pour le télétravail, les cours et le streaming.",
    specs: [["Écran", "15.6\" FHD"], ["Processeur", "Intel Core i5"], ["RAM", "8 Go"], ["Stockage", "512 Go SSD"]],
  }),
  P("dell-xps-13", "Dell XPS 13", "dell", "pc-portable", 16999, 18999, LAPTOP + "laptop_PNG101832.png", {
    featured: true, popularity: 90, stock: 5,
    taglineFr: "Le luxe technologique à l'état pur.",
    descriptionFr: "Le Dell XPS 13 est la référence absolue des ultrabooks : écran InfinityEdge quasi sans bords, châssis en aluminium usiné et autonomie marathon. L'outil des dirigeants et des créatifs exigeants.",
    specs: [["Écran", "13.4\" FHD+ InfinityEdge"], ["Processeur", "Intel Core i7"], ["RAM", "16 Go LPDDR5"], ["Stockage", "512 Go SSD"], ["Châssis", "Aluminium usiné CNC"]],
  }),
  P("dell-inspiron-15", "Dell Inspiron 15", "dell", "pc-portable", 7499, 8299, LAPTOP + "laptop_PNG101829.png", {
    isNew: true, popularity: 72, stock: 11,
    taglineFr: "La fiabilité Dell, au prix du quotidien.",
    descriptionFr: "Le Dell Inspiron 15 offre l'équilibre parfait entre performance et prix pour toute la famille : bureautique, études, divertissement — tout y passe sans effort.",
    specs: [["Écran", "15.6\" FHD"], ["Processeur", "Intel Core i5"], ["RAM", "8 Go"], ["Stockage", "256 Go SSD"]],
  }),
  P("hp-omen-16", "HP Omen 16", "hp", "gaming", 14999, 16999, LAPTOP + "laptop_PNG101826.png", {
    featured: true, popularity: 92, stock: 6,
    taglineFr: "L'ombre qui frappe plus fort que la lumière.",
    descriptionFr: "Le HP Omen 16 combine un design sombre et élégant avec une puissance de jeu dévastatrice. Écran haute fréquence, GPU RTX et Omen Tempest Cooling pour rester glacial sous pression.",
    specs: [["Écran", "16.1\" QHD 165 Hz"], ["Carte graphique", "NVIDIA GeForce RTX"], ["RAM", "16 Go DDR5"], ["Stockage", "1 To SSD"], ["Refroidissement", "Omen Tempest"]],
  }),
  P("hp-pavilion-15", "HP Pavilion 15", "hp", "pc-portable", 7999, 8999, LAPTOP + "laptop_PNG101823.png", {
    popularity: 78, stock: 10,
    taglineFr: "Le classique qui ne déçoit jamais.",
    descriptionFr: "Le HP Pavilion 15 est la valeur sûre : un laptop complet, fiable et élégant pour le travail comme pour les loisirs, avec la qualité de construction HP.",
    specs: [["Écran", "15.6\" FHD IPS"], ["Processeur", "Intel Core i5"], ["RAM", "16 Go"], ["Stockage", "512 Go SSD"]],
  }),
  P("airpods-pro-2", "AirPods Pro 2", "apple", "casque", 2799, 3199, "https://pngimg.com/uploads/airPods/airPods_PNG40.png", {
    featured: true, popularity: 96, stock: 20,
    taglineFr: "Le silence. Puis la musique. Rien d'autre.",
    descriptionFr: "Les AirPods Pro 2 offrent une réduction de bruit active deux fois plus efficace, un son spatial personnalisé et jusqu'à 30 heures d'écoute avec le boîtier MagSafe. L'audio premium dans sa forme la plus pure.",
    specs: [["Réduction de bruit", "Active ×2"], ["Autonomie", "6h + 24h (boîtier)"], ["Puce", "Apple H2"], ["Boîtier", "MagSafe / USB-C"], ["Résistance", "IP54"]],
  }),
  P("macbook-air-m2", "MacBook Air M2", "apple", "pc-portable", 12999, 13999, LAPTOP + "laptop_PNG101820.png", {
    featured: true, popularity: 94, stock: 8,
    taglineFr: "Impossiblement fin. Incroyablement puissant.",
    descriptionFr: "Le MacBook Air M2 redéfinit le portable : puce Apple M2 fulgurante, 18 heures d'autonomie, design sans ventilateur totalement silencieux et écran Liquid Retina sublime.",
    specs: [["Puce", "Apple M2 8 cœurs"], ["Écran", "13.6\" Liquid Retina"], ["RAM", "8 Go unifiée"], ["Stockage", "256 Go SSD"], ["Autonomie", "18 heures"]],
  }),
  P("thinkpad-e14", "Lenovo ThinkPad E14", "lenovo", "pc-portable", 9999, 11499, LAPTOP + "laptop_PNG101808.png", {
    popularity: 82, stock: 9,
    taglineFr: "La légende du business, indestructible.",
    descriptionFr: "Le ThinkPad E14 hérite de 30 ans de fiabilité légendaire : clavier mythique, certification militaire MIL-STD et sécurité renforcée. Le choix des professionnels qui ne plaisantent pas.",
    specs: [["Écran", "14\" FHD+"], ["Processeur", "Intel Core i5 / Ryzen 5"], ["RAM", "16 Go"], ["Stockage", "512 Go SSD"], ["Certification", "MIL-STD-810H"]],
  }),
  P("wh-1000xm5", "Sony WH-1000XM5", "sony", "casque", 3499, 3999, "https://pngimg.com/uploads/headphones/headphones_PNG101983.png", {
    featured: true, popularity: 93, stock: 15,
    taglineFr: "La meilleure réduction de bruit au monde. Point.",
    descriptionFr: "Le Sony WH-1000XM5 est le casque à réduction de bruit de référence : 8 microphones, 30 heures d'autonomie et un son d'une clarté exceptionnelle. Le silence devient un luxe portable.",
    specs: [["Réduction de bruit", "8 micros, double processeur"], ["Autonomie", "30 heures"], ["Audio", "Hi-Res, LDAC"], ["Poids", "250 g"]],
  }),
  P("galaxy-s24", "Samsung Galaxy S24", "samsung", "telephone-sans-fil", 7499, null, "https://pngimg.com/uploads/phone/phone_PNG49056.png", {
    featured: true, isNew: true, popularity: 91, stock: 13,
    taglineFr: "L'IA Galaxy dans la paume de votre main.",
    descriptionFr: "Le Galaxy S24 inaugure l'ère Galaxy AI : traduction en direct, retouche photo par IA et écran Dynamic AMOLED 2X éclatant. Le flagship compact qui pense pour vous.",
    specs: [["Écran", "6.2\" Dynamic AMOLED 2X 120 Hz"], ["Processeur", "Snapdragon 8 Gen 3"], ["Photo", "50 MP triple capteur"], ["Batterie", "4000 mAh"], ["IA", "Galaxy AI"]],
  }),
  P("iphone-15", "iPhone 15", "apple", "telephone-sans-fil", 7999, 8999, "https://pngimg.com/uploads/phone/phone_PNG49059.png", {
    popularity: 89, stock: 11,
    taglineFr: "Dynamic Island. USB-C. Le nouvel iPhone.",
    descriptionFr: "L'iPhone 15 apporte la Dynamic Island, un appareil photo 48 MP époustouflant et l'USB-C enfin universel — le tout propulsé par la puce A16 Bionic.",
    specs: [["Écran", "6.1\" Super Retina XDR"], ["Puce", "A16 Bionic"], ["Photo", "48 MP"], ["Connecteur", "USB-C"], ["Bouton", "Dynamic Island"]],
  }),
  P("epson-ecotank", "Epson EcoTank L3250", "epson", "imprimante", 2799, 3199, "https://pngimg.com/uploads/printer/printer_PNG7919.png", {
    featured: true, isNew: true, popularity: 88, stock: 10,
    taglineFr: "Jusqu'à 3 ans d'encre inclus. Imprimez sans compter.",
    descriptionFr: "L'imprimante Epson EcoTank L3250 élimine les cartouches : 4 flacons d'encre inclus, jusqu'à 4 500 pages en noir et 7 500 en couleur. Wi-Fi, impression, copie et scan pour toute la famille.",
    specs: [["Technologie", "Réservoir d'encre"], ["Autonomie", "4 500 p. noir / 7 500 p. couleur"], ["Connectivité", "Wi-Fi + USB"], ["Fonctions", "Impression / copie / scan"], ["Encre incluse", "4 flacons"]],
  }),
  P("canon-pixma-megatank", "Canon PIXMA G3470", "canon", "imprimante", 2499, 2999, "https://pngimg.com/uploads/printer/printer_PNG7917.png", {
    popularity: 74, stock: 8,
    taglineFr: "Le MegaTank qui rend l'impression économique.",
    descriptionFr: "La Canon PIXMA G3470 avec système MegaTank offre un coût d'impression ultra-réduit. Réservoirs rechargeables, Wi-Fi et impression recto-verso automatique.",
    specs: [["Technologie", "MegaTank"], ["Coût/page", "≈ 0,10 DH"], ["Connectivité", "Wi-Fi + USB"], ["Recto-verso", "Automatique"]],
  }),
  P("brother-hl-l2350dw", "Brother HL-L2350DW", "brother", "imprimante", 1999, null, "https://pngimg.com/uploads/printer/printer_PNG7914.png", {
    popularity: 69, stock: 6,
    taglineFr: "La laser monochrome rapide pour le bureau.",
    descriptionFr: "L'imprimante laser Brother HL-L2350DW imprime 32 pages/minute en monochrome, en Wi-Fi ou Ethernet. Le choix fiable et rapide pour les professionnels.",
    specs: [["Type", "Laser monochrome"], ["Vitesse", "32 ppm"], ["Connectivité", "Wi-Fi + Ethernet + USB"], ["Recto-verso", "Automatique"]],
  }),
  P("hp-deskjet-2820e", "HP DeskJet 2820e", "hp", "imprimante", 1199, 1499, "https://pngimg.com/uploads/printer/printer_PNG7907.png", {
    isNew: true, popularity: 65, stock: 15,
    taglineFr: "La compacte connectée pour la maison.",
    descriptionFr: "L'HP DeskJet 2820e est l'imprimante multifonction compacte idéale pour les étudiants et la maison : Wi-Fi, impression mobile et 3 mois d'encre instantanée HP+ inclus.",
    specs: [["Fonctions", "Impression / copie / scan"], ["Connectivité", "Wi-Fi + HP Smart"], ["Impression mobile", "AirPrint + HP Smart"], ["Encre incluse", "3 mois HP+"]],
  }),
  P("lg-27-inch", "Écran LG 27\" Full HD", "philips", "peripherique-moniteur", 1899, 2299, "https://pngimg.com/uploads/monitor/monitor_PNG8999.png", {
    isNew: true, popularity: 70, stock: 12,
    taglineFr: "27 pouces de clarté pour travailler et jouer.",
    descriptionFr: "Cet écran LG 27\" Full HD IPS offre des couleurs précises, une finesse d'affichage idéale pour la bureautique et un faible dégagement d'énergie.",
    specs: [["Taille", "27\""], ["Définition", "Full HD 1080p"], ["Technologie", "IPS"], ["Fréquence", "75 Hz"], ["Connectique", "HDMI + VGA"]],
  }),
  P("samsung-odyssey-g5", "Samsung Odyssey G5 27\"", "samsung", "peripherique-moniteur", 3999, 4599, "https://pngimg.com/uploads/monitor/monitor_PNG8994.png", {
    featured: true, popularity: 86, stock: 7,
    taglineFr: "Le moniteur gaming incurvé 144 Hz.",
    descriptionFr: "Le Samsung Odyssey G5 27\" incurvé 1000R et 144 Hz plonge le joueur au cœur de l'action. Temps de réponse 1 ms et compatibilité G-Sync pour un gaming fluide.",
    specs: [["Taille", "27\" incurvé 1000R"], ["Définition", "QHD 2560×1440"], ["Fréquence", "144 Hz"], ["Temps de réponse", "1 ms"], ["Technologie", "VA"]],
  }),
  P("logitech-mx-master-3s", "Logitech MX Master 3S", "logitech", "peripherique", 1299, 1599, "https://pngimg.com/uploads/mouse/mouse_PNG9999.png", {
    featured: true, isNew: true, popularity: 90, stock: 18,
    taglineFr: "La souris de référence pour les pros.",
    descriptionFr: "La Logitech MX Master 3S est la souris ultime pour la productivité : défilement MagSpeed, 8 000 DPI silencieux et connexion sur 3 appareils. Jusqu'à 70 jours d'autonomie.",
    specs: [["Capteur", "8 000 DPI"], ["Boutons", "7 programmables"], ["Appareils", "3 (Bolt + BT)"], ["Autonomie", "70 jours USB-C"], ["Silencieux", "Clics silencieux"]],
  }),
  P("logitech-mx-keys", "Logitech MX Keys", "logitech", "peripherique", 1099, null, "https://pngimg.com/uploads/keyboard/keyboard_PNG5839.png", {
    popularity: 77, stock: 14,
    taglineFr: "Le clavier intelligent, confortable et connecté.",
    descriptionFr: "Le clavier Logitech MX Keys offre une frappe fluide et silencieuse, un rétroéclairage intelligent et la connexion à 3 appareils. Pensé pour les longues sessions de travail.",
    specs: [["Type", "Membrane à touches sci."], ["Connectivité", "Bluetooth + Bolt"], ["Rétroéclairage", "Intelligent"], ["Appareils", "3"]],
  }),
  P("tplink-archer-ax55", "TP-Link Archer AX55", "tplink", "reseau", 1099, 1399, "https://pngimg.com/uploads/router/router_PNG8019.png", {
    isNew: true, popularity: 68, stock: 16,
    taglineFr: "Le Wi-Fi 6 pour toute la maison.",
    descriptionFr: "Le routeur TP-Link Archer AX55 délivre le Wi-Fi 6 jusqu'à 3 000 Mbps, couvrant toute la maison. Idéal pour le streaming 4K, le gaming et le télétravail.",
    specs: [["Standard", "Wi-Fi 6 (AX3000)"], ["Débit", "Jusqu'à 3 Gbps"], ["Ports", "4 × Gigabit"], ["Fréquences", "2.4 GHz + 5 GHz"], ["Couverture", "Jusqu'à 200 m²"]],
  }),
  P("westerndigital-sn770", "SSD WD Black SN770 1 To", "westerndigital", "ordinateur", 899, 1199, "https://pngimg.com/uploads/ssd/ssd_PNG8151.png", {
    popularity: 71, stock: 20,
    taglineFr: "Le SSD NVMe qui débloque vos performances.",
    descriptionFr: "Le SSD WD Black SN770 1 To en NVMe Gen4 atteint 5 150 Mo/s en lecture. Idéal pour les joueurs et créateurs qui veulent des temps de chargement instantanés.",
    specs: [["Interface", "NVMe PCIe Gen4"], ["Capacité", "1 To"], ["Lecture", "5 150 Mo/s"], ["Écriture", "4 900 Mo/s"]],
  }),
  P("corsair-k70-rgb", "Corsair K70 RGB", "corsair", "gaming", 1699, 1999, "https://pngimg.com/uploads/keyboard/keyboard_PNG5837.png", {
    popularity: 73, stock: 9,
    taglineFr: "Le clavier mécanique gaming légendaire.",
    descriptionFr: "Le Corsair K70 RGB propose des switchs mécaniques rapides, un châssis en aluminium brossé et un rétroéclairage RGB complet. Le standard des joueurs compétitifs.",
    specs: [["Switchs", "Mécaniques CHERRY"], ["Châssis", "Aluminium brossé"], ["RGB", "Par touche"], ["Rétroéclairage", "iCUE"]],
  }),
];

export const ALL_PRODUCTS = [...PRODUCTS, ...genExtras()];

export const REVIEWS: { slug: string; author: string; city: string; rating: number; comment: string }[] = [
  { slug: "asus-rog-strix", author: "Yassine B.", city: "Casablanca", rating: 5, comment: "Machine de guerre. Livré en 24h à Casa, paiement à la livraison nickel. Les jeux tournent à fond." },
  { slug: "macbook-air-m2", author: "Salma E.", city: "Rabat", rating: 5, comment: "Commandée lundi, reçue mardi. Le MacBook est authentique et le service client sur WhatsApp très réactif." },
  { slug: "wh-1000xm5", author: "Omar T.", city: "Marrakech", rating: 5, comment: "La réduction de bruit est irréelle. Emballage soigné, prix imbattable en DH." },
  { slug: "galaxy-s24", author: "Khadija M.", city: "Tanger", rating: 4, comment: "Super téléphone, livraison rapide. Je retire une étoile car je voulais une autre couleur." },
  { slug: "acer-nitro-v16", author: "Ayoub R.", city: "Fès", rating: 5, comment: "Rapport qualité-prix imbattable pour le gaming. Garantie 12 mois rassurante." },
  { slug: "hp-omen-16", author: "Mehdi K.", city: "Agadir", rating: 5, comment: "Froid même après 4h de jeu. PC Jahiz livre vraiment partout au Maroc, testé à Agadir." },
  { slug: "epson-ecotank", author: "Sara L.", city: "Casablanca", rating: 5, comment: "L'encre incluse dure des mois. Parfaite pour mon petit bureau à la maison." },
  { slug: "logitech-mx-master-3s", author: "Hamza D.", city: "Rabat", rating: 5, comment: "La meilleure souris que j'ai eue. Confort et précision exceptionnels pour le travail." },
];

export const CAMPAIGNS: {
  slug: string;
  type: "hero" | "campaign";
  layout?: "split" | "overlay" | "product-grid";
  eyebrow?: string;
  heading?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  image?: string;
  bgColor?: string;
  badge?: string;
  discountRibbon?: string;
  oldPrice?: number;
  price?: number;
  brandSlug?: string;
  brandLabel?: string;
  brandBadge?: string;
  products?: { image: string; name: string; price?: number; label?: string }[];
  sortOrder: number;
}[] = [
  {
    slug: "bts-pack-lenovo",
    type: "hero",
    layout: "product-grid",
    eyebrow: "Back to school",
    heading: "Le pack Idéal pour la rentrée.",
    description: "PC, antivirus, batterie et accessoires — tout dans un seul carton.",
    ctaLabel: "Voir les packs Lenovo",
    ctaUrl: "/shop?brand=lenovo",
    bgColor: "#f5f5f5",
    brandBadge: "LENOVO",
    oldPrice: 8923,
    price: 8690,
    products: [
      { image: "https://pngimg.com/uploads/laptop/laptop_PNG5912.png", name: "Ideapad Slim 3", price: 5499, label: "PC Portable" },
      { image: "https://pngimg.com/uploads/antivirus/antivirus_PNG22.png", name: "Kaspersky Plus", price: 129, label: "1 an" },
      { image: "https://pngimg.com/uploads/battery/battery_PNG3947.png", name: "Batterie Externe", price: 299, label: "10000 mAh" },
      { image: "https://pngimg.com/uploads/computer_mouse/mouse_PNG7181.png", name: "Souris sans fil", price: 0, label: "Offerte" },
      { image: "https://pngimg.com/uploads/microsoft_office/microsoft_office_PNG60.png", name: "Office Famille", price: 899, label: "Inclus" },
    ],
    sortOrder: 1,
  },
  {
    slug: "macbook-neo-colors",
    type: "hero",
    layout: "product-grid",
    eyebrow: "MacBook Neo",
    heading: "Choisissez votre couleur.",
    description: "Le même prix dans les quatre coloris — Argent, Indigo, Citron et Rose Poudré.",
    ctaLabel: "Voir les 4 coloris",
    ctaUrl: "/shop?brand=apple",
    bgColor: "#ffffff",
    brandBadge: "APPLE",
    oldPrice: 10648,
    price: 10499,
    products: [
      { image: "https://pngimg.com/uploads/laptop/laptop_PNG101820.png", name: "Argent", label: "Coloris" },
      { image: "https://pngimg.com/uploads/laptop/laptop_PNG101820.png", name: "Indigo", label: "Coloris" },
      { image: "https://pngimg.com/uploads/laptop/laptop_PNG101820.png", name: "Citron", label: "Coloris" },
      { image: "https://pngimg.com/uploads/laptop/laptop_PNG101820.png", name: "Rose Poudré", label: "Coloris" },
    ],
    sortOrder: 2,
  },
  {
    slug: "phone-rentrée",
    type: "hero",
    layout: "product-grid",
    eyebrow: "Rentrée mobile",
    heading: "Smartphone pas cher, forte batterie.",
    description: "Les meilleurs rapports qualité-prix pour la rentrée.",
    ctaLabel: "Voir les smartphones",
    ctaUrl: "/shop?category=phones",
    bgColor: "#1a3a6e",
    brandBadge: "INFINIX · SAMSUNG",
    products: [
      { image: "https://pngimg.com/uploads/smartphone/smartphone_PNG5729.png", name: "Infinix Smart 20", price: 1499, label: "Nouveau" },
      { image: "https://pngimg.com/uploads/smartphone/smartphone_PNG5729.png", name: "Galaxy A7", price: 1999, label: "Populaire" },
      { image: "https://pngimg.com/uploads/smartphone/smartphone_PNG5729.png", name: "Hot 60 Pro+", price: 2199, label: "Performances" },
    ],
    sortOrder: 3,
  },
  {
    slug: "gaming-battle-station",
    type: "hero",
    layout: "product-grid",
    eyebrow: "Gaming",
    heading: "Equipez votre battle station.",
    description: "PC gamer, clavier mécanique, casque et souris — tout pour dominer.",
    ctaLabel: "Voir le gaming",
    ctaUrl: "/shop?category=gaming",
    bgColor: "#11131a",
    brandBadge: "ASUS · LOGITECH",
    oldPrice: 12999,
    price: 11499,
    products: [
      { image: "https://pngimg.com/uploads/keyboard/keyboard_PNG5837.png", name: "PC Gamer ROG", price: 8999, label: "RTX 4060" },
      { image: "https://pngimg.com/uploads/computer_keyboard/keyboard_PNG101721.png", name: "Clavier Mécanique", price: 899, label: "RGB" },
      { image: "https://pngimg.com/uploads/headphones/headphones_PNG101912.png", name: "Casque Gaming", price: 599, label: "7.1 Surround" },
      { image: "https://pngimg.com/uploads/computer_mouse/mouse_PNG7181.png", name: "Souris Pro", price: 499, label: "16000 DPI" },
    ],
    sortOrder: 4,
  },
  {
    slug: "welcome-jahiz",
    type: "hero",
    layout: "product-grid",
    eyebrow: "Bienvenue",
    heading: "La tech au meilleur prix.",
    description: "Livraison rapide, garantie officielle, service après-vente au Maroc.",
    ctaLabel: "Découvrir PC Jahiz",
    ctaUrl: "/shop",
    bgColor: "#fcd406",
    products: [
      { image: "https://pngimg.com/uploads/laptop/laptop_PNG5912.png", name: "PC Portables", label: "Toutes marques" },
      { image: "https://pngimg.com/uploads/smartphone/smartphone_PNG5729.png", name: "Smartphones", label: "Android & iOS" },
      { image: "https://pngimg.com/uploads/printer/printer_PNG7919.png", name: "Imprimantes", label: "Epson, Canon" },
      { image: "https://pngimg.com/uploads/headphones/headphones_PNG101912.png", name: "Accessoires", label: "Casques, souris" },
    ],
    sortOrder: 5,
  },
];

export const STORE_LOCATIONS: {
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: { monSat: string; sun: string };
  mapsUrl: string;
  isPickupPoint: boolean;
  sortOrder: number;
}[] = [
  {
    name: "PC Jahiz Casablanca",
    city: "Casablanca",
    address: "Boulevard Mohammed V, Quartier Gauthier, Casablanca",
    phone: "+212 5 22 00 00 00",
    hours: { monSat: "9h00 – 19h00", sun: "Fermé" },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Casablanca+Gauthier",
    isPickupPoint: false,
    sortOrder: 1,
  },
  {
    name: "Point relais Témara",
    city: "Témara",
    address: "Avenue Hassan II, Centre-ville, Témara",
    phone: "+212 5 37 00 00 00",
    hours: { monSat: "9h30 – 18h30", sun: "Fermé" },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Temara+centre+ville",
    isPickupPoint: true,
    sortOrder: 2,
  },
];