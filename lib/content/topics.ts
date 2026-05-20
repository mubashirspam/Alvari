export type ContentTopic = {
  topicSlug: string;
  title: string;
  category: "care" | "buying-guide" | "materials" | "styling" | "local" | "process";
  brief: string;
  targetKeywords: string[];
  priority: number;
};

export const TOPICS: ContentTopic[] = [
  {
    topicSlug: "teak-furniture-kerala-humidity",
    title: "Why teak still wins in Kerala's humidity",
    category: "materials",
    brief:
      "Explain why teak's natural oils, density, and dimensional stability make it the right wood for Kerala's monsoon and coastal humidity. Compare to mahogany, rubberwood, and engineered wood. Give practical buying advice.",
    targetKeywords: ["teak furniture Kerala", "best wood Kerala humidity", "monsoon furniture wood"],
    priority: 10,
  },
  {
    topicSlug: "monsoon-furniture-care-kerala",
    title: "Furniture care during Kerala monsoon",
    category: "care",
    brief:
      "Step-by-step monsoon care guide for solid wood, cane, upholstered sofas, and mattresses. Cover mold prevention, ventilation, polish refresh cadence, and the cloth-wipe vs spray debate.",
    targetKeywords: ["monsoon furniture care", "sofa care Kerala", "wooden furniture rainy season"],
    priority: 10,
  },
  {
    topicSlug: "choosing-almirah-kerala-home",
    title: "How to choose an almirah for a Kerala home",
    category: "buying-guide",
    brief:
      "A buyer's framework: dimensions vs ceiling height, two-door vs three-door, wood + plywood + laminate trade-offs, mirror panel placement, locking mechanisms. Use a 16x24 ft bedroom as a worked example.",
    targetKeywords: ["almirah Kerala", "wardrobe size guide India", "wooden almirah buying"],
    priority: 9,
  },
  {
    topicSlug: "factory-direct-vs-showroom-furniture",
    title: "Factory-direct vs showroom: where ₹40,000 really goes",
    category: "buying-guide",
    brief:
      "Break down the typical furniture supply chain in Kerala and where the margin disappears — rent, sales commission, transport, warranty padding. Show a real cost comparison for a king-size bed at three price points.",
    targetKeywords: ["factory direct furniture", "furniture price breakdown India", "no middleman furniture"],
    priority: 9,
  },
  {
    topicSlug: "sofa-set-buying-guide-kerala",
    title: "Sofa setti buying guide for Kerala living rooms",
    category: "buying-guide",
    brief:
      "Cover 3+2 vs 3+1+1 vs L-shape for typical Kerala living rooms (12x14 ft, 14x16 ft, 16x18 ft), seat depth for Indian seating posture, fabric vs leatherette for humidity, frame wood, and warranty red flags.",
    targetKeywords: ["sofa set Kerala", "sofa setti buying guide", "best sofa for Kerala humidity"],
    priority: 9,
  },
  {
    topicSlug: "dining-table-size-guide-india",
    title: "Dining table size guide for Indian homes",
    category: "buying-guide",
    brief:
      "How to pick 4, 6, or 8-seater based on room width, walkaround clearance (90cm rule), chair pull-out space, and the difference between square, rectangular, and oval. Include a Kerala-context example with a typical 12-ft dining room.",
    targetKeywords: ["dining table size", "6 seater dining table India", "dining room dimensions"],
    priority: 8,
  },
  {
    topicSlug: "complete-bedroom-set-checklist",
    title: "Complete bedroom set checklist — what to buy together vs later",
    category: "buying-guide",
    brief:
      "Bed, mattress, side tables, dressing unit, almirah — what to bundle on day one for cost savings, what can wait. Cover mattress + bed size match, dressing-table height, and matching vs contrasting wood tones.",
    targetKeywords: ["complete bedroom set", "bedroom furniture checklist", "wood furniture bedroom"],
    priority: 8,
  },
  {
    topicSlug: "wood-quality-grades-explained",
    title: "Wood quality grades, decoded for furniture buyers",
    category: "materials",
    brief:
      "Plain-English guide to A-grade vs B-grade teak, plantation vs reclaimed, plywood IS:710 vs commercial ply, MDF vs particle board. Show what to ask the maker before paying.",
    targetKeywords: ["teak wood grades", "plywood IS 710", "furniture wood quality India"],
    priority: 8,
  },
  {
    topicSlug: "kerala-traditional-vs-modern-furniture",
    title: "Kerala traditional vs modern: blending in one home",
    category: "styling",
    brief:
      "How to mix a Kerala traditional swing chair / nilavilakku-style accent with modern minimal furniture without it looking like a clash. Cover wood tone consistency, scale, and the 80/20 split rule.",
    targetKeywords: ["Kerala traditional furniture", "Kerala modern interior", "mixing traditional modern"],
    priority: 7,
  },
  {
    topicSlug: "mattress-buying-guide-india",
    title: "Mattress buying guide for the Indian climate",
    category: "buying-guide",
    brief:
      "Coir vs foam vs spring vs latex for Indian summers, Kerala monsoon humidity, and back support. Thickness chart, firmness recommendations by sleeper weight, warranty fine print.",
    targetKeywords: ["best mattress India", "coir mattress Kerala", "mattress buying guide"],
    priority: 7,
  },
  {
    topicSlug: "small-bedroom-furniture-ideas",
    title: "Small bedroom furniture ideas that don't feel cramped",
    category: "styling",
    brief:
      "Practical layouts for 10x10 ft and 10x12 ft Kerala bedrooms — bed orientation, wall-mounted vs freestanding wardrobe, multi-use dressing-cum-study, and the colour rules that open up small rooms.",
    targetKeywords: ["small bedroom furniture", "10x12 bedroom layout", "compact wardrobe Kerala"],
    priority: 7,
  },
  {
    topicSlug: "custom-furniture-process",
    title: "What custom furniture really costs in terms of time and money",
    category: "process",
    brief:
      "Walk a customer through Alvari's custom flow — site measurement, mood board, wood + finish selection, 60% advance, build in Wayanad, delivery + on-site assembly. Real timelines, transparent margins.",
    targetKeywords: ["custom furniture Kerala", "made to order furniture", "bespoke wardrobe Kerala"],
    priority: 7,
  },
  {
    topicSlug: "wood-finishes-explained",
    title: "PU, melamine, lacquer, oil — wood finishes explained",
    category: "materials",
    brief:
      "What each finish actually does for durability, look, food-safety, and how often it needs refreshing in Kerala climate. Match finishes to use case: dining table vs almirah vs kids' bed.",
    targetKeywords: ["PU finish furniture", "melamine vs lacquer", "wood finish guide"],
    priority: 6,
  },
  {
    topicSlug: "home-staging-furniture-resale-kerala",
    title: "Furniture choices that protect resale value in Kerala",
    category: "styling",
    brief:
      "Buyer psychology in Kochi/Calicut/Thrissur — what neutral wood tones, dining configurations, and storage choices help when you sell. The fixed vs movable furniture decision in apartment vs villa.",
    targetKeywords: ["resale value furniture", "Kerala apartment furniture", "home staging Kerala"],
    priority: 6,
  },
  {
    topicSlug: "ergonomic-seating-indian-posture",
    title: "Ergonomic seating for Indian sitting postures",
    category: "buying-guide",
    brief:
      "Sukhasana / cross-legged seating on sofas and floor cushions, dining chair seat-pan depth, study chair height for school kids. Practical numbers, not generic ergonomics-blog filler.",
    targetKeywords: ["ergonomic sofa India", "dining chair height", "study chair kids"],
    priority: 6,
  },
  {
    topicSlug: "delivery-installation-kerala",
    title: "What to expect when furniture is delivered to your home",
    category: "process",
    brief:
      "A walk-through of Alvari's delivery + installation: crating, route from Wayanad to Kochi/Calicut/Thrissur, who handles assembly, what damage looks like and what's covered, payment-on-delivery flow.",
    targetKeywords: ["furniture delivery Kerala", "Wayanad furniture delivery", "furniture installation Kerala"],
    priority: 6,
  },
  {
    topicSlug: "kids-room-furniture-safety",
    title: "Kids' room furniture: safety, scale, and longevity",
    category: "buying-guide",
    brief:
      "Bunk-bed safety rails, study-desk heights by age, edge-rounding, lead-free finishes, and which pieces grow with the child vs need replacement at 8/12.",
    targetKeywords: ["kids bed Kerala", "kids study table", "child safe furniture India"],
    priority: 6,
  },
  {
    topicSlug: "wood-storage-warehouse-tour",
    title: "Inside our Wayanad timber storage — what 6-month seasoning looks like",
    category: "process",
    brief:
      "Photo-friendly tour of Alvari's seasoning yard, kiln vs air-dry, moisture-content readings, the rejection rate, and why seasoning matters for warp-free almirahs.",
    targetKeywords: ["timber seasoning Kerala", "Wayanad furniture workshop", "wood seasoning process"],
    priority: 5,
  },
  {
    topicSlug: "dining-set-styling-tips",
    title: "Styling a dining set without a dining room",
    category: "styling",
    brief:
      "For apartments and open-plan layouts: round tables, bench-back-to-sofa setups, lighting hierarchy, and rug sizing under the table.",
    targetKeywords: ["small dining area", "apartment dining table", "dining set styling"],
    priority: 5,
  },
  {
    topicSlug: "first-home-furniture-budget",
    title: "Furnishing your first home in Kerala — a ₹3 lakh budget plan",
    category: "buying-guide",
    brief:
      "Real allocation for a 2BHK first home: bed + mattress + almirah + sofa + dining + kitchen island. What to splurge on (sofa, mattress) and where to economise (side tables, coffee table) — with Wayanad-direct pricing.",
    targetKeywords: ["first home furniture budget", "2BHK furniture Kerala", "furnishing on a budget"],
    priority: 5,
  },
];
