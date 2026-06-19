"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { translations } from "@/lib/translations";

const chartTranslations: Record<string, Record<string, string>> = {
  en: {
    pageEyebrow: "Competitor comparison",
    pageTitle: "See How We Compare",
    pageLead: "iCanCall is the only safety phone routing service built for kids, seniors, and the special needs community — with no device required and no long-term contracts.",
    thYouName: "iCanCall",
    thYouPrice: "from $14.99/mo",
    thComp1Price: "~$29–$39/mo",
    thComp2Price: "$369 device + $20/mo",
    thComp3Price: "Free app (iPhone req.)",
    ctaTitle: "Ready to secure your family?",
    ctaDesc: "Give your loved ones the safety and simplicity of iCanCall today. Set up in under 5 minutes.",
    ctaBtnPrimary: "Get Started Now",
    ctaBtnGhost: "Back to Homepage",
    ctaFine: "Set up in minutes · No setup fees · Cancel anytime",
    legendTitle: "Key:",
    legendYes: "Included",
    legendNo: "Not available",
    legendPartial: "Limited or conditional",
    
    // Sections
    secSetup: "Accessibility & Setup",
    secRouting: "Call Routing & Contact Management",
    secTools: "Caregiver Tools & Oversight",
    secAudience: "Audience & Inclusivity",
    secPricing: "Pricing & Commitment",

    // Row features
    fWorksAnyPhone: "Works on any phone — no device needed",
    fNoApp: "No app required for the caller",
    fFastSetup: "Setup in under 5 minutes",
    fNoHardwarePurchase: "No hardware purchase required",
    fRoutingMenu: "Caller-controlled routing menu",
    fMaxContacts: "Up to 6 routable contacts",
    fMemorableNumber: "Single memorable number",
    fAddonNumbers: "Add-on numbers available",
    fRealTimeAlerts: "Real-time call alerts & notifications",
    fCallLogs: "Full call log & history",
    fRemoteMgmt: "Remote contact management",
    fCaregiverDashboard: "Secure caregiver dashboard",
    fForKids: "Designed for children",
    fForSeniors: "Designed for seniors",
    fForSpecialNeeds: "Designed for special needs community",
    fBilingual: "Bilingual greeting options",
    fUserEmpowerment: "User empowerment — caller chooses who answers",
    fNoHardwareCost: "No hardware cost",
    fNoContract: "No long-term contract",
    fMonthlyPrice: "Monthly entry-level price",

    // Notes
    nRequiresLandline: "Requires landline setup",
    nRequiresDevice369: "Requires $369 device",
    nRequiresIphone: "Requires iPhone",
    nProprietaryDeviceOnly: "Proprietary device only",
    nIphoneAppRequired: "iPhone app required",
    nPhoneLineRequired: "Phone line setup required",
    nDeviceCarrierSetup: "Device + carrier setup",
    nAppAccountRequired: "App + account required",
    nCaregiverControls: "Caregiver controls all routing",
    nDirectDialOnly: "Direct dial only",
    nApprovedContactList: "Approved contact list",
    nPhotoContacts6: "6 photo contacts",
    nMaxContacts5: "Up to 5 contacts",
    nDeviceBasedNotNumber: "Device-based, not number-based",
    nUsesExistingNumber: "Uses existing phone number",
    nAddonPrice: "$3.99/mo per number",
    nSeniorsOnly: "Seniors only",
    nSeniorsCognitive: "Seniors / cognitive impairment",
    nCognitiveFocus: "Cognitive impairment focus",
    nCaregiverRestricted: "Caregiver-controlled restriction",
    nDevice369Upfront: "$369 upfront",
    nCheckTerms: "Check terms",
    nFreeIphoneRequired: "Free (iPhone required)"
  },
  es: {
    pageEyebrow: "Tabla comparativa",
    pageTitle: "Vea cómo nos comparamos",
    pageLead: "iCanCall es el único servicio de desvío de seguridad telefónica creado para niños, personas mayores y personas con necesidades especiales, sin necesidad de dispositivos y sin contratos a largo plazo.",
    thYouName: "iCanCall",
    thYouPrice: "desde $14.99/mes",
    thComp1Price: "~$29–$39/mes",
    thComp2Price: "$369 dispositivo + $20/mes",
    thComp3Price: "App gratuita (req. iPhone)",
    ctaTitle: "¿Listo para proteger a su familia?",
    ctaDesc: "Brinde a sus seres queridos la seguridad y simplicidad de iCanCall hoy. Se configura en menos de 5 minutos.",
    ctaBtnPrimary: "Comenzar Ahora",
    ctaBtnGhost: "Volver al Inicio",
    ctaFine: "Configuración en minutos · Sin tarifas ocultas · Cancele cuando quiera",
    legendTitle: "Clave:",
    legendYes: "Incluido",
    legendNo: "No disponible",
    legendPartial: "Limitado o condicional",

    secSetup: "Accesibilidad y Configuración",
    secRouting: "Enrutamiento y Contactos",
    secTools: "Herramientas de Cuidadores",
    secAudience: "Público y Facilidad de Uso",
    secPricing: "Precios y Compromiso",

    fWorksAnyPhone: "Funciona en cualquier teléfono — sin dispositivo",
    fNoApp: "Sin necesidad de apps para quien llama",
    fFastSetup: "Activo en menos de 5 minutos",
    fNoHardwarePurchase: "No requiere compra de hardware",
    fRoutingMenu: "Menú de desvío por voz controlado por quien llama",
    fMaxContacts: "Hasta 6 contactos de seguridad",
    fMemorableNumber: "Número único de seguridad",
    fAddonNumbers: "Números adicionales disponibles",
    fRealTimeAlerts: "Alertas y notificaciones en tiempo real",
    fCallLogs: "Historial y registro de llamadas",
    fRemoteMgmt: "Gestión remota de contactos",
    fCaregiverDashboard: "Panel de control seguro para cuidadores",
    fForKids: "Desenhado para niños",
    fForSeniors: "Diseñado para personas mayores",
    fForSpecialNeeds: "Diseñado para necesidades especiales",
    fBilingual: "Mensajes de saludo bilingües",
    fUserEmpowerment: "Autonomía de quien llama para elegir",
    fNoHardwareCost: "Sin costos de aparatos",
    fNoContract: "Sin contrato a largo plazo",
    fMonthlyPrice: "Precio mensual de entrada",

    nRequiresLandline: "Requiere instalación de línea fija",
    nRequiresDevice369: "Requiere dispositivo de $369",
    nRequiresIphone: "Requiere iPhone",
    nProprietaryDeviceOnly: "Solo dispositivo propietario",
    nIphoneAppRequired: "Requiere app de iPhone",
    nPhoneLineRequired: "Requiere configuración de línea",
    nDeviceCarrierSetup: "Configuración de dispositivo y operador",
    nAppAccountRequired: "Requiere cuenta y app",
    nCaregiverControls: "El cuidador controla todo el desvío",
    nDirectDialOnly: "Solo marcado directo",
    nApprovedContactList: "Lista de contactos aprobados",
    nPhotoContacts6: "6 contactos con foto",
    nMaxContacts5: "Hasta 5 contactos",
    nDeviceBasedNotNumber: "Basado en dispositivo, no en número",
    nUsesExistingNumber: "Usa el número de teléfono existente",
    nAddonPrice: "$3.99/mes por número",
    nSeniorsOnly: "Solo personas mayores",
    nSeniorsCognitive: "Personas mayores / deterioro cognitivo",
    nCognitiveFocus: "Enfoque en deterioro cognitivo",
    nCaregiverRestricted: "Restricción controlada por el cuidador",
    nDevice369Upfront: "$369 por adelantado",
    nCheckTerms: "Ver condiciones",
    nFreeIphoneRequired: "Gratis (requiere iPhone)"
  },
  fr: {
    pageEyebrow: "Comparatif des concurrents",
    pageTitle: "Découvrez notre comparatif",
    pageLead: "iCanCall est le seul service de routage de sécurité téléphonique conçu pour les enfants, les aînés et les personnes ayant des besoins spécifiques — sans appareil requis ni contrat.",
    thYouName: "iCanCall",
    thYouPrice: "à partir de 14,99 $/mois",
    thComp1Price: "~29–39 $/mois",
    thComp2Price: "369 $ matériel + 20 $/mois",
    thComp3Price: "App gratuite (req. iPhone)",
    ctaTitle: "Prêt à sécuriser votre famille ?",
    ctaDesc: "Offrez dès aujourd'hui à vos proches la sécurité et la simplicité d'iCanCall. Configuration en moins de 5 minutes.",
    ctaBtnPrimary: "Démarrer maintenant",
    ctaBtnGhost: "Retour à l'accueil",
    ctaFine: "Configuration en minutes · Aucun frais d'activation · Sans engagement",
    legendTitle: "Légende :",
    legendYes: "Inclus",
    legendNo: "Non disponible",
    legendPartial: "Partiel Limité ou conditionnel",

    secSetup: "Accessibilité & Configuration",
    secRouting: "Routage des appels & Contacts",
    secTools: "Outils d'aidants & Surveillance",
    secAudience: "Public cible & Inclusion",
    secPricing: "Tarifs & Engagement",

    fWorksAnyPhone: "Fonctionne sur n'importe quel téléphone — sans appareil",
    fNoApp: "Aucune application requise pour l'appelant",
    fFastSetup: "Configuration en moins de 5 minutes",
    fNoHardwarePurchase: "Aucun achat de matériel requis",
    fRoutingMenu: "Menu de routage contrôlé par l'appelant",
    fMaxContacts: "Jusqu'à 6 contacts configurables",
    fMemorableNumber: "Numéro unique facile à retenir",
    fAddonNumbers: "Numéros supplémentaires disponibles",
    fRealTimeAlerts: "Alertes & notifications en temps réel",
    fCallLogs: "Historique & journal d'appels complet",
    fRemoteMgmt: "Gestion des contacts à distance",
    fCaregiverDashboard: "Tableau de bord sécurisé pour aidant",
    fForKids: "Conçu pour les enfants",
    fForSeniors: "Conçu pour les aînés",
    fForSpecialNeeds: "Conçu pour les personnes ayant des besoins spécifiques",
    fBilingual: "Options d'accueil bilingues",
    fUserEmpowerment: "Choix de l'appelant pour le destinataire",
    fNoHardwareCost: "Aucun coût de matériel",
    fNoContract: "Sans engagement à long terme",
    fMonthlyPrice: "Tarif mensuel de base",

    nRequiresLandline: "Nécessite une ligne fixe",
    nRequiresDevice369: "Nécessite un appareil à 369 $",
    nRequiresIphone: "Nécessite un iPhone",
    nProprietaryDeviceOnly: "Appareil propriétaire uniquement",
    nIphoneAppRequired: "Application iPhone requise",
    nPhoneLineRequired: "Configuration de ligne requise",
    nDeviceCarrierSetup: "Configuration appareil + opérateur",
    nAppAccountRequired: "Application + compte requis",
    nCaregiverControls: "L'aidant contrôle tout le routage",
    nDirectDialOnly: "Appel direct uniquement",
    nApprovedContactList: "Liste de contacts approuvés",
    nPhotoContacts6: "6 contacts avec photo",
    nMaxContacts5: "Jusqu'à 5 contacts",
    nDeviceBasedNotNumber: "Basé sur l'appareil, non le numéro",
    nUsesExistingNumber: "Utilise le numéro de téléphone existant",
    nAddonPrice: "3,99 $/mois par numéro",
    nSeniorsOnly: "Aînés uniquement",
    nSeniorsCognitive: "Aînés / troubles cognitifs",
    nCognitiveFocus: "Focus troubles cognitifs",
    nCaregiverRestricted: "Restriction contrôlée par l'aidant",
    nDevice369Upfront: "369 $ initiaux",
    nCheckTerms: "Voir conditions",
    nFreeIphoneRequired: "Gratuit (iPhone requis)"
  },
  ja: {
    pageEyebrow: "競合他社との比較",
    pageTitle: "他社との違いを見る",
    pageLead: "iCanCallは、キッズ、シニア、特別なケアが必要な方向けの、新しい電話機器の購入や長期契約が不要な唯一の安全な転送サービスです。",
    thYouName: "iCanCall",
    thYouPrice: "月額 $14.99 〜",
    thComp1Price: "月額約 $29〜$39",
    thComp2Price: "$369 機器代 + 月額 $20",
    thComp3Price: "無料アプリ（iPhone必須）",
    ctaTitle: "ご家族の安心を、今すぐ始めましょう",
    ctaDesc: "大切なご家族に、iCanCallによる安全でシンプルな通話環境を提供しましょう。設定は5分で完了します。",
    ctaBtnPrimary: "今すぐ始める",
    ctaBtnGhost: "ホームに戻る",
    ctaFine: "数分でセットアップ完了 · 初期費用なし · いつでも解約可能",
    legendTitle: "凡例：",
    legendYes: "含まれる",
    legendNo: "利用不可",
    legendPartial: "一部機能制限あり / 条件付き",

    secSetup: "アクセシビリティと初期設定",
    secRouting: "着信ルーティングと連絡先管理",
    secTools: "介護者向けツールと監視機能",
    secAudience: "対象者と使いやすさ",
    secPricing: "料金プランと契約縛り",

    fWorksAnyPhone: "すべての電話機で動作（専用端末不要）",
    fNoApp: "発信者のアプリ導入不要",
    fFastSetup: "5分未満でセットアップ可能",
    fNoHardwarePurchase: "電話機器の購入不要",
    fRoutingMenu: "発信者操作による転送メニュー",
    fMaxContacts: "最大6件の転送先連絡先",
    fMemorableNumber: "覚えやすい1つの専用番号",
    fAddonNumbers: "追加番号の利用可能",
    fRealTimeAlerts: "リアルタイムの通話アラートと通知",
    fCallLogs: "詳細な通話ログと履歴",
    fRemoteMgmt: "リモート連絡先管理",
    fCaregiverDashboard: "安全な管理者ダッシュボード",
    fForKids: "キッズ向け設計",
    fForSeniors: "シニア向け設計",
    fForSpecialNeeds: "特別なケアが必要な方向け設計",
    fBilingual: "バイリンガル応答メッセージ設定",
    fUserEmpowerment: "発信者が接続先を選択可能",
    fNoHardwareCost: "端末機器代ゼロ",
    fNoContract: "長期の最低契約期間なし",
    fMonthlyPrice: "月額の基本料金",

    nRequiresLandline: "固定電話の配線環境が必要",
    nRequiresDevice369: "$369の専用端末が必要",
    nRequiresIphone: "iPhoneが必要",
    nProprietaryDeviceOnly: "専用の独自端末のみ",
    nIphoneAppRequired: "iPhoneアプリのインストールが必要",
    nPhoneLineRequired: "電話回線工事・設定が必要",
    nDeviceCarrierSetup: "端末購入と通信事業者設定が必要",
    nAppAccountRequired: "アプリのインストールとアカウント作成が必要",
    nCaregiverControls: "管理者がすべてのルーティングを設定",
    nDirectDialOnly: "直接ダイヤル発信のみ",
    nApprovedContactList: "承認済み連絡先リスト方式",
    nPhotoContacts6: "写真付き連絡先6件",
    nMaxContacts5: "最大5件の連絡先",
    nDeviceBasedNotNumber: "電話番号ではなく端末に紐づく制限",
    nUsesExistingNumber: "既存の携帯電話番号を利用",
    nAddonPrice: "番号あたり月額 $3.99",
    nSeniorsOnly: "シニア専用",
    nSeniorsCognitive: "シニア / 認知症サポート用",
    nCognitiveFocus: "認知障害向け設計",
    nCaregiverRestricted: "管理者による接続制限あり",
    nDevice369Upfront: "$369の機器代先払い",
    nCheckTerms: "規約確認が必要",
    nFreeIphoneRequired: "無料（iPhoneが必要）"
  },
  zh: {
    pageEyebrow: "竞品对比",
    pageTitle: "查看竞品差异",
    pageLead: "iCanCall 是唯一专为儿童、老人和特殊群体打造的电话安全路由转接服务，无需购买任何硬件设备，无长期捆绑合约。",
    thYouName: "iCanCall",
    thYouPrice: "$14.99/月 起",
    thComp1Price: "约 $29–$39/月",
    thComp2Price: "$369 终端费 + $20/月",
    thComp3Price: "免费 App (限 iPhone)",
    ctaTitle: "立即为您的家人提供安全守护",
    ctaDesc: "今天就让您所爱的人享受 iCanCall 的极简与安全。设置只需不到 5 分钟。",
    ctaBtnPrimary: "立即注册体验",
    ctaBtnGhost: "返回首页",
    ctaFine: "几分钟快速开通 · 无初装费 · 随时取消订阅",
    legendTitle: "图例说明：",
    legendYes: "已包含",
    legendNo: "未提供 / 不可用",
    legendPartial: "部分提供 / 有限制条件",

    secSetup: "易用性与设置配置",
    secRouting: "呼叫路由与联系人管理",
    secTools: "看护工具与远程监管",
    secAudience: "适用场景与易用性",
    secPricing: "资费套餐与服务合约",

    fWorksAnyPhone: "支持任意电话呼叫 — 无需实体终端设备",
    fNoApp: "拨打人无需安装任何应用 App",
    fFastSetup: "少于 5 分钟开通设置",
    fNoHardwarePurchase: "无需购买任何实体硬件设备",
    fRoutingMenu: "拨打人可自助操作的路由转接语音菜单",
    fMaxContacts: "支持多达 6 个路由联系人",
    fMemorableNumber: "提供单一好记的专有电话号码",
    fAddonNumbers: "可订购额外附加号码",
    fRealTimeAlerts: "实时呼叫提醒和状态通知",
    fCallLogs: "完整的通话记录和历史明细",
    fRemoteMgmt: "远程后台联系人名单管理",
    fCaregiverDashboard: "安全的看护监管后台控制面板",
    fForKids: "专为儿童设计",
    fForSeniors: "专为老年人设计",
    fForSpecialNeeds: "专为特殊需要人群设计",
    fBilingual: "双语个性化欢迎语选项",
    fUserEmpowerment: "拨打人自主选择要接通的对象",
    fNoHardwareCost: "硬件购买费用为 0 元",
    fNoContract: "无长期捆绑服务合约",
    fMonthlyPrice: "月度入门级起步价格",

    nRequiresLandline: "需配置传统固定电话线",
    nRequiresDevice369: "需购买 $369 专有终端机",
    nRequiresIphone: "限制仅限 iPhone 用户使用",
    nProprietaryDeviceOnly: "仅限使用其专有定制设备",
    nIphoneAppRequired: "呼叫人需安装 iPhone 应用",
    nPhoneLineRequired: "需进行座机电话线设置",
    nDeviceCarrierSetup: "需进行设备和运营商开通配置",
    nAppAccountRequired: "需安装应用并注册账号",
    nCaregiverControls: "转接规则完全由管理员设定",
    nDirectDialOnly: "仅支持直接拨号，无路由选择",
    nApprovedContactList: "采用受信任白名单联系人方式",
    nPhotoContacts6: "提供 6 个带照片快捷联系人",
    nMaxContacts5: "最多支持 5 个联系人",
    nDeviceBasedNotNumber: "绑定到特定硬件设备，非号码转接",
    nUsesExistingNumber: "使用您现有的手机号码",
    nAddonPrice: "每个号码每月 $3.99",
    nSeniorsOnly: "仅面向老人设计",
    nSeniorsCognitive: "面向老人/认知障碍人群",
    nCognitiveFocus: "专注于认知功能障碍设计",
    nCaregiverRestricted: "受管理员限制的呼入策略",
    nDevice369Upfront: "需预付 $369 硬件购买费",
    nCheckTerms: "需遵守其特定合约服务条款",
    nFreeIphoneRequired: "免费（但必须使用 iPhone）"
  },
  ar: {
    pageEyebrow: "المقارنة مع المنافسين",
    pageTitle: "شاهد كيف نقارن معهم",
    pageLead: "iCanCall هي خدمة توجيه أمان الهاتف الوحيدة المخصصة للأطفال وكبار السن وذوي الاحتياجات الخاصة — دون الحاجة لأجهزة مخصصة وبدون عقود طويلة الأجل.",
    thYouName: "iCanCall",
    thYouPrice: "تبدأ من 14.99 دولاراً شهرياً",
    thComp1Price: "~29–39 دولاراً شهرياً",
    thComp2Price: "369 دولاراً للجهاز + 20 دولاراً شهرياً",
    thComp3Price: "تطبيق مجاني (يتطلب آيفون)",
    ctaTitle: "هل أنت مستعد لحماية عائلتك؟",
    ctaDesc: "امنح أحباءك أمان وبساطة iCanCall اليوم. يتم الإعداد في أقل من 5 دقائق.",
    ctaBtnPrimary: "ابدأ الآن",
    ctaBtnGhost: "العودة للرئيسية",
    ctaFine: "الإعداد في دقائق · لا رسوم إعداد · إلغاء في أي وقت",
    legendTitle: "المفتاح:",
    legendYes: "مشمول",
    legendNo: "غير متاح",
    legendPartial: "جزئي محدود أو مشروط",

    secSetup: "سهولة الوصول والإعداد",
    secRouting: "توجيه المكالمات وإدارة جهات الاتصال",
    secTools: "أدوات مقدمي الرعاية والإشراف",
    secAudience: "الجمهور والشمولية",
    secPricing: "الأسعار والالتزام",

    fWorksAnyPhone: "يعمل على أي هاتف — لا حاجة لجهاز مادي",
    fNoApp: "لا يتطلب تطبيقاً للشخص المتصل",
    fFastSetup: "الإعداد في أقل من 5 دقائق",
    fNoHardwarePurchase: "لا يتطلب شراء أي أجهزة",
    fRoutingMenu: "قائمة توجيه يتحكم فيها المتصل",
    fMaxContacts: "توجيه لما يصل إلى 6 جهات اتصال",
    fMemorableNumber: "رقم واحد سهل التذكر",
    fAddonNumbers: "أرقام إضافية متاحة",
    fRealTimeAlerts: "تنبيهات وإشعارات المكالمات في الوقت الفعلي",
    fCallLogs: "سجل مكالمات كامل وتاريخها",
    fRemoteMgmt: "إدارة جهات الاتصال عن بعد",
    fCaregiverDashboard: "لوحة تحكم آمنة لمقدم الرعاية",
    fForKids: "مصمم خصيصاً للأطفال",
    fForSeniors: "مصمم خصيصاً لكبار السن",
    fForSpecialNeeds: "مصمم لذوي الاحتياجات الخاصة",
    fBilingual: "خيارات ترحيب ثنائية اللغة",
    fUserEmpowerment: "تمكين المستخدم — يختار المتصل من يجيب",
    fNoHardwareCost: "لا تكلفة للأجهزة",
    fNoContract: "بدون عقود طويلة الأجل",
    fMonthlyPrice: "سعر الدخول الشهري المعتاد",

    nRequiresLandline: "يتطلب إعداد خط أرضي",
    nRequiresDevice369: "يتطلب شراء جهاز بقيمة 369$",
    nRequiresIphone: "يتطلب هاتف آيفون",
    nProprietaryDeviceOnly: "جهاز مخصص فقط",
    nIphoneAppRequired: "يتطلب تطبيق آيفون",
    nPhoneLineRequired: "إعداد خط هاتف مطلوب",
    nDeviceCarrierSetup: "إعداد الجهاز + شركة الاتصال",
    nAppAccountRequired: "يتطلب تطبيق + حساب",
    nCaregiverControls: "يتحكم مقدم الرعاية في كل التوجيه",
    nDirectDialOnly: "طلب مباشر فقط",
    nApprovedContactList: "قائمة جهات الاتصال المعتمدة",
    nPhotoContacts6: "6 جهات اتصال بالصور",
    nMaxContacts5: "ما يصل إلى 5 جهات اتصال",
    nDeviceBasedNotNumber: "مرتبط بالجهاز، وليس بالرقم",
    nUsesExistingNumber: "يستخدم رقم الهاتف الحالي الخاص به",
    nAddonPrice: "3.99$ شهرياً لكل رقم",
    nSeniorsOnly: "كبار السن فقط",
    nSeniorsCognitive: "كبار السن / ضعف الإدراك",
    nCognitiveFocus: "التركيز على ضعف الإدراك",
    nCaregiverRestricted: "تقييد يتحكم فيه مقدم الرعاية",
    nDevice369Upfront: "369$ مقدماً",
    nCheckTerms: "تحقق من الشروط",
    nFreeIphoneRequired: "مجاني (يتطلب آيفون)"
  },
  hi: {
    pageEyebrow: "प्रतियोगी तुलना",
    pageTitle: "देखें हम कैसे तुलना करते हैं",
    pageLead: "iCanCall बच्चों, बुजुर्गों और विशेष आवश्यकता वाले लोगों के लिए बनाई गई एकमात्र सुरक्षा फोन रूटिंग सेवा है — बिना किसी हार्डवेयर उपकरण के और बिना किसी लंबी अवधि के अनुबंध के।",
    thYouName: "iCanCall",
    thYouPrice: "शुरुआत $14.99/माह से",
    thComp1Price: "~$29–$39/माह",
    thComp2Price: "$369 उपकरण + $20/माह",
    thComp3Price: "मुफ़्त ऐप (iPhone आवश्यक)",
    ctaTitle: "अपने परिवार को सुरक्षित रखने के लिए तैयार हैं?",
    ctaDesc: "आज ही अपने प्रियजनों को iCanCall की सुरक्षा और सादगी दें। सेटअप में 5 मिनट से भी कम समय लगता है।",
    ctaBtnPrimary: "अभी शुरू करें",
    ctaBtnGhost: "होमपेज पर वापस",
    ctaFine: "मिनटों में सेटअप · कोई सेटअप शुल्क नहीं · किसी भी समय रद्द करें",
    legendTitle: "संकेत:",
    legendYes: "शामिल",
    legendNo: "उपलब्ध नहीं",
    legendPartial: "आंशिक सीमित या सशर्त",

    secSetup: "सुलभता और सेटअप",
    secRouting: "कॉल रूटिंग और संपर्क प्रबंधन",
    secTools: "केयरटेकर उपकरण और निगरानी",
    secAudience: "उपयोगकर्ता और सुलभता",
    secPricing: "कीमतें और अनुबंध",

    fWorksAnyPhone: "किसी भी फोन पर काम करता है — किसी उपकरण की आवश्यकता नहीं",
    fNoApp: "कॉलर के लिए किसी ऐप की आवश्यकता नहीं",
    fFastSetup: "5 मिनट से कम में सेटअप",
    fNoHardwarePurchase: "कोई हार्डवेयर खरीदने की आवश्यकता नहीं",
    fRoutingMenu: "कॉलर द्वारा नियंत्रित वॉयस मेनू",
    fMaxContacts: "अधिकतम 6 संपर्क सदस्य",
    fMemorableNumber: "एक याद रखने योग्य नंबर",
    fAddonNumbers: "अतिरिक्त सुरक्षा नंबर उपलब्ध हैं",
    fRealTimeAlerts: "वास्तविक समय में कॉल अलर्ट और सूचनाएं",
    fCallLogs: "पूर्ण कॉल लॉग और इतिहास",
    fRemoteMgmt: "रिमोट संपर्क प्रबंधन",
    fCaregiverDashboard: "सुरक्षित केयरटेकर डैशबोर्ड",
    fForKids: "बच्चों के लिए डिज़ाइन किया गया",
    fForSeniors: "बुजुर्गों के लिए डिज़ाइन किया गया",
    fForSpecialNeeds: "विशेष आवश्यकता वाले लोगों के लिए",
    fBilingual: "द्विभाषी अभिवादन विकल्प",
    fUserEmpowerment: "कॉलर स्वयं चुनता है कि किसे बात करनी है",
    fNoHardwareCost: "कोई हार्डवेयर लागत नहीं",
    fNoContract: "कोई दीर्घकालिक अनुबंध नहीं",
    fMonthlyPrice: "न्यूनतम मासिक प्रवेश मूल्य",

    nRequiresLandline: "लैंडलाइन सेटअप आवश्यक",
    nRequiresDevice369: "$369 वाले उपकरण की आवश्यकता",
    nRequiresIphone: "iPhone आवश्यक",
    nProprietaryDeviceOnly: "केवल विशेष उपकरण",
    nIphoneAppRequired: "iPhone ऐप आवश्यक",
    nPhoneLineRequired: "फोन लाइन सेटअप आवश्यक",
    nDeviceCarrierSetup: "डिवाइस + कैरियर सेटअप",
    nAppAccountRequired: "ऐप + खाता आवश्यक",
    nCaregiverControls: "केयरटेकर सभी रूटिंग नियंत्रित करता है",
    nDirectDialOnly: "केवल डायरेक्ट डायल",
    nApprovedContactList: "अनुमोदित संपर्क सूची",
    nPhotoContacts6: "6 फोटो संपर्क",
    nMaxContacts5: "5 संपर्कों तक सीमित",
    nDeviceBasedNotNumber: "डिवाइस-आधारित, नंबर-आधारित नहीं",
    nUsesExistingNumber: "मौजूदा फोन नंबर का उपयोग करता है",
    nAddonPrice: "$3.99/माह प्रति नंबर",
    nSeniorsOnly: "केवल बुजुर्गों के लिए",
    nSeniorsCognitive: "बुजुर्ग / संज्ञानात्मक हानि",
    nCognitiveFocus: "संज्ञानात्मक हानि पर ध्यान केंद्रित",
    nCaregiverRestricted: "केयरटेकर द्वारा नियंत्रित सीमा",
    nDevice369Upfront: "$369 अग्रिम",
    nCheckTerms: "शर्तें जांचें",
    nFreeIphoneRequired: "मुफ़्त (iPhone आवश्यक)"
  },
  pt: {
    pageEyebrow: "Comparação com concorrentes",
    pageTitle: "Veja Como Nos Comparamos",
    pageLead: "O iCanCall é o único serviço de encaminhamento telefônico seguro criado para crianças, idosos e pessoas com necessidades especiais — sem aparelhos exigidos e sem contratos longos.",
    thYouName: "iCanCall",
    thYouPrice: "desde $14.99/mês",
    thComp1Price: "~$29–$39/mês",
    thComp2Price: "$369 aparelho + $20/mês",
    thComp3Price: "App grátis (requer iPhone)",
    ctaTitle: "Pronto para proteger sua família?",
    ctaDesc: "Garanta a quem você ama a simplicidade do iCanCall. Configuração rápida em menos de 5 minutos.",
    ctaBtnPrimary: "Começar agora",
    ctaBtnGhost: "Voltar ao início",
    ctaFine: "Ativo em minutos · Sem taxa de adesão · Cancele a qualquer momento",
    legendTitle: "Legenda:",
    legendYes: "Incluso",
    legendNo: "Não disponível",
    legendPartial: "Parcial Limitado ou condicional",

    secSetup: "Acessibilidade & Configuração",
    secRouting: "Encaminhamento & Contatos",
    secTools: "Ferramentas de Cuidadores & Monitoramento",
    secAudience: "Público & Facilidade",
    secPricing: "Preços & Compromisso",

    fWorksAnyPhone: "Funciona em qualquer telefone · sem aparelhos",
    fNoApp: "Sem necessidade de aplicativos para quem liga",
    fFastSetup: "Ativo em menos de 5 minutos",
    fNoHardwarePurchase: "Nenhuma compra de hardware necessária",
    fRoutingMenu: "Menu de opções falado",
    fMaxContacts: "Até 6 contatos na lista",
    fMemorableNumber: "Número único de segurança",
    fAddonNumbers: "Linhas virtuais adicionais disponíveis",
    fRealTimeAlerts: "Alertas por e-mail e SMS em tempo real",
    fCallLogs: "Histórico e registro completo de chamadas",
    fRemoteMgmt: "Gerenciamento de contatos remoto",
    fCaregiverDashboard: "Painel de controle de cuidadores seguro",
    fForKids: "Desenhado para crianças",
    fForSeniors: "Desenhado para idosos",
    fForSpecialNeeds: "Ideal para necessidades especiais",
    fBilingual: "Mensagens de saudação bilingues",
    fUserEmpowerment: "Autonomia de quem liga para escolher",
    fNoHardwareCost: "Sem custos de aparelhos ou chips",
    fNoContract: "Sem contratos de fidelidade",
    fMonthlyPrice: "Mensalidade básica de entrada",

    nRequiresLandline: "Exige linha telefônica fixa instalada",
    nRequiresDevice369: "Exige aparelho de $369",
    nRequiresIphone: "Exige iPhone",
    nProprietaryDeviceOnly: "Apenas aparelho exclusivo",
    nIphoneAppRequired: "Exige aplicativo no iPhone",
    nPhoneLineRequired: "Exige configuração de linha",
    nDeviceCarrierSetup: "Configuração de aparelho e operadora",
    nAppAccountRequired: "Aplicativo e conta necessários",
    nCaregiverControls: "Cuidador controla todo o menu",
    nDirectDialOnly: "Apenas discagem direta normal",
    nApprovedContactList: "Lista de contatos aprovados",
    nPhotoContacts6: "6 contatos rápidos por foto",
    nMaxContacts5: "Até 5 contatos",
    nDeviceBasedNotNumber: "Baseado no dispositivo, não no número",
    nUsesExistingNumber: "Usa o número de celular atual",
    nAddonPrice: "$3.99/mês por linha extra",
    nSeniorsOnly: "Apenas idosos",
    nSeniorsCognitive: "Idosos / perda cognitiva",
    nCognitiveFocus: "Foco em necessidades cognitivas",
    nCaregiverRestricted: "Restrição controlada por cuidador",
    nDevice369Upfront: "$369 adiantados",
    nCheckTerms: "Verificar regras de fidelidade",
    nFreeIphoneRequired: "Grátis (exige iPhone)"
  },
  de: {
    pageEyebrow: "Konkurrenzvergleich",
    pageTitle: "Sehen Sie, wie wir uns vergleichen",
    pageLead: "iCanCall ist der einzige Telefon-Sicherheitsdienst für Kinder, Senioren und Menschen mit besonderen Bedürfnissen — ganz ohne Zusatzgeräte und ohne langfristige Verträge.",
    thYouName: "iCanCall",
    thYouPrice: "ab $14.99/Monat",
    thComp1Price: "~$29–$39/Monat",
    thComp2Price: "$369 Gerät + $20/Monat",
    thComp3Price: "Kostenlose App (iPhone ben.)",
    ctaTitle: "Bereit, Ihre Familie abzusichern?",
    ctaDesc: "Geben Sie Ihren Lieben heute die Einfachheit von iCanCall. In unter 5 Minuten einsatzbereit.",
    ctaBtnPrimary: "Jetzt starten",
    ctaBtnGhost: "Zur Startseite",
    ctaFine: "In Minuten eingerichtet · Keine Einrichtungsgebühr · Jederzeit kündbar",
    legendTitle: "Legende:",
    legendYes: "Inklusive",
    legendNo: "Nicht verfügbar",
    legendPartial: "Teilweise Eingeschränkt oder optional",

    secSetup: "Erreichbarkeit & Einrichtung",
    secRouting: "Rufweiterleitung & Kontakte",
    secTools: "Betreuer-Tools & Überwachung",
    secAudience: "Zielgruppe & Barrierefreiheit",
    secPricing: "Preise & Vertragslaufzeit",

    fWorksAnyPhone: "Funktioniert mit jedem Telefon — ohne Geräte",
    fNoApp: "Keine App für den Anrufer erforderlich",
    fFastSetup: "Einrichtung in unter 5 Minuten",
    fNoHardwarePurchase: "Kein Hardwarekauf erforderlich",
    fRoutingMenu: "Anrufergesteuertes Sprachmenü",
    fMaxContacts: "Bis zu 6 Kontakte im Kreis",
    fMemorableNumber: "Einprägsame Einzelnummer",
    fAddonNumbers: "Zusätzliche Sicherheitsnummern buchbar",
    fRealTimeAlerts: "Anrufsignale & Benachrichtigungen in Echtzeit",
    fCallLogs: "Vollständiges Anrufprotokoll & Historie",
    fRemoteMgmt: "Kontaktverwaltung aus der Ferne",
    fCaregiverDashboard: "Sicheres Betreuer-Dashboard",
    fForKids: "Für Kinder entwickelt",
    fForSeniors: "Für Senioren entwickelt",
    fForSpecialNeeds: "Für Menschen mit Einschränkungen",
    fBilingual: "Zweisprachige Begrüßungsansagen",
    fUserEmpowerment: "Anrufer entscheidet, wer abhebt",
    fNoHardwareCost: "Keine Hardwarekosten",
    fNoContract: "Keine langfristige Vertragslaufzeit",
    fMonthlyPrice: "Monatlicher Einstiegspreis",

    nRequiresLandline: "Erfordert Festnetz-Einrichtung",
    nRequiresDevice369: "Erfordert $369-Gerät",
    nRequiresIphone: "Erfordert iPhone",
    nProprietaryDeviceOnly: "Nur firmeneigenes Gerät",
    nIphoneAppRequired: "iPhone-App erforderlich",
    nPhoneLineRequired: "Telefonanschluss-Einrichtung nötig",
    nDeviceCarrierSetup: "Geräte- und Netzanbieter-Einrichtung",
    nAppAccountRequired: "App und Account benötigt",
    nCaregiverControls: "Betreuer steuert alle Regeln",
    nDirectDialOnly: "Nur Direktwahl",
    nApprovedContactList: "Zugelassene Kontaktliste",
    nPhotoContacts6: "6 Fotokontakte",
    nMaxContacts5: "Bis zu 5 Kontakte",
    nDeviceBasedNotNumber: "Geräteabhängig, nicht rufnummernabhängig",
    nUsesExistingNumber: "Nutzt bestehende Rufnummer",
    nAddonPrice: "$3.99/Monat pro Nummer",
    nSeniorsOnly: "Nur für Senioren",
    nSeniorsCognitive: "Senioren / Kognitive Einschränkung",
    nCognitiveFocus: "Fokus auf kognitive Einschränkung",
    nCaregiverRestricted: "Vom Betreuer gesteuerte Einschränkung",
    nDevice369Upfront: "$369 im Voraus",
    nCheckTerms: "Vertragsbedingungen prüfen",
    nFreeIphoneRequired: "Kostenlos (iPhone benötigt)"
  },
  it: {
    pageEyebrow: "Confronto con concorrenti",
    pageTitle: "Scopri Come Ci Confrontiamo",
    pageLead: "iCanCall è l'unico servizio telefonico sicuro per bambini, anziani e persone con bisogni speciali — senza acquisto di apparecchi e senza vincoli contrattuali.",
    thYouName: "iCanCall",
    thYouPrice: "da $14.99/mese",
    thComp1Price: "~$29–$39/mese",
    thComp2Price: "$369 dispositivo + $20/mese",
    thComp3Price: "App gratis (richiede iPhone)",
    ctaTitle: "Pronto a proteggere la tua famiglia?",
    ctaDesc: "Regala oggi ai tuoi cari la semplicità di iCanCall. Setup in meno di 5 minuti.",
    ctaBtnPrimary: "Inizia ora",
    ctaBtnGhost: "Torna alla home",
    ctaFine: "Attivo in pochi minuti · Nessun costo di attivazione · Disdici quando vuoi",
    legendTitle: "Legenda:",
    legendYes: "Incluso",
    legendNo: "Non disponibile",
    legendPartial: "Parziale Limitato o con condizioni",

    secSetup: "Accessibilità & Configurazione",
    secRouting: "Inoltro & Contatti",
    secTools: "Strumenti di Monitoraggio Caregiver",
    secAudience: "Destinatari & Semplicità d'Uso",
    secPricing: "Prezzi & Impegni",

    fWorksAnyPhone: "Funziona su qualsiasi telefono — nessun dispositivo necessario",
    fNoApp: "Nessuna app richiesta a chi telefona",
    fFastSetup: "Configurazione in meno di 5 minuti",
    fNoHardwarePurchase: "Nessun hardware da acquistare",
    fRoutingMenu: "Menu vocale di inoltro gestito da chi chiama",
    fMaxContacts: "Fino a 6 contatti per il deviazione",
    fMemorableNumber: "Unico numero facile da ricordare",
    fAddonNumbers: "Numeri aggiuntivi configurabili",
    fRealTimeAlerts: "Notifiche ed avvisi in tempo reale",
    fCallLogs: "Registro storico chiamate completo",
    fRemoteMgmt: "Gestione contatti a distanza",
    fCaregiverDashboard: "Dashboard sicura per caregiver",
    fForKids: "Progettato per bambini",
    fForSeniors: "Progettato per anziani",
    fForSpecialNeeds: "Progettato per bisogni speciali",
    fBilingual: "Messaggi di benvenuto bilingue",
    fUserEmpowerment: "Controllo utente — chi chiama sceglie chi risponde",
    fNoHardwareCost: "Nessun costo hardware",
    fNoContract: "Senza vincoli di contratto",
    fMonthlyPrice: "Prezzo base mensile",

    nRequiresLandline: "Richiede l'allacciamento linea fissa",
    nRequiresDevice369: "Richiede dispositivo da $369",
    nRequiresIphone: "Richiede iPhone",
    nProprietaryDeviceOnly: "Solo dispositivo proprietario",
    nIphoneAppRequired: "App iPhone richiesta",
    nPhoneLineRequired: "Configurazione linea telefonica richiesta",
    nDeviceCarrierSetup: "Installazione operatore + telefono fisso",
    nAppAccountRequired: "Richiede app + account",
    nCaregiverControls: "Il caregiver imposta tutte le regole",
    nDirectDialOnly: "Solo composizione diretta",
    nApprovedContactList: "Lista contatos approvati",
    nPhotoContacts6: "6 contatti con foto rapida",
    nMaxContacts5: "Fino a 5 contatti",
    nDeviceBasedNotNumber: "Legato al dispositivo, non al numero",
    nUsesExistingNumber: "Usa il numero telefonico attuale",
    nAddonPrice: "$3.99/mese per numero",
    nSeniorsOnly: "Solo anziani",
    nSeniorsCognitive: "Anziani / deficit cognitivo",
    nCognitiveFocus: "Focus su deficit cognitivi",
    nCaregiverRestricted: "Restrizioni impostate dal caregiver",
    nDevice369Upfront: "$369 iniziali",
    nCheckTerms: "Controlla le condizioni",
    nFreeIphoneRequired: "Gratuito (richiede iPhone)"
  },
  ko: {
    pageEyebrow: "경우 제품 비교",
    pageTitle: "타사와의 서비스 비교",
    pageLead: "iCanCall은 어린이, 고령의 부모님, 그리고 특별 케어 대상자를 위한 유일한 안심 통화망 서비스로, 추가 단말기 구입이나 긴 위약금 약정이 없습니다.",
    thYouName: "iCanCall",
    thYouPrice: "월 $14.99부터",
    thComp1Price: "월 약 $29–$39",
    thComp2Price: "$369 단말기 + 월 $20",
    thComp3Price: "무료 앱 (iPhone 전용)",
    ctaTitle: "우리 가족을 안전하게 보호할 준비가 되셨나요?",
    ctaDesc: "소중한 분들에게 가장 안전하고 단순한 iCanCall의 혜택을 선물하세요. 5분 안에 설정이 끝납니다.",
    ctaBtnPrimary: "지금 가입하기",
    ctaBtnGhost: "홈페이지로 이동",
    ctaFine: "몇 분 만에 개통 완료 · 가입비 면제 · 언제든 정기결제 해지 가능",
    legendTitle: "범례 설명:",
    legendYes: "제공됨",
    legendNo: "제공 안 됨",
    legendPartial: "일부 조건부 제공 / 제한적",

    secSetup: "사용 편의성 및 세팅",
    secRouting: "통화 라우팅 및 보호자 연락처",
    secTools: "보호자 툴 및 모니터링",
    secAudience: "서비스 이용 대상 및 편의성",
    secPricing: "요금제 및 의무 약정",

    fWorksAnyPhone: "기기 무관 모든 전화기에서 동작",
    fNoApp: "발신자 전용 앱 설치 불필요",
    fFastSetup: "5분 안에 개통 설정 완료",
    fNoHardwarePurchase: "추가 하드웨어 단말 구입 불필요",
    fRoutingMenu: "전화 거는 사람이 직접 선택하는 다이얼 메뉴",
    fMaxContacts: "최대 6명의 보호자 수신처 지정",
    fMemorableNumber: "기억하기 쉬운 단 하나의 번호",
    fAddonNumbers: "추가 안심 번호 개통 지원",
    fRealTimeAlerts: "실시간 통화 시작 및 상황 알림",
    fCallLogs: "상세한 전체 통화 이력 내역 조회",
    fRemoteMgmt: "원격지 연락처 목록 편집",
    fCaregiverDashboard: "안전한 원격 보호자 대시보드 페이지",
    fForKids: "어린이 안심 통화용 설계",
    fForSeniors: "시니어 어르신용 맞춤 설계",
    fForSpecialNeeds: "특별 케어 대상자에 맞춰 설계",
    fBilingual: "다국어 인사 안내 멘트 기능",
    fUserEmpowerment: "발신자가 전화를 받을 사람을 직접 지정",
    fNoHardwareCost: "초기 단말 기기 구입비 0원",
    fNoContract: "약정 위약금 없는 자유 계약",
    fMonthlyPrice: "합리적인 기본 이용료",

    nRequiresLandline: "전용 일반 유선전화 설치 필요",
    nRequiresDevice369: "$369 전용 단말기 별도 구매 필요",
    nRequiresIphone: "iPhone 단말기 필수",
    nProprietaryDeviceOnly: "전용 맞춤 단말기에서만 사용 가능",
    nIphoneAppRequired: "iPhone 앱 설치 필수",
    nPhoneLineRequired: "유선전화 가입 개통 필요",
    nDeviceCarrierSetup: "기기 및 통신사 개통 필요",
    nAppAccountRequired: "앱 및 계정 필요",
    nCaregiverControls: "보호자가 전체 연결 방식 설정",
    nDirectDialOnly: "다이얼 직접 전화만 지원",
    nApprovedContactList: "승인된 연락처 화이트리스트 방식",
    nPhotoContacts6: "6명의 단축 사진 연락처 지정 가능",
    nMaxContacts5: "최대 5명 연락처 지원",
    nDeviceBasedNotNumber: "가상번호가 아닌 단말기 자체에 묶임",
    nUsesExistingNumber: "기존 가입 전화번호 그대로 사용",
    nAddonPrice: "추가 번호당 월 $3.99",
    nSeniorsOnly: "시니어 실버 고객 전용",
    nSeniorsCognitive: "시니어 / 인지증 케어용",
    nCognitiveFocus: "인지 기능 약화 고객에게 맞춤화",
    nCaregiverRestricted: "보호자가 통화 연결 제한 설정 가능",
    nDevice369Upfront: "기기 구매비 $369 선청구",
    nCheckTerms: "요금제 약정 조건 확인 필요",
    nFreeIphoneRequired: "무료 (iPhone 필수)"
  }
};

export default function ComparisonChartPage() {
  const [lang, setLang] = useState<"en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko">("en");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as any;
    const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
    if (validLangs.includes(savedLang)) {
      setLang(savedLang);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    const handleStorage = () => {
      const activeLang = localStorage.getItem("lang") as any;
      if (validLangs.includes(activeLang)) {
        setLang(activeLang);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const changeLanguage = (newLang: typeof lang) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    window.dispatchEvent(new Event("storage"));
  };

  const t = translations[lang];
  const c = chartTranslations[lang] || chartTranslations.en;

  const renderStatus = (status: "yes" | "no" | "partial", noteKey?: string) => {
    const note = noteKey ? c[noteKey] : null;
    if (status === "yes") {
      return (
        <td>
          <span className="yes" style={{ color: "oklch(0.70 0.13 158)", fontWeight: 700 }}>✓</span>
          {note && <span className="note" style={{ display: "block", fontSize: "11px", color: "oklch(0.60 0.018 242)", marginTop: "3px" }}>{note}</span>}
        </td>
      );
    } else if (status === "no") {
      return (
        <td>
          <span className="no" style={{ color: "oklch(0.62 0.18 22)", fontWeight: 700 }}>✗</span>
          {note && <span className="note" style={{ display: "block", fontSize: "11px", color: "oklch(0.60 0.018 242)", marginTop: "3px" }}>{note}</span>}
        </td>
      );
    } else {
      return (
        <td>
          <span className="partial" style={{ display: "inline-block", background: "oklch(0.96 0.02 90)", color: "oklch(0.60 0.10 80)", padding: "2px 6px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>~ Partial</span>
          {note && <span className="note" style={{ display: "block", fontSize: "11px", color: "oklch(0.60 0.018 242)", marginTop: "3px" }}>{note}</span>}
        </td>
      );
    }
  };

  return (
    <div className={lang === "ar" ? "rtl" : "ltr"} style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
      {/* ============== HEADER ============== */}
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap header-inner">
          <Link className="brand" href="/" aria-label="iCanCall home">
            <svg className="logo-main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 553.0305" style={{ height: "40px", width: "auto", display: "block" }}>
              <style>{`
                .logo-main .cls-1 { fill: #1c2530; }
                .logo-main .cls-2 { fill: #4083ae; }
                .logo-main .cls-3 { fill: #fff; }
              `}</style>
              <g>
                <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z" />
                <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z" />
              </g>
              <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z" />
            </svg>
          </Link>
          <nav className="nav">
            <Link href="/#how">{t.nav.how}</Link>
            <Link href="/#features">{t.nav.features}</Link>
            <Link href="/#usecases">{t.nav.who}</Link>
            <Link href="/#pricing">{t.nav.pricing}</Link>
            <Link href="/#faq">{t.nav.faq}</Link>
          </nav>
          <div className="header-cta" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link className="btn btn-text" href="/login" style={{ marginRight: 6 }}>{t.nav.login}</Link>
            <Link className="btn btn-ghost" href="/#how">{t.nav.howWorksBtn}</Link>
            <Link className="btn btn-primary" href="/#pricing">{t.nav.selectPlanBtn}</Link>
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as any)}
              className="lang-select"
              style={{
                background: "transparent",
                border: "1px solid var(--line)",
                color: "var(--ink-soft)",
                padding: "6px 10px",
                borderRadius: "20px",
                fontSize: "0.86rem",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none",
                fontFamily: "var(--font)",
                marginLeft: 4
              }}
            >
              <option value="en">🇺🇸 EN</option>
              <option value="es">🇪🇸 ES</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="ja">🇯🇵 JA</option>
              <option value="zh">🇨🇳 ZH</option>
              <option value="ar">🇸🇦 AR</option>
              <option value="hi">🇮🇳 HI</option>
              <option value="pt">🇵🇹 PT</option>
              <option value="de">🇩🇪 DE</option>
              <option value="it">🇮🇹 IT</option>
              <option value="ko">🇰🇷 KO</option>
            </select>
          </div>
        </div>
      </header>

      {/* ============== MAIN CONTENT ============== */}
      <main>
        <section className="section">
          <div className="wrap">
            <div className="section-head reveal in" style={{ marginBottom: "40px" }}>
              <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.82rem", fontWeight: 600, textTransform: "uppercase", color: "oklch(0.44 0.105 240)", marginBottom: "14px" }}>
                {c.pageEyebrow}
              </span>
              <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, letterSpacing: "-0.025em" }}>{c.pageTitle}</h2>
              <p className="lead" style={{ marginTop: "14px", color: "oklch(0.45 0.022 245)" }}>{c.pageLead}</p>
            </div>

            <div className="table-wrap reveal in" style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: "16px", background: "oklch(1 0 0)", boxShadow: "var(--shadow-sm)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <colgroup>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "17%" }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: "20px 18px", textAlign: "left" }}></th>
                    <th style={{ padding: "20px 18px", background: "oklch(0.965 0.018 218)", borderLeft: "1.5px solid oklch(0.58 0.115 232)", borderRight: "1.5px solid oklch(0.58 0.115 232)" }}>
                      <span style={{ display: "block", fontSize: "16px", fontWeight: 700, color: "oklch(0.26 0.028 248)" }}>{c.thYouName}</span>
                      <span style={{ display: "block", fontSize: "12px", color: "oklch(0.45 0.022 245)", fontWeight: 500, marginTop: "4px" }}>{c.thYouPrice}</span>
                      <span style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", background: "oklch(0.58 0.115 232)", color: "#fff", padding: "2px 10px", borderRadius: "20px", margin: "8px auto 0", width: "fit-content" }}>
                        ★ Best Choice
                      </span>
                    </th>
                    <th style={{ padding: "20px 18px", color: "oklch(0.45 0.022 245)" }}>
                      <span style={{ display: "block", fontSize: "16px", fontWeight: 700, color: "oklch(0.26 0.028 248)" }}>teleCalm</span>
                      <span style={{ display: "block", fontSize: "12px", color: "oklch(0.45 0.022 245)", fontWeight: 500, marginTop: "4px" }}>{c.thComp1Price}</span>
                    </th>
                    <th style={{ padding: "20px 18px", color: "oklch(0.45 0.022 245)" }}>
                      <span style={{ display: "block", fontSize: "16px", fontWeight: 700, color: "oklch(0.26 0.028 248)" }}>RAZ Memory Phone</span>
                      <span style={{ display: "block", fontSize: "12px", color: "oklch(0.45 0.022 245)", fontWeight: 500, marginTop: "4px" }}>{c.thComp2Price}</span>
                    </th>
                    <th style={{ padding: "20px 18px", color: "oklch(0.45 0.022 245)" }}>
                      <span style={{ display: "block", fontSize: "16px", fontWeight: 700, color: "oklch(0.26 0.028 248)" }}>Senior Safety Phone</span>
                      <span style={{ display: "block", fontSize: "12px", color: "oklch(0.45 0.022 245)", fontWeight: 500, marginTop: "4px" }}>{c.thComp3Price}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* SECTION: ACCESSIBILITY & SETUP */}
                  <tr style={{ background: "oklch(0.945 0.028 210)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                    <td colSpan={5} style={{ padding: "10px 18px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.45 0.022 245)" }}>
                      {c.secSetup}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fWorksAnyPhone}</td>
                    {renderStatus("yes")}
                    {renderStatus("no", "nRequiresLandline")}
                    {renderStatus("no", "nRequiresDevice369")}
                    {renderStatus("no", "nRequiresIphone")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fNoApp}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("no", "nProprietaryDeviceOnly")}
                    {renderStatus("no", "nIphoneAppRequired")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fFastSetup}</td>
                    {renderStatus("yes")}
                    {renderStatus("partial", "nPhoneLineRequired")}
                    {renderStatus("no", "nDeviceCarrierSetup")}
                    {renderStatus("partial", "nAppAccountRequired")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fNoHardwarePurchase}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("no", "nRequiresDevice369")}
                    {renderStatus("yes")}
                  </tr>

                  {/* SECTION: CALL ROUTING */}
                  <tr style={{ background: "oklch(0.945 0.028 210)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                    <td colSpan={5} style={{ padding: "10px 18px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.45 0.022 245)" }}>
                      {c.secRouting}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fRoutingMenu}</td>
                    {renderStatus("yes")}
                    {renderStatus("no", "nCaregiverControls")}
                    {renderStatus("no", "nDirectDialOnly")}
                    {renderStatus("no", "nDirectDialOnly")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fMaxContacts}</td>
                    {renderStatus("yes")}
                    {renderStatus("partial", "nApprovedContactList")}
                    {renderStatus("yes", "nPhotoContacts6")}
                    {renderStatus("partial", "nMaxContacts5")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fMemorableNumber}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("no", "nDeviceBasedNotNumber")}
                    {renderStatus("no", "nUsesExistingNumber")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fAddonNumbers}</td>
                    {renderStatus("yes", "nAddonPrice")}
                    {renderStatus("no")}
                    {renderStatus("no")}
                    {renderStatus("no")}
                  </tr>

                  {/* SECTION: CAREGIVER TOOLS */}
                  <tr style={{ background: "oklch(0.945 0.028 210)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                    <td colSpan={5} style={{ padding: "10px 18px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.45 0.022 245)" }}>
                      {c.secTools}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fRealTimeAlerts}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("no")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fCallLogs}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("partial")}
                    {renderStatus("no")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fRemoteMgmt}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fCaregiverDashboard}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("partial")}
                    {renderStatus("no")}
                  </tr>

                  {/* SECTION: AUDIENCE */}
                  <tr style={{ background: "oklch(0.945 0.028 210)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                    <td colSpan={5} style={{ padding: "10px 18px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.45 0.022 245)" }}>
                      {c.secAudience}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fForKids}</td>
                    {renderStatus("yes")}
                    {renderStatus("no", "nSeniorsOnly")}
                    {renderStatus("no", "nSeniorsCognitive")}
                    {renderStatus("no", "nSeniorsOnly")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fForSeniors}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fForSpecialNeeds}</td>
                    {renderStatus("yes")}
                    {renderStatus("partial")}
                    {renderStatus("partial", "nCognitiveFocus")}
                    {renderStatus("no")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fBilingual}</td>
                    {renderStatus("yes")}
                    {renderStatus("no")}
                    {renderStatus("no")}
                    {renderStatus("no")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fUserEmpowerment}</td>
                    {renderStatus("yes")}
                    {renderStatus("no", "nCaregiverRestricted")}
                    {renderStatus("no")}
                    {renderStatus("no")}
                  </tr>

                  {/* SECTION: PRICING */}
                  <tr style={{ background: "oklch(0.945 0.028 210)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                    <td colSpan={5} style={{ padding: "10px 18px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.45 0.022 245)" }}>
                      {c.secPricing}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fNoHardwareCost}</td>
                    {renderStatus("yes")}
                    {renderStatus("yes")}
                    {renderStatus("no", "nDevice369Upfront")}
                    {renderStatus("yes")}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fNoContract}</td>
                    {renderStatus("yes")}
                    {renderStatus("partial", "nCheckTerms")}
                    {renderStatus("partial", "nCheckTerms")}
                    {renderStatus("yes")}
                  </tr>
                  <tr style={{ borderBottom: "none" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "oklch(0.26 0.028 248)" }}>{c.fMonthlyPrice}</td>
                    <td style={{ padding: "14px 18px", background: "oklch(0.965 0.018 218)", textAlign: "center", fontWeight: "700", color: "oklch(0.34 0.085 244)", borderLeft: "1.5px solid oklch(0.58 0.115 232)", borderRight: "1.5px solid oklch(0.58 0.115 232)" }}>{c.thYouPrice}</td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>{c.thComp1Price}</td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>{c.thComp2Price}</td>
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>{c.nFreeIphoneRequired}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="legend reveal in" style={{ marginTop: "20px", display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "14px" }}>
              <strong style={{ color: "oklch(0.45 0.022 245)", fontSize: "13px" }}>{c.legendTitle}</strong>
              <span className="legend-item"><span style={{ color: "oklch(0.70 0.13 158)", marginRight: "4px" }}>✓</span> {c.legendYes}</span>
              <span className="legend-item"><span style={{ color: "oklch(0.62 0.18 22)", marginRight: "4px" }}>✗</span> {c.legendNo}</span>
              <span className="legend-item"><span style={{ background: "oklch(0.96 0.02 90)", color: "oklch(0.60 0.10 80)", padding: "1px 5px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", marginRight: "4px" }}>~ Partial</span> {c.legendPartial}</span>
            </div>
          </div>
        </section>

        {/* ============== FINAL CTA CARD ============== */}
        <section className="section cta-band" id="cta">
          <div className="wrap">
            <div className="cta-card reveal in" style={{ textAlign: "center" }}>
              <h2 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700 }} id="ctaTitle">{c.ctaTitle}</h2>
              <p style={{ color: "oklch(0.90 0.012 225)", marginTop: "14px" }} id="ctaDesc">{c.ctaDesc}</p>
              <div className="actions" style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                <Link className="btn btn-primary btn-lg" href="/onboarding">{c.ctaBtnPrimary}</Link>
                <Link className="btn btn-ghost btn-lg" href="/" style={{ color: "#fff", borderColor: "rgba(255, 255, 255, 0.5)" }}>{c.ctaBtnGhost}</Link>
              </div>
              <p className="fine" style={{ color: "oklch(0.80 0.012 225)", fontSize: "13px", marginTop: "20px" }} id="ctaFine">{c.ctaFine}</p>
            </div>
          </div>
        </section>
      </main>

      {/* ============== FOOTER ============== */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <Link className="brand" href="/" aria-label="iCanCall home">
                <svg className="logo-main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 553.0305" style={{ height: "32px", width: "auto", display: "block" }}>
                  <style>{`
                    .logo-main .cls-1 { fill: #1c2530; }
                    .logo-main .cls-2 { fill: #4083ae; }
                    .logo-main .cls-3 { fill: #fff; }
                  `}</style>
                  <g>
                    <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z" />
                    <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z" />
                  </g>
                  <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z" />
                </svg>
              </Link>
              <p className="blurb">{t.footer.blurb}</p>
            </div>
            <div>
              <h5>{t.footer.product}</h5>
              <ul>
                <li><Link href="/#how">{t.nav.how}</Link></li>
                <li><Link href="/#features">{t.nav.features}</Link></li>
                <li><Link href="/#pricing">{t.nav.pricing}</Link></li>
                <li><Link href="/#faq">{t.nav.faq}</Link></li>
                <li><Link href="/comparison-chart">{t.footer.comparisonChart}</Link></li>
                <li><Link href="/login">Login</Link></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.who}</h5>
              <ul>
                <li><Link href="/parents">{t.footer.parents}</Link></li>
                <li><Link href="/caregivers">{t.footer.caregivers}</Link></li>
                <li><Link href="/seniors">{t.footer.seniors}</Link></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.company}</h5>
              <ul>
                <li><a href="#">{t.footer.about}</a></li>
                <li><a href="#">{t.footer.careers}</a></li>
                <li><a href="mailto:support@icancall.co">{t.footer.contact}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.trust}</h5>
              <ul>
                <li><Link href="/privacy-policy">{t.footer.privacy}</Link></li>
                <li><a href="#">{t.footer.security}</a></li>
                <li><Link href="/terms-of-service">{t.footer.terms}</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>{t.footer.allRights}</span>
            <span>{t.footer.moments}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
