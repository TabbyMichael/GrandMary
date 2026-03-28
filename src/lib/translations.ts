export type Locale = "en" | "sw";

export const translations = {
  en: {
    // Nav
    nav: {
      story: "Story",
      timeline: "Timeline",
      tributes: "Tributes",
      lightCandle: "Light a Candle",
    },
    // Hero
    hero: {
      subtitle: "The Living Legacy of",
      tagline: "A life beautifully lived \u00B7 Forever in our hearts",
      candlesLit: "candles lit in her memory",
    },
    // Biography
    bio: {
      label: "Her Story",
      title: "In Her Own Words",
      quote:
        "\u201CThe best thing I ever planted was not in my garden \u2014 it was love in my children\u2019s hearts.\u201D",
      p1: "Mary Wangui was a woman of quiet strength and boundless generosity. Born in the highlands of Central Kenya, she grew up learning the rhythms of the land \u2014 when to plant, when to harvest, and when to simply be still and listen.",
      p2: "She married young and built a home that became the heart of her community. Her kitchen was never empty, and her counsel was sought by neighbors and strangers alike. She had a gift for making everyone feel seen, heard, and valued.",
      p3: "In her later years, Mary found deep joy in her garden, her grandchildren, and the simple beauty of each new morning. She believed that every day was a gift, and she lived accordingly \u2014 with grace, with purpose, and with an unshakeable faith that love is the only thing that truly endures.",
    },
    // Timeline
    timeline: {
      label: "Her Journey",
      title: "A Life in Chapters",
      milestones: [
        {
          year: "Early Years",
          title: "A Childhood in the Highlands",
          description:
            "Born into the rolling green hills, Mary grew up surrounded by the beauty of nature. Her love for the land and its people began here \u2014 a foundation that would shape everything she became.",
        },
        {
          year: "Family Years",
          title: "The Heart of the Home",
          description:
            "Mary built a family rooted in love, laughter, and togetherness. Her table was never empty, her door never closed. Every gathering was a celebration, and she was always at the center \u2014 the warmth everyone gravitated toward.",
        },
        {
          year: "Later Years",
          title: "A Garden of Grace",
          description:
            "In her quieter years, Mary found peace in her garden and in the gentle rhythm of each day. She tended her flowers with the same care she gave to everyone around her \u2014 patiently, lovingly, beautifully.",
        },
      ],
    },
    // Tributes
    tributes: {
      label: "Words of Love",
      title: "Tribute Wall",
      shareTitle: "Share a Memory",
      namePlaceholder: "Your name",
      relationshipPlaceholder: "Your relationship (e.g., Granddaughter)",
      messagePlaceholder: "Share your memory of Mary...",
      submitButton: "Leave a Tribute",
      successToast: "Thank you for your tribute. It will appear once approved.",
      relationships: {
        granddaughter: "Granddaughter",
        son: "Son",
        neighbor: "Neighbor & Friend",
        grandson: "Grandson",
      },
    },
    // Candle
    candle: {
      title: "Light a Candle",
      count: "candles have been lit in memory of Mary Wangui",
      button: "Light a Candle",
      lit: "Your candle is burning \u2728",
      toast: "Your candle has been lit for Mary. Thank you. \uD83D\uDD6F\uFE0F",
    },
    // Footer
    footer: {
      tagline: "Forever in our hearts",
      credit: "Made with love by her family",
    },
  },
  sw: {
    nav: {
      story: "Hadithi",
      timeline: "Ratiba",
      tributes: "Shukrani",
      lightCandle: "Washa Mshumaa",
    },
    hero: {
      subtitle: "Urithi Hai wa",
      tagline: "Maisha yaliyoishi kwa uzuri \u00B7 Milele moyoni mwetu",
      candlesLit: "mishumaa imewashwa kwa kumbukumbu yake",
    },
    bio: {
      label: "Hadithi Yake",
      title: "Kwa Maneno Yake Mwenyewe",
      quote:
        "\u201CKitu bora zaidi nilichopanda hakikuwa bustanini \u2014 kilikuwa upendo moyoni mwa watoto wangu.\u201D",
      p1: "Mary Wangui alikuwa mwanamke wa nguvu tulivu na ukarimu usio na mipaka. Alizaliwa katika milima ya Kenya ya Kati, akakua akijifunza midundo ya ardhi \u2014 wakati wa kupanda, wakati wa kuvuna, na wakati wa kutulia na kusikiliza tu.",
      p2: "Alioa akiwa mdogo na akajenga nyumba iliyokuwa moyo wa jamii yake. Jiko lake halikuwa tupu kamwe, na ushauri wake ulitafutwa na majirani na wageni. Alikuwa na kipaji cha kumfanya kila mtu ajisikie kuonekana, kusikika, na kuthaminiwa.",
      p3: "Katika miaka yake ya mwisho, Mary alipata furaha kubwa katika bustani yake, wajukuu wake, na uzuri wa kila asubuhi mpya. Aliamini kwamba kila siku ni zawadi, na aliishi hivyo \u2014 kwa neema, kwa kusudi, na kwa imani isiyotikisika kwamba upendo ndio kitu pekee kinachobaki milele.",
    },
    timeline: {
      label: "Safari Yake",
      title: "Maisha kwa Sura",
      milestones: [
        {
          year: "Miaka ya Awali",
          title: "Utoto Katika Milima",
          description:
            "Alizaliwa katika vilima vya kijani, Mary alikua akizungukwa na uzuri wa asili. Upendo wake kwa ardhi na watu wake ulianza hapa \u2014 msingi ulioendelea kuunda kila alichokuwa.",
        },
        {
          year: "Miaka ya Familia",
          title: "Moyo wa Nyumba",
          description:
            "Mary alijenga familia iliyojengwa juu ya upendo, kicheko, na umoja. Meza yake haikuwa tupu kamwe, mlango wake haukufungwa. Kila mkusanyiko ulikuwa sherehe, na yeye alikuwa daima katikati \u2014 joto ambalo kila mtu alivutiwa nalo.",
        },
        {
          year: "Miaka ya Baadaye",
          title: "Bustani ya Neema",
          description:
            "Katika miaka yake ya utulivu, Mary alipata amani katika bustani yake na katika mdundo mpole wa kila siku. Alitunza maua yake kwa utunzaji ule ule alioupa kila mtu karibu naye \u2014 kwa subira, kwa upendo, kwa uzuri.",
        },
      ],
    },
    tributes: {
      label: "Maneno ya Upendo",
      title: "Ukuta wa Shukrani",
      shareTitle: "Shiriki Kumbukumbu",
      namePlaceholder: "Jina lako",
      relationshipPlaceholder: "Uhusiano wako (mf., Mjukuu)",
      messagePlaceholder: "Shiriki kumbukumbu yako ya Mary...",
      submitButton: "Acha Shukrani",
      successToast: "Asante kwa shukrani yako. Itaonekana baada ya kuidhinishwa.",
      relationships: {
        granddaughter: "Mjukuu (Msichana)",
        son: "Mwana",
        neighbor: "Jirani na Rafiki",
        grandson: "Mjukuu (Mvulana)",
      },
    },
    candle: {
      title: "Washa Mshumaa",
      count: "mishumaa imewashwa kwa kumbukumbu ya Mary Wangui",
      button: "Washa Mshumaa",
      lit: "Mshumaa wako unawaka \u2728",
      toast: "Mshumaa wako umewashwa kwa Mary. Asante. \uD83D\uDD6F\uFE0F",
    },
    footer: {
      tagline: "Milele moyoni mwetu",
      credit: "Imetengenezwa kwa upendo na familia yake",
    },
  },
} as const;
