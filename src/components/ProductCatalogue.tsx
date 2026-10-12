import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SystemState, Product } from '../types';
import { 
  IceCream, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Boxes, 
  Barcode, 
  Calendar, 
  Plus, 
  ArrowRight,
  Bookmark,
  TrendingUp,
  Edit,
  X
} from 'lucide-react';
import { apiRequest } from '../utils/apiClient';

interface ProductCatalogueProps {
  state: SystemState;
  lang: 'fr' | 'ar';
  onProduceBatch?: (productId: string) => void;
  currentUser?: any;
  onProductModified?: () => void;
}

export default function ProductCatalogue({ state, lang, onProduceBatch, currentUser, onProductModified }: ProductCatalogueProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGamme, setSelectedGamme] = useState<string>('ALL');

  const gammes = ['ALL', 'GAMME CLASSIQUE', 'GAMME PREMIUM', 'GAMME GOURMET', 'GAMME MAGICIEN'];

  // Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editExpiryDays, setEditExpiryDays] = useState(365);
  const [editUnitPriceCost, setEditUnitPriceCost] = useState(1.5);
  const [editUnitPriceSell, setEditUnitPriceSell] = useState(3.0);
  const [editCartonsPerPalette, setEditCartonsPerPalette] = useState(100);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category);
    setEditBarcode(product.barcode);
    setEditExpiryDays(product.expiryDays);
    setEditUnitPriceCost(product.unitPriceCost);
    setEditUnitPriceSell(product.unitPriceSell);
    setEditCartonsPerPalette(product.cartonsPerPalette || 100);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      const response = await apiRequest(`/api/products/${editingProduct.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          category: editCategory,
          barcode: editBarcode,
          expiryDays: Number(editExpiryDays),
          unitPriceCost: Number(editUnitPriceCost),
          unitPriceSell: Number(editUnitPriceSell),
          cartonsPerPalette: Number(editCartonsPerPalette),
          user: currentUser,
        }),
      });
      if (response?.success || response?.ok) {
        setEditingProduct(null);
        if (onProductModified) {
          onProductModified();
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Custom visual designs, gradients, and descriptions matching the images
  const productMeta: Record<string, { descFr: string; descAr: string; gradient: string; style: string }> = {
    "prod-01": {
      descFr: "L'alliance rafraîchissante du lait onctueux et de la grenadine fruitée.",
      descAr: "مزيج منعش من الحليب الكريمي الناعم ونكهة الرمان (Grenadine) اللذيذة.",
      gradient: "from-rose-500 to-pink-400",
      style: "Stick bicolore"
    },
    "prod-02": {
      descFr: "Exotisme tropical alliant la douceur de la noix de coco et l'acidité de l'ananas.",
      descAr: "رحلة استوائية تجمع بين حلاوة جوز الهند ونكهة الأناناس المنعشة.",
      gradient: "from-yellow-400 to-amber-300",
      style: "Stick bicolore"
    },
    "prod-03": {
      descFr: "Bâtonnet d'exception enveloppé d'un chocolat craquant au caramel.",
      descAr: "مثلج فاخر مغطى بطبقة سميكة من الشوكولاتة المقرمشة والكراميل الذائب.",
      gradient: "from-amber-800 to-amber-950",
      style: "Bâtonnet Premium"
    },
    "prod-04": {
      descFr: "Coupes gourmandes avec un coulis de fraise intense et crème vanillée.",
      descAr: "كوب الذواقة الكريمي بنكهة الفراولة البرية وصلصة الفانيليا الغنية.",
      gradient: "from-pink-500 to-rose-400",
      style: "Pot Gourmet"
    },
    "prod-05": {
      descFr: "Parfum magique bubblegum qui éveille les papilles des petits sorciers.",
      descAr: "نكهة العلكة السحرية (Bubblegum) باللون البنفسجي الغامض لمتعة خيالية للأطفال.",
      gradient: "from-purple-600 to-indigo-400",
      style: "Spécial Magicien"
    },
    "prod-06": {
      descFr: "Crème glacée onctueuse enveloppée d'un sorbet mangue intense.",
      descAr: "كريمة مثلجة غنية مغلفة بالكامل بسوربيه المانجو الاستوائي المكثف.",
      gradient: "from-orange-500 to-amber-400",
      style: "Bâtonnet Fruité"
    },
    "prod-07": {
      descFr: "Sensation double : l'onctuosité de la vanille alliée à la force du cacao.",
      descAr: "نكهة مزدوجة رائعة تجمع بين فخامة الفانيليا الكلاسيكية وقوة الكاكاو الغني.",
      gradient: "from-amber-700 to-stone-850",
      style: "Bâtonnet"
    },
    "prod-08": {
      descFr: "Bâtonnet fondant parsemé de véritables morceaux de fraise acidulés.",
      descAr: "بوق مثلج مقرمش غني بقطع الفراولة الحمراء الطبيعية اللذيذة.",
      gradient: "from-red-500 to-rose-300",
      style: "Sorbet Crème"
    },
    "prod-09": {
      descFr: "Mini format, maxi plaisir chocolaté à emporter partout.",
      descAr: "حجم صغير ومرح، يمنحك متعة مضاعفة من الشوكولاتة في أي وقت.",
      gradient: "from-stone-700 to-stone-500",
      style: "Mini Bâtonnet"
    },
    "prod-10": {
      descFr: "Brochette amusante alternant couches de sorbet fraise et citron pressé.",
      descAr: "سيخ مرح يتناوب بين طبقات سوربيه الفراولة اللذيذة والليمون الحامض.",
      gradient: "from-pink-400 to-lime-300",
      style: "Brochette Bicolore"
    },
    "prod-11": {
      descFr: "Cône croustillant avec une spirale généreuse de vanille et de fraise.",
      descAr: "مخروط البوق المقرمش المزين بحلزون غني من كريمة الفانيليا والفراولة.",
      gradient: "from-pink-400 to-amber-100",
      style: "Cornet Classique"
    },
    "prod-12": {
      descFr: "Gobelet de crème glacée idéal pour une pause fraîcheur classique.",
      descAr: "كوب كريمي تقليدي بنكهتي الشوكولاتة والفانيليا، الخيار الأفضل للأطفال.",
      gradient: "from-amber-900 to-yellow-100",
      style: "Gobelet"
    },
    "prod-13": {
      descFr: "Pot onctueux avec un cœur coulant de coulis de fraise sauvage.",
      descAr: "كوب فاخر ذو قلب سائل من مربى الفراولة البرية المركزة.",
      gradient: "from-rose-600 to-red-400",
      style: "Pot Nappé"
    },
    "prod-14": {
      descFr: "Glace premium à base de véritable yaourt nature rafraîchissant.",
      descAr: "مثلج فاخر مصنوع من الزبادي الطبيعي المنعش والصحي لجميع الأوقات.",
      gradient: "from-sky-500 to-blue-300",
      style: "Pot Yaourt"
    },
    "prod-15": {
      descFr: "Format familial 1L de crème glacée onctueuse marbrée au chocolat.",
      descAr: "حجم عائلي وافر 1 لتر بنكهة الفانيليا الغنية الممزوجة بتموجات الكاكاو.",
      gradient: "from-slate-800 to-zinc-900",
      style: "Bac Familial 1L"
    },
    "prod-16": {
      descFr: "Le bac convivial de crème glacée aux fruits rouges pour toute la famille.",
      descAr: "صندوق عائلي مميز مليء بآيس كريم الفراولة المنعشة لكافة المناسبات.",
      gradient: "from-pink-600 to-rose-400",
      style: "Bac Familial 1L"
    },
    "prod-38": {
      descFr: "Glace onctueuse au nougat traditionnel de Montélimar et éclats de noisettes grillées.",
      descAr: "آيس كريم النوجا التقليدي مع قطع البندق المحمص والمقرمش نكهة ساحرة.",
      gradient: "from-amber-600 to-amber-900",
      style: "Bac Familial 1L"
    },
    "prod-39": {
      descFr: "La douceur de la vanille classique marbrée de coulis de fraises fraîches parfumées.",
      descAr: "تناغم الفانيليا الكلاسيكية مع صلصة الفراولة الطازجة والمنعشة.",
      gradient: "from-rose-500 to-amber-100",
      style: "Bac Familial 1L"
    },
    "prod-40": {
      descFr: "L'onctuosité de la vanille alliée au fondant d'un chocolat au lait d'exception.",
      descAr: "مزيج كريمي فخم من الفانيليا الطازجة والشوكولاتة بالحليب الغنية بالكاكاو.",
      gradient: "from-amber-900 to-stone-900",
      style: "Bac Familial 1L"
    },
    "prod-41": {
      descFr: "L'alliance parfaite de la vanille douce et du pep's d'un sorbet au citron pressé.",
      descAr: "الانتعاش الحقيقي بمزيج الفانيليا الناعمة وسوربيه الليمون الحامض المنعش.",
      gradient: "from-yellow-400 to-emerald-300",
      style: "Bac Familial 1L"
    },
    "prod-17": {
      descFr: "Double enrobage de chocolat fin au lait et riz croustillant soufflé.",
      descAr: "تغليف ثنائي فاخر بشوكولاتة الحليب الناعمة وحبيبات الأرز المقرمشة.",
      gradient: "from-amber-600 to-orange-400",
      style: "Bâtonnet Croquant"
    },
    "prod-18": {
      descFr: "Une recette prestigieuse associant sorbet fraise et glace vanille de Madagascar.",
      descAr: "وصفة برستيج فاخرة تجمع بين سوربيه الفراولة الغني وفانيليا مدغشقر.",
      gradient: "from-rose-800 to-rose-950",
      style: "Bâtonnet Prestige"
    },
    "prod-19": {
      descFr: "Biscuit sablé marbré au caramel doré enrobé de chocolat noir intense.",
      descAr: "بسكويت مقرمش بالكراميل مغلف بالكامل بطبقة من الشوكولاتة الداكنة.",
      gradient: "from-indigo-900 to-blue-950",
      style: "Omega Biscuit"
    },
    "prod-20": {
      descFr: "Une fleur de saveurs glacées au cœur de fraise et citron frais.",
      descAr: "كوب أنيق مصمم على شكل زهرة بنكهات الفراولة والليمون الحامض المنعش.",
      gradient: "from-fuchsia-500 to-pink-300",
      style: "Pot Fleury"
    },
    "prod-21": {
      descFr: "Le cornet mythique à double spirale chocolat et fruits rouges.",
      descAr: "البوق الأسطوري المفضل للأطفال بتموجات الشوكولاتة والفواكه اللذيذة.",
      gradient: "from-pink-500 to-yellow-300",
      style: "Cornet Aldo"
    },
    "prod-22": {
      descFr: "Tubes à pousser amusants de pur jus de fruits glacé pour l'été.",
      descAr: "أنبوب العصير المثلج الطبيعي بنكهات الليمون والفراولة والبرتقال اللذيذة.",
      gradient: "from-orange-500 to-yellow-400",
      style: "Ice Tube"
    },
    "prod-23": {
      descFr: "Parfums exotiques coco et ananas inspirés des contes d'Aladin.",
      descAr: "خلطة علاء الدين الاستوائية السحرية بنكهة الأناناس وحليب جوز الهند.",
      gradient: "from-amber-500 to-yellow-200",
      style: "Sorbet Magique"
    },
    "prod-24": {
      descFr: "Sachets glacés ludiques parsemés de petits bonbons multicolores.",
      descAr: "أكياس مرحة ومثلجة تحتوي على قطع حلوى جيلاتينية ملونة تسعد الأطفال.",
      gradient: "from-purple-500 to-fuchsia-400",
      style: "Pousse-pousse"
    },
    "prod-25": {
      descFr: "La force vitaminée du sorbet citron combiné au coulis fraise.",
      descAr: "قوة البحار المنعشة بسوربيه الليمون الطبيعي الغني بمربى الفراولة.",
      gradient: "from-emerald-500 to-lime-300",
      style: "Popeye Sorbet"
    },
    "prod-26": {
      descFr: "Cocktail d'été au melon doux et à la pastèque juteuse rafraîchissante.",
      descAr: "شريحة البطيخ والشمام الصيفية المنعشة التي تروي العطش في الأيام الحارة.",
      gradient: "from-red-600 to-emerald-600",
      style: "Melon Pastèque"
    },
    "prod-27": {
      descFr: "Boule glacée bicolore saveur vanille onctueuse et pomme verte acide.",
      descAr: "كرة مثلجة مرحة تجمع بين نعومة الفانيليا وحموضة التفاح الأخضر الطازج.",
      gradient: "from-lime-500 to-sky-300",
      style: "Pommy Double"
    },
    "prod-28": {
      descFr: "L'aventure gourmande des corsaires au cœur vanille intense et cacao.",
      descAr: "مغامرة القراصنة اللذيذة بنكهة الشوكولاتة والفانيليا الرائعة للأبطال الصغار.",
      gradient: "from-amber-900 to-stone-900",
      style: "Piratos Cup"
    },
    "prod-29": {
      descFr: "La douceur de la vanille enrobée d'une riche couche de chocolat croquant de haute qualité.",
      descAr: "حلاوة الفانيليا مغطاة بطبقة غنية ومقرمشة من الشوكولاتة الفاخرة عالية الجودة.",
      gradient: "from-amber-950 to-amber-700",
      style: "Capitano Enrobé"
    },
    "prod-30": {
      descFr: "Un délice fruité de crème glacée à la framboise sauvage et fraîche.",
      descAr: "بهجة الفاكهة الطازجة مع كريمة التوت البري اللذيذة والمنعشة.",
      gradient: "from-fuchsia-600 to-rose-400",
      style: "Capitano Framboise"
    },
    "prod-31": {
      descFr: "Cône croustillant rempli d'une crème glacée onctueuse et généreuse au chocolat pur.",
      descAr: "مخروط البوق المقرمش المليء بكريمة آيس كريم الشوكولاتة النقية والغنية.",
      gradient: "from-amber-900 to-stone-800",
      style: "Cornet Delicio"
    },
    "prod-32": {
      descFr: "Le mini-bâtonnet parfait mariant les notes exotiques de noix de coco avec un cœur fondant.",
      descAr: "أصابع المثلجات الصغيرة المثالية التي تجمع بين النكهات الاستوائية لجوز الهند والقلب الذائب.",
      gradient: "from-sky-100 to-pink-200",
      style: "Mini Garcia"
    },
    "prod-33": {
      descFr: "Gobelet rafraîchissant mariant l'onctuosité de la vanille et la douceur fruitée de la fraise.",
      descAr: "كوب منعش يمزج بين نعومة الفانيليا وحلاوة الفراولة الطبيعية اللذيذة.",
      gradient: "from-pink-300 to-sky-100",
      style: "Gobelet P'Tipo"
    },
    "prod-34": {
      descFr: "Pot gourmand nappé d'un savoureux et onctueux coulis au chocolat pur cacao.",
      descAr: "كوب الذواقة المزين بصلصة الكاكاو النقية اللذيذة والمنسابة.",
      gradient: "from-amber-900 to-stone-700",
      style: "Pot Frio Chocolat"
    },
    "prod-35": {
      descFr: "Un pot glacé ultra-frais avec un coulis au citron pressé acidulé et tonifiant.",
      descAr: "كوب مثلج ومنعش للغاية مع صلصة الليمون الحامض والمنشط.",
      gradient: "from-yellow-400 to-lime-300",
      style: "Pot Frio Citron"
    },
    "prod-36": {
      descFr: "Pot Premium à la texture fondante de yaourt et coulis de fraise intense.",
      descAr: "كوب فاخر بنسيج الزبادي الناعم وصلصة الفراولة المركزة والشهية.",
      gradient: "from-rose-500 to-pink-300",
      style: "Globe Fraise"
    },
    "prod-37": {
      descFr: "Une expérience glacée unique au chocolat onctueux et de caractère.",
      descAr: "تجربة مثلجة فريدة بنكهة الشوكولاتة الغنية والمميزة لعشاق الكاكاو.",
      gradient: "from-amber-950 to-stone-800",
      style: "Globe Chocolat"
    }
  };

  const filteredProducts = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode.includes(searchTerm);
    const matchesGamme = selectedGamme === 'ALL' || p.category === selectedGamme;
    return matchesSearch && matchesGamme;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <IceCream className="h-5 w-5 text-pink-500 animate-bounce" />
            {lang === 'fr' ? 'Catalogue Officiel Zahi Glaces' : 'كتالوج منتجات مثلجات زاهي الرسمية'}
          </h3>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
            {lang === 'fr' ? 'Explorez nos gammes et lancez la production' : 'تصفح تشكيلاتنا المتنوعة وسجل دفعات الإنتاج فوراً'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher un produit...' : 'ابحث عن منتج أو باركود...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Gamme Badges Filter Row */}
      <div className="flex flex-wrap gap-2 pb-2">
        {gammes.map(gamme => {
          const isActive = selectedGamme === gamme;
          return (
            <button
              key={gamme}
              onClick={() => setSelectedGamme(gamme)}
              className={`px-4 py-2 rounded-xl text-xxs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-500/15'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {gamme === 'ALL' 
                ? (lang === 'fr' ? '🌟 Tous les Produits' : '🌟 جميع المنتجات')
                : gamme
              }
            </button>
          );
        })}
      </div>

      {/* Products Grid Layout - Compact & Modern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
        {filteredProducts.map(product => {
          const meta = productMeta[product.id] || {
            descFr: "Une délicieuse création glacée artisanale Zahi Glaces.",
            descAr: "مثلج لذيذ ومميز مصنوع بعناية فائقة من معامل زاهي للمثلجات.",
            gradient: "from-blue-500 to-cyan-400",
            style: "Glace Zahi"
          };

          return (
            <motion.div
              key={product.id}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs overflow-hidden flex flex-col justify-between transition-all"
            >
              {/* Product Visual Top Banner - Compact */}
              <div className={`h-24 bg-gradient-to-br ${meta.gradient} p-2.5 flex flex-col justify-between relative overflow-hidden`}>
                
                {/* Background decorative pattern */}
                <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
                  <div className="absolute -right-3 -top-3 w-16 h-16 border-2 border-white rounded-full" />
                </div>

                <div className="flex justify-between items-start z-10">
                  <span className="text-[8px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full">
                    {product.category}
                  </span>
                  
                  <span className="text-[8px] font-bold bg-slate-900/40 text-white px-1.5 py-0.2 rounded font-mono">
                    {meta.style}
                  </span>
                </div>

                {/* Simulated Ice cream representation graphic in the center */}
                <div className="flex justify-center items-center h-8 z-10">
                  <div className="h-9 w-9 bg-white/95 rounded-full flex items-center justify-center shadow-md">
                    <IceCream className="h-5 w-5 text-pink-500" />
                  </div>
                </div>

                <div className="flex justify-between items-end z-10">
                  <h4 className="text-white font-black text-xs drop-shadow-sm truncate pr-1">
                    {product.name}
                  </h4>
                </div>
              </div>

              {/* Product Content Body - Compact */}
              <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 leading-tight font-medium line-clamp-2">
                    {lang === 'fr' ? meta.descFr : meta.descAr}
                  </p>

                  {/* Technical Meta specifications Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-slate-900">
                    
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">
                        {lang === 'fr' ? 'Cartons/Pal' : 'كرتونة/باليت'}
                      </span>
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1">
                        <Boxes className="h-2.5 w-2.5 text-indigo-500" />
                        {product.cartonsPerPalette || 100}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">
                        {lang === 'fr' ? 'Validité' : 'الصلاحية'}
                      </span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5 text-emerald-500" />
                        {product.expiryDays}j
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                        {lang === 'fr' ? 'Code-barres' : 'الباركود'}
                      </span>
                      <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1 truncate" title={product.barcode}>
                        <Barcode className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{product.barcode}</span>
                      </span>
                    </div>

                  </div>
                </div>

                {/* Custom product card actions: Produce / Modify */}
                <div className="flex gap-1.5 pt-1">
                  {onProduceBatch && (
                    <button
                      onClick={() => onProduceBatch(product.id)}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-pink-50 dark:bg-slate-900 dark:hover:bg-pink-950/20 text-slate-700 hover:text-pink-600 dark:text-slate-300 dark:hover:text-pink-400 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      <span>{lang === 'fr' ? 'Planifier' : 'جدولة'}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="flex-1 py-1.5 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/20 dark:hover:bg-pink-950/40 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 transition-all"
                  >
                    <Edit className="h-2.5 w-2.5" />
                    <span>{lang === 'fr' ? 'Modifier' : 'تعديل'}</span>
                  </button>
                </div>

              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center p-12 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
          <IceCream className="h-10 w-10 mx-auto text-slate-300 animate-pulse mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">
            {lang === 'fr' ? 'Aucun produit trouvé' : 'لم نجد أي منتج يطابق بحثك'}
          </p>
        </div>
      )}

      {/* --- Product Edit Modal --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Edit className="h-5 w-5 text-pink-500" />
                  {lang === 'fr' ? 'Modifier le Produit' : 'تعديل بيانات المنتج'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{editingProduct.id}</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-xs font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {lang === 'fr' ? 'Nom du Produit' : 'اسم المنتج'}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500"
                />
              </div>

              {/* Gamme / Category */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {lang === 'fr' ? 'Gamme / Catégorie' : 'التشكيلة / الفئة'}
                </label>
                <select
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500"
                >
                  {gammes.filter(g => g !== 'ALL').map(gamme => (
                    <option key={gamme} value={gamme}>{gamme}</option>
                  ))}
                  <option value="Autre">{lang === 'fr' ? 'Autre' : 'أخرى'}</option>
                </select>
              </div>

              {/* Barcode */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {lang === 'fr' ? 'Code-barres' : 'الباركود'}
                </label>
                <input
                  type="text"
                  required
                  value={editBarcode}
                  onChange={(e) => setEditBarcode(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500 font-mono"
                />
              </div>

              {/* Prices: Cost and Sell */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {lang === 'fr' ? 'Prix de Revient (DH)' : 'تكلفة الإنتاج (DH)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editUnitPriceCost}
                    onChange={(e) => setEditUnitPriceCost(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {lang === 'fr' ? 'Prix de Vente (DH)' : 'سعر البيع (DH)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editUnitPriceSell}
                    onChange={(e) => setEditUnitPriceSell(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500 font-mono"
                  />
                </div>
              </div>

              {/* Temperature and Expiry Days */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {lang === 'fr' ? 'Cartons par Palette' : 'عدد الكراتين في الباليت الواحد'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={editCartonsPerPalette}
                    onChange={(e) => setEditCartonsPerPalette(parseInt(e.target.value) || 1)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {lang === 'fr' ? 'Validité (Jours)' : 'مدة الصلاحية (بالأيام)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={editExpiryDays}
                    onChange={(e) => setEditExpiryDays(parseInt(e.target.value) || 365)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500 font-mono"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  {isSaving ? (lang === 'fr' ? 'Enregistrement...' : 'جاري الحفظ...') : (lang === 'fr' ? 'Enregistrer' : 'حفظ التعديلات')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
