export const HC_UNIT_EDITIONS = [
  { value: 'xm97', label: 'X-men 97' },
  { value: 'll', label: 'Lantern Legacy' },
  { value: 'sd', label: 'Smash Destroy' },
  { value: 'spv', label: 'Spider-Verse' },
  { value: 'cltr', label: 'Collectors Trove' },
  { value: 'bp', label: 'Black Phanter' },
  { value: 'mot', label: 'Masters of Time' },
  { value: 'd400', label: 'DC 400' },
  { value: 'm400', label: 'Marvel 400' },
  { value: 'wk', label: 'Wiz Kids 2025' },
  { value: 'wkd', label: 'Wiz Kids DC 2025' },
  { value: 'wkm', label: 'Wiz Kids Marvel 2025' },
  { value: 'dndicn', label: 'Dungeons and Dragons' },
  { value: 'd25', label: 'DC Starter 2025' },
  { value: 'm25', label: 'Marvel Starter 2025' },
  { value: 'wbicn', label: 'Warner Bros Iconix' },
  { value: 'wk', label: 'Wiz Kids 2024' },
  { value: 'wkd', label: 'Wiz Kids DC 2024' },
  { value: 'wkm', label: 'Wiz Kids Marvel 2024' },
  { value: 'wk', label: 'Wiz Kids 2023' },
  { value: 'wkd', label: 'Wiz Kids DC 2023' },
  { value: 'wkm', label: 'Wiz Kids Marvel 2023' },
  { value: 'dicn', label: 'DC Iconix' },
  { value: 'micn', label: 'Marvel Iconix' },
  { value: 'wk', label: 'Standard Game Pieces' },
  { value: 'dwx', label: 'Deadpool Weapon X' },
  { value: 'hgpc2', label: 'Hellfire Gala 2' },
  { value: 'msnp', label: 'Marvel Studio Next Phase' },
  { value: 'gotghc', label: 'Guardians of the galaxy Holiday' },
  { value: 'wov', label: 'Wheels of Vegence' },
  { value: 'not', label: 'Notorious' },
  { value: 'av60', label: 'Avengers 60th' },
  { value: 'smba', label: 'Spider-Man: Beyond Amazing' },
  { value: 'btu', label: 'Batman Team-Up' },
  { value: 'av4e', label: 'Avengers Forever' },
  { value: 'hgpc', label: 'Hellfire Gala' },
  { value: 'xmxssop', label: 'X-men: X of Sword OP' },
  { value: 'xmxs', label: 'X-men: X of Sword' },
  { value: 'msdp', label: 'Marvel Disney Plus' },
  { value: 'wotr', label: 'Avengers: War of The Realms' },
  { value: 'ffwotr', label: 'Fast Forces: Avengers: War of The Realms' },
];

export const getUnitImageUrl = (collection: string, unitNumber: string) => {
  return `https://storage.googleapis.com/static.hcunits.net/images/set/${collection}/${unitNumber}.png`;
};

export const getCollectionIconUrl = (collection: string) => {
  return `https://storage.googleapis.com/static.hcunits.net/images/set/${collection}/icon.svg`;
};

export const getCollectionLabel = (value: string) => {
  const edition = HC_UNIT_EDITIONS.find(ed => ed.value === value);
  return edition?.label || value;
};