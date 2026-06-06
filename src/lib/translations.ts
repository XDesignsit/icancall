export interface HomepageTranslations {
  nav: {
    how: string;
    features: string;
    who: string;
    pricing: string;
    faq: string;
    login: string;
    howWorksBtn: string;
    selectPlanBtn: string;
  };
  hero: {
    eyebrow: string;
    titleAccent: string;
    titleRest: string;
    lead: string;
    getStarted: string;
    seeHow: string;
    guarantee: string;
    secure: string;
  };
  stats: {
    routed: string;
    uptime: string;
    setup: string;
  };
  steps: {
    title: string;
    lead: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  demo: {
    eyebrow: string;
    title: string;
    lead: string;
    incomingCall: string;
    connected: string;
    voicemail: string;
    activeCall: string;
    missed: string;
    pressCall: string;
    runningTest: string;
    hangUp: string;
    startSim: string;
    btnCascade: string;
    btnMenu: string;
    routingMode: string;
    available: string;
    offline: string;
    addContact: string;
    namePlaceholder: string;
    relationPlaceholder: string;
    simScreenReady: string;
    simScreenPressCall: string;
    simScreenRinging: string;
    simScreenConnected: string;
    simScreenVoicemail: string;
    simScreenCallEnded: string;
    simExplanationCascade: string;
    simExplanationMenu: string;
  };
  features: {
    title: string;
    lead: string;
    f1Title: string;
    f1Desc: string;
    f2Title: string;
    f2Desc: string;
    f3Title: string;
    f3Desc: string;
    f4Title: string;
    f4Desc: string;
    f5Title: string;
    f5Desc: string;
    f6Title: string;
    f6Desc: string;
  };
  usecases: {
    title: string;
    lead: string;
    u1Title: string;
    u1Desc: string;
    u2Title: string;
    u2Desc: string;
    u3Title: string;
    u3Desc: string;
  };
  pricing: {
    title: string;
    lead: string;
    monthly: string;
    annual: string;
    save20: string;
    billedMonthly: string;
    billedAnnually: string;
    essentialTitle: string;
    essentialDesc: string;
    proTitle: string;
    proDesc: string;
    mostPopular: string;
    selectPlan: string;
    featuresHeader: string;
    eFeat1: string;
    eFeat2: string;
    eFeat3: string;
    eFeat4: string;
    eFeat5: string;
    pFeat1: string;
    pFeat2: string;
    pFeat3: string;
    pFeat4: string;
    pFeat5: string;
    pFeat6: string;
  };
  testimonials: {
    stars: string;
    t1Quote: string;
    t1By: string;
    t1Role: string;
    t2Quote: string;
    t2By: string;
    t2Role: string;
    t3Quote: string;
    t3By: string;
    t3Role: string;
  };
  faq: {
    title: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
  };
  cta: {
    title: string;
    desc: string;
    btn: string;
    fine: string;
  };
  footer: {
    blurb: string;
    product: string;
    company: string;
    trust: string;
    comparisonChart: string;
    who: string;
    parents: string;
    caregivers: string;
    seniors: string;
    about: string;
    careers: string;
    stories: string;
    contact: string;
    privacy: string;
    security: string;
    terms: string;
    allRights: string;
    moments: string;
  };
}

export const translations: Record<"en" | "es", HomepageTranslations> = {
  en: {
    nav: {
      how: "How it works",
      features: "Features",
      who: "Who it's for",
      pricing: "Pricing",
      faq: "FAQ",
      login: "Login",
      howWorksBtn: "See how it works",
      selectPlanBtn: "Select a Plan",
    },
    hero: {
      eyebrow: "Safety on autopilot",
      titleAccent: "One number",
      titleRest: " your loved one will never forget.",
      lead: "iCanCall connects your loved ones to their circle of care without screen time, apps, or complex devices. Starting at $12.99/mo.",
      getStarted: "Get Started",
      seeHow: "See how it works",
      guarantee: "30-day money-back guarantee",
      secure: "Secure and private routing",
    },
    stats: {
      routed: "Calls Routed",
      uptime: "Telephony Uptime",
      setup: "Setup Time",
    },
    steps: {
      title: "As simple as 1, 2, 3",
      lead: "Setting up iCanCall takes under 5 minutes. No hardware to configure, no apps for the caller to download.",
      step1Title: "1. Get a dedicated number",
      step1Desc: "We assign a clean virtual safety number in your local area code. No hardware needed.",
      step2Title: "2. Configure your circle",
      step2Desc: "Add up to 6 trusted contacts (caregivers, family, support) and set how calls ring.",
      step3Title: "3. Give them the number",
      step3Desc: "Your loved one dials the number on any phone. Calls route instantly to your circle.",
    },
    demo: {
      eyebrow: "Experience the routing",
      title: "See it in action",
      lead: "Simulate a call to see how iCanCall cascades or displays a dialer menu.",
      incomingCall: "Incoming call",
      connected: "Connected",
      voicemail: "Voicemail",
      activeCall: "Active Call",
      missed: "Missed",
      pressCall: "Press call to start routing",
      runningTest: "Running a test call...",
      hangUp: "Hang up",
      startSim: "Run a test call",
      btnCascade: "Call Cascade",
      btnMenu: "Caller Menu",
      routingMode: "Routing Mode",
      available: "Available",
      offline: "Offline",
      addContact: "Add Member",
      namePlaceholder: "Name (e.g. Dad)",
      relationPlaceholder: "Relationship",
      simScreenReady: "Ready",
      simScreenPressCall: "Press call to start routing",
      simScreenRinging: "Ringing...",
      simScreenConnected: "Connected",
      simScreenVoicemail: "Recording Voicemail...",
      simScreenCallEnded: "Call Ended",
      simExplanationCascade: "Calls ring each available caregiver sequentially. If one doesn't answer, it cascades to the next.",
      simExplanationMenu: "The caller hears a spoken menu (e.g., 'Press 1 for Sarah, Press 2 for David') and picks who to reach.",
    },
    features: {
      title: "Everything you need to keep them connected",
      lead: "Smart, secure phone routing designed specifically for the needs of seniors, kids, and caregivers.",
      f1Title: "Call Cascade",
      f1Desc: "Rings your list of caregivers sequentially. If the first doesn't answer, it automatically flows to the next.",
      f2Title: "Caller Menu",
      f2Desc: "Provides a spoken menu (e.g., 'Press 1 for Mom, Press 2 for Son') so the caller easily controls who they reach.",
      f3Title: "Around-the-Clock Coverage",
      f3Desc: "Set a calendar schedule for caregivers. Calls route automatically to the active caregiver based on time-of-day.",
      f4Title: "Instant Alerts",
      f4Desc: "Receive real-time SMS and email notifications when a call is initiated, missed, or routed to voicemail.",
      f5Title: "Voicemail & Transcription",
      f5Desc: "If no one answers, callers can leave a voicemail. We immediately transcribe it and email it to all caregivers.",
      f6Title: "Remote Management",
      f6Desc: "Add contacts, change routing modes, and view call history in real-time from any device via your secure dashboard.",
    },
    usecases: {
      title: "Designed for the moments that matter",
      lead: "iCanCall fits uniquely into the lives of families needing simple, screen-free safety communication.",
      u1Title: "For Kids",
      u1Desc: "Empower kids to reach family from any home phone, landline, or basic phone, without the distractions of a smartphone.",
      u2Title: "For Seniors",
      u2Desc: "A lifeline for elderly parents or grandparents. They only have to remember one number to reach their entire family.",
      u3Title: "For Special Needs",
      u3Desc: "Simplifies communication for individuals with cognitive or physical impairments, giving them direct access to support.",
    },
    pricing: {
      title: "Simple, transparent pricing",
      lead: "Select the plan that fits your family's needs. Cancel, upgrade, or downgrade at any time.",
      monthly: "Monthly Billing",
      annual: "Annual Billing",
      save20: "Save 20%",
      billedMonthly: "billed monthly",
      billedAnnually: "billed annually",
      essentialTitle: "Essential Plan",
      essentialDesc: "Perfect for single-family setups and basic sequential routing.",
      proTitle: "Pro Plan",
      proDesc: "Ideal for active care groups needing schedule routing and menus.",
      mostPopular: "Most Popular",
      selectPlan: "Select Plan",
      featuresHeader: "Everything included in the plan:",
      eFeat1: "1 Dedicated Safety Number",
      eFeat2: "Up to 3 Roster Contacts",
      eFeat3: "Call Cascade (Sequential)",
      eFeat4: "Real-time Email Alerts",
      eFeat5: "Standard voicemail box",
      pFeat1: "2 Dedicated Safety Numbers",
      pFeat2: "Up to 6 Roster Contacts",
      pFeat3: "Cascade & Caller Menu (IVR)",
      pFeat4: "Time-of-day Scheduling",
      pFeat5: "Instant Voicemail Email Transcriptions",
      pFeat6: "Bilingual Greeting Options",
    },
    testimonials: {
      stars: "★★★★★",
      t1Quote: "\"iCanCall has been a lifesaver. My 8-year-old knows he can call one single number to reach me, his dad, or his grandmother without having to manage a cell phone of his own.\"",
      t1By: "Sarah Jenkins",
      t1Role: "Parent of Leo",
      t2Quote: "\"My mother has mild dementia and struggles with smartphones. With iCanCall, she has one speed-dial button on her landline that always connects to whichever family member is currently on duty.\"",
      t2By: "Robert Vance",
      t2Role: "Caregiver for Helen",
      t3Quote: "\"Setup took less than five minutes. The voicemail transcriptions are incredibly helpful for our caregiver group to stay coordinated on my father's calls.\"",
      t3By: "Amanda Lopez",
      t3Role: "Daughter of Hector",
    },
    faq: {
      title: "Frequently Asked Questions",
      q1: "Do I need to buy any special hardware or devices?",
      a1: "No. iCanCall is a virtual phone routing service. It runs entirely in the cloud. Your loved one can call your dedicated iCanCall number from any existing phone (landline, flip phone, smartphone, etc.), and the service routes it directly to the caregivers' existing phone numbers.",
      q2: "Can I add more than one safety number?",
      a2: "Yes. The Essential Plan comes with 1 number, and the Pro Plan comes with 2 numbers. You can purchase additional dedicated virtual numbers on the Pro plan for $3.99/month per number directly from your dashboard.",
      q3: "How does the Call Cascade work?",
      a3: "With Call Cascade, we ring the contacts in your circle one by one in the order you set. If the first person doesn't answer or is busy, the call automatically cascades to the next person, and so on. If no one answers, the caller is prompted to leave a voicemail.",
      q4: "Is there a setup fee or contract?",
      a4: "No. There are absolutely no setup fees, activation costs, or contracts. All plans are billed month-to-month (or annually) and you can cancel at any time with a single click from your billing page.",
    },
    cta: {
      title: "Ready to secure your family?",
      desc: "Give your loved ones the safety and simplicity of iCanCall today. Set up in under 5 minutes.",
      btn: "Get Started Now",
      fine: "Set up in minutes · No setup fees · Cancel anytime",
    },
    footer: {
      blurb: "One memorable number that always connects to the people who matter most. Safety on autopilot.",
      product: "Product",
      company: "Company",
      trust: "Trust",
      comparisonChart: "Comparison Chart",
      who: "Who",
      parents: "Parents",
      caregivers: "Caregivers",
      seniors: "Seniors",
      about: "About",
      careers: "Careers",
      stories: "Stories",
      contact: "Contact",
      privacy: "Privacy",
      security: "Security",
      terms: "Terms",
      allRights: "© 2026 iCanCall, Inc. All rights reserved.",
      moments: "Made for the moments that matter.",
    },
  },
  es: {
    nav: {
      how: "Cómo funciona",
      features: "Funciones",
      who: "Para quién es",
      pricing: "Precios",
      faq: "Preguntas",
      login: "Iniciar Sesión",
      howWorksBtn: "Ver cómo funciona",
      selectPlanBtn: "Elegir un Plan",
    },
    hero: {
      eyebrow: "Seguridad en piloto automático",
      titleAccent: "Un solo número",
      titleRest: " que su ser querido nunca olvidará.",
      lead: "iCanCall conecta a sus seres queridos con su círculo de apoyo sin necesidad de pantallas, aplicaciones o dispositivos complejos. Desde $12.99/mes.",
      getStarted: "Comenzar",
      seeHow: "Ver cómo funciona",
      guarantee: "Garantía de reembolso de 30 días",
      secure: "Enrutamiento seguro y privado",
    },
    stats: {
      routed: "Llamadas Enrutadas",
      uptime: "Tiempo de Actividad",
      setup: "Tiempo de Configuración",
    },
    steps: {
      title: "Tan simple como 1, 2, 3",
      lead: "Configurar iCanCall toma menos de 5 minutos. Sin hardware que configurar, ni aplicaciones que descargar para quien llama.",
      step1Title: "1. Obtenga un número dedicado",
      step1Desc: "Le asignamos un número de seguridad virtual en su código de área local. Sin necesidad de hardware.",
      step2Title: "2. Configure su círculo",
      step2Desc: "Agregue hasta 6 contactos de confianza (cuidadores, familia) y configure cómo suenan las llamadas.",
      step3Title: "3. Deles el número",
      step3Desc: "Su ser querido marca el número desde cualquier teléfono. La llamada se enruta al instante a su círculo.",
    },
    demo: {
      eyebrow: "Experimente el enrutamiento",
      title: "Véalo en acción",
      lead: "Simule una llamada para ver cómo iCanCall enruta en cascada o muestra un menú de marcado.",
      incomingCall: "Llamada entrante",
      connected: "Conectado",
      voicemail: "Buzón de voz",
      activeCall: "Llamada Activa",
      missed: "Perdida",
      pressCall: "Presione llamar para iniciar",
      runningTest: "Realizando llamada de prueba...",
      hangUp: "Colgar",
      startSim: "Llamada de prueba",
      btnCascade: "Llamada en Cascada",
      btnMenu: "Menú de Opciones",
      routingMode: "Modo de Enrutamiento",
      available: "Disponible",
      offline: "Desconectado",
      addContact: "Agregar Miembro",
      namePlaceholder: "Nombre (ej. Papá)",
      relationPlaceholder: "Relación",
      simScreenReady: "Listo",
      simScreenPressCall: "Presione llamar para iniciar",
      simScreenRinging: "Llamando...",
      simScreenConnected: "Conectado",
      simScreenVoicemail: "Grabando Buzón...",
      simScreenCallEnded: "Llamada Finalizada",
      simExplanationCascade: "Las llamadas suenan para cada cuidador disponible de forma secuencial. Si uno no responde, pasa al siguiente.",
      simExplanationMenu: "El usuario escucha un menú hablado (ej., 'Marque 1 para Sarah, Marque 2 para David') y elige con quién comunicarse.",
    },
    features: {
      title: "Todo lo que necesita para mantenerlos conectados",
      lead: "Enrutamiento telefónico inteligente y seguro diseñado específicamente para niños, personas mayores y cuidadores.",
      f1Title: "Llamada en Cascada",
      f1Desc: "Llama a su lista de cuidadores secuencialmente. Si el primero no responde, fluye automáticamente al siguiente.",
      f2Title: "Menú de Opciones",
      f2Desc: "Ofrece un menú hablado (ej., 'Marque 1 para mamá, Marque 2 para hijo') para que el usuario controle a quién contacta.",
      f3Title: "Cobertura las 24 Horas",
      f3Desc: "Establezca un horario para los cuidadores. Las llamadas se enrutan automáticamente al cuidador activo según la hora del día.",
      f4Title: "Alertas Instantáneas",
      f4Desc: "Reciba notificaciones por SMS y correo electrónico en tiempo real cuando se inicia, se pierde o se graba una llamada.",
      f5Title: "Buzón de Voz y Transcripción",
      f5Desc: "Si nadie responde, pueden dejar un mensaje. Lo transcribimos de inmediato y lo enviamos a todos los cuidadores.",
      f6Title: "Gestión Remota",
      f6Desc: "Agregue contactos, cambie modos de enrutamiento y vea el historial de llamadas en tiempo real desde cualquier dispositivo.",
    },
    usecases: {
      title: "Diseñado para los momentos importantes",
      lead: "iCanCall se adapta de manera única a las familias que necesitan una comunicación de seguridad simple y libre de pantallas.",
      u1Title: "Para Niños",
      u1Desc: "Permite a los niños comunicarse con la familia desde cualquier teléfono de casa, sin las distracciones de un smartphone.",
      u2Title: "Para Personas Mayores",
      u2Desc: "Una línea de vida para padres o abuelos. Solo tienen que recordar un número para comunicarse con toda la familia.",
      u3Title: "Para Necesidades Especiales",
      u3Desc: "Simplifica la comunicación para personas con dificultades cognitivas o físicas, dándoles acceso directo a apoyo.",
    },
    pricing: {
      title: "Precios simples y transparentes",
      lead: "Seleccione el plan que mejor se adapte a su familia. Cancele, aumente o disminuya su plan en cualquier momento.",
      monthly: "Facturación Mensual",
      annual: "Facturación Anual",
      save20: "Ahorre 20%",
      billedMonthly: "facturado mensualmente",
      billedAnnually: "facturado anualmente",
      essentialTitle: "Plan Esencial",
      essentialDesc: "Perfecto para configuraciones de una sola familia y enrutamiento secuencial básico.",
      proTitle: "Plan Pro",
      proDesc: "Ideal para grupos de cuidado activos que necesitan enrutamiento por horarios y menús.",
      mostPopular: "Más Popular",
      selectPlan: "Elegir Plan",
      featuresHeader: "Todo lo incluido en el plan:",
      eFeat1: "1 Número de Seguridad Dedicado",
      eFeat2: "Hasta 3 Contactos en la Lista",
      eFeat3: "Llamada en Cascada (Secuencial)",
      eFeat4: "Alertas por Correo en Tiempo Real",
      eFeat5: "Buzón de voz estándar",
      pFeat1: "2 Números de Seguridad Dedicados",
      pFeat2: "Hasta 6 Contactos en la Lista",
      pFeat3: "Cascada y Menú de Opciones (IVR)",
      pFeat4: "Enrutamiento por Horario del Día",
      pFeat5: "Transcripciones de Voz por Correo al Instante",
      pFeat6: "Opciones de Saludo Bilingües",
    },
    testimonials: {
      stars: "★★★★★",
      t1Quote: "\"iCanCall ha sido un salvavidas. Mi hijo de 8 años sabe que puede llamar a un solo número para comunicarse conmigo, con su papá o con su abuela sin tener un celular propio.\"",
      t1By: "Sarah Jenkins",
      t1Role: "Madre de Leo",
      t2Quote: "\"Mi madre tiene demencia leve y le cuesta usar smartphones. Con iCanCall, tiene un botón de marcado rápido en su teléfono fijo que siempre conecta al familiar de guardia.\"",
      t2By: "Robert Vance",
      t2Role: "Cuidador de Helen",
      t3Quote: "\"La configuración tomó menos de cinco minutos. Las transcripciones de voz son increíblemente útiles para mantenernos coordinados con las llamadas de mi padre.\"",
      t3By: "Amanda Lopez",
      t3Role: "Hija de Héctor",
    },
    faq: {
      title: "Preguntas Frecuentes",
      q1: "¿Necesito comprar algún dispositivo o hardware especial?",
      a1: "No. iCanCall es un servicio virtual en la nube. Su ser querido puede llamar desde cualquier teléfono existente (fijo, básico, smartphone, etc.), y nuestro servicio lo enruta directamente a los números de teléfono actuales de los cuidadores.",
      q2: "¿Puedo agregar más de un número de seguridad?",
      a2: "Sí. El Plan Esencial incluye 1 número y el Plan Pro incluye 2. Puede comprar números virtuales dedicados adicionales en el plan Pro por $3.99/mes por número directamente desde su panel.",
      q3: "¿Cómo funciona la Llamada en Cascada?",
      a3: "Con la llamada en cascada, llamamos a los contactos de su círculo uno por uno en el orden establecido. Si la primera persona no responde, la llamada pasa automáticamente a la siguiente. Si nadie responde, se les pide dejar un buzón de voz.",
      q4: "¿Hay algún contrato o tarifa de configuración?",
      a4: "No. No hay tarifas de activación ni contratos de permanencia. Todos los planes son de mes a mes (o anuales) y puede cancelar en cualquier momento con un solo clic desde su panel.",
    },
    cta: {
      title: "¿Listo para proteger a su familia?",
      desc: "Brinde a sus seres queridos la seguridad y simplicidad de iCanCall hoy. Se configura en menos de 5 minutos.",
      btn: "Comenzar Ahora",
      fine: "Configuración en minutos · Sin tarifas ocultas · Cancele cuando quiera",
    },
    footer: {
      blurb: "Un número memorable que siempre conecta con las personas más importantes. Seguridad en piloto automático.",
      product: "Producto",
      company: "Compañía",
      trust: "Confianza",
      comparisonChart: "Tabla Comparativa",
      who: "Quiénes",
      parents: "Padres",
      caregivers: "Cuidadores",
      seniors: "Adultos Mayores",
      about: "Sobre Nosotros",
      careers: "Empleos",
      stories: "Historias",
      contact: "Contacto",
      privacy: "Privacidad",
      security: "Seguridad",
      terms: "Condiciones",
      allRights: "© 2026 iCanCall, Inc. Todos los derechos reservados.",
      moments: "Hecho para los momentos que importan.",
    },
  },
};
