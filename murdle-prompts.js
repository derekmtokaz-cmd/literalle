const MURDLE_PROMPTS = [
  {
    id: "veyne",
    line: "Whan that Aprill with his shoures soote\nThe droghte of March hath perced to the roote,\nAnd bathed every veyne in swich licour\nOf which vertu engendred is the flour;",
    displayLine: "Whan that Aprill with his shoures soote\nThe droghte of March hath perced to the roote,\nAnd bathed every XXXXX in swich licour\nOf which vertu engendred is the flour;",
    answer: "veyne"
  },
  {
    id: "yonge",
    line: "Whan Zephirus eek with his swete breeth\nInspired hath in every holt and heeth\nThe tendre croppes, and the yonge sonne\nHath in the Ram his halfe cours y-ronne,",
    displayLine: "Whan Zephirus eek with his swete breeth\nInspired hath in every holt and heeth\nThe tendre croppes, and the XXXXX sonne\nHath in the Ram his halfe cours y-ronne,",
    answer: "yonge"
  },
  {
    id: "nyght-foweles",
    line: "And smale foweles maken melodye,\nThat slepen al the nyght with open ye,\nSo priketh hem Nature in hir corages,\nThanne longen folk to goon on pilgrimages,",
    displayLine: "And smale foweles maken melodye,\nThat slepen al the XXXXX with open ye,\nSo priketh hem Nature in hir corages,\nThanne longen folk to goon on pilgrimages,",
    answer: "nyght"
  },
  {
    id: "ferne",
    line: "And palmeres for to seken straunge strondes,\nTo ferne halwes, kowthe in sondry londes;\nAnd specially, from every shires ende\nOf Engelond, to Caunterbury they wende,",
    displayLine: "And palmeres for to seken straunge strondes,\nTo XXXXX halwes, kowthe in sondry londes;\nAnd specially, from every shires ende\nOf Engelond, to Caunterbury they wende,",
    answer: "ferne"
  },
  {
    id: "seson",
    line: "Bifil that in that seson on a day,\nIn Southwerk at the Tabard as I lay,\nRedy to wenden on my pilgrymage\nTo Caunterbury with ful devout corage,",
    displayLine: "Bifil that in that XXXXX on a day,\nIn Southwerk at the Tabard as I lay,\nRedy to wenden on my pilgrymage\nTo Caunterbury with ful devout corage,",
    answer: "seson"
  },
  {
    id: "nyght-hostelrye",
    line: "At nyght were come into that hostelrye\nWel nyne and twenty in a compaignye\nOf sondry folk, by aventure y-falle\nIn felaweshipe, and pilgrimes were they alle,",
    displayLine: "At XXXXX were come into that hostelrye\nWel nyne and twenty in a compaignye\nOf sondry folk, by aventure y-falle\nIn felaweshipe, and pilgrimes were they alle,",
    answer: "nyght"
  },
  {
    id: "sonne",
    line: "That toward Caunterbury wolden ryde.\nThe chambres and the stables weren wyde,\nAnd wel we weren esed atte beste.\nAnd shortly, whan the sonne was to reste,",
    displayLine: "That toward Caunterbury wolden ryde.\nThe chambres and the stables weren wyde,\nAnd wel we weren esed atte beste.\nAnd shortly, whan the XXXXX was to reste,",
    answer: "sonne"
  },
  {
    id: "hadde",
    line: "So hadde I spoken with hem everychon,\nThat I was of hir felaweshipe anon,\nAnd made forward erly for to ryse,\nTo take oure wey, ther as I yow devyse.",
    displayLine: "So XXXXX I spoken with hem everychon,\nThat I was of hir felaweshipe anon,\nAnd made forward erly for to ryse,\nTo take oure wey, ther as I yow devyse.",
    answer: "hadde"
  },
  {
    id: "telle",
    line: "But nathelees, whil I have tyme and space,\nEr that I ferther in this tale pace,\nMe thynketh it acordaunt to resoun\nTo telle yow al the condicioun",
    displayLine: "But nathelees, whil I have tyme and space,\nEr that I ferther in this tale pace,\nMe thynketh it acordaunt to resoun\nTo XXXXX yow al the condicioun",
    answer: "telle"
  },
  {
    id: "weren",
    line: "Of ech of hem, so as it semed me,\nAnd whiche they weren and of what degree,\nAnd eek in what array that they were inne;\nAnd at a Knyght than wol I first bigynne.",
    displayLine: "Of ech of hem, so as it semed me,\nAnd whiche they XXXXX and of what degree,\nAnd eek in what array that they were inne;\nAnd at a Knyght than wol I first bigynne.",
    answer: "weren"
  },
  {
    id: "riden",
    line: "A Knyght ther was, and that a worthy man,\nThat fro the tyme that he first bigan\nTo riden out, he loved chivalrie,\nTrouthe and honour, fredom and curteisie.",
    displayLine: "A Knyght ther was, and that a worthy man,\nThat fro the tyme that he first bigan\nTo XXXXX out, he loved chivalrie,\nTrouthe and honour, fredom and curteisie.",
    answer: "riden"
  },
  {
    id: "hadde-lordes-werre",
    line: "Ful worthy was he in his lordes werre,\nAnd thereto hadde he riden, no man ferre,\nAs wel in cristendom as in hethenesse,\nAnd evere honoured for his worthynesse.",
    displayLine: "Ful worthy was he in his lordes werre,\nAnd thereto XXXXX he riden, no man ferre,\nAs wel in cristendom as in hethenesse,\nAnd evere honoured for his worthynesse.",
    answer: "hadde"
  },
  {
    id: "hadde-bord",
    line: "At Alisaundre he was whan it was wonne;\nFul ofte tyme he hadde the bord bigonne\nAboven alle nacions in Pruce.\nIn Lettow hadde he reysed and in Ruce,",
    displayLine: "At Alisaundre he was whan it was wonne;\nFul ofte tyme he XXXXX the bord bigonne\nAboven alle nacions in Pruce.\nIn Lettow hadde he reysed and in Ruce,",
    answer: "hadde"
  },
  {
    id: "seege",
    line: "No cristen man so ofte of his degree.\nIn Gernade at the seege eek hadde he be\nOf Algezir, and riden in Belmarye.\nAt Lyeys was he, and at Satalye,",
    displayLine: "No cristen man so ofte of his degree.\nIn Gernade at the XXXXX eek hadde he be\nOf Algezir, and riden in Belmarye.\nAt Lyeys was he, and at Satalye,",
    answer: "seege"
  },
  {
    id: "feith",
    line: "At mortal batailles hadde he been fiftene,\nAnd foughten for oure feith at Tramyssene\nIn lyste thries, and ay slayn his foo.\nThis ilke worthy knyght hadde been also",
    displayLine: "At mortal batailles hadde he been fiftene,\nAnd foughten for oure XXXXX at Tramyssene\nIn lyste thries, and ay slayn his foo.\nThis ilke worthy knyght hadde been also",
    answer: "feith"
  },
  {
    id: "agayn",
    line: "Somtyme with the lord of Palatye\nAgayn another hethen in Turkye;\nAnd evermoore he hadde a sovereyn prys.\nAnd though that he were worthy, he was wys,",
    displayLine: "Somtyme with the lord of Palatye\nXXXXX another hethen in Turkye;\nAnd evermoore he hadde a sovereyn prys.\nAnd though that he were worthy, he was wys,",
    answer: "agayn"
  },
  {
    id: "meeke",
    line: "And of his port as meeke as is a mayde.\nHe nevere yet no vileynye ne sayde,\nIn al his lyf, unto no maner wight.\nHe was a verray, parfit, gentil knyght.",
    displayLine: "And of his port as XXXXX as is a mayde.\nHe nevere yet no vileynye ne sayde,\nIn al his lyf, unto no maner wight.\nHe was a verray, parfit, gentil knyght.",
    answer: "meeke"
  }
];
