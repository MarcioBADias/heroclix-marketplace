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
  { value: 'wk25', label: 'Wiz Kids 2025' },
  { value: 'wkd25', label: 'Wiz Kids DC 2025' },
  { value: 'wkm25', label: 'Wiz Kids Marvel 2025' },
  { value: 'dndicn', label: 'Dungeons and Dragons' },
  { value: 'd25', label: 'DC Starter 2025' },
  { value: 'm25', label: 'Marvel Starter 2025' },
  { value: 'wbicn', label: 'Warner Bros Iconix' },
  { value: 'wk24', label: 'Wiz Kids 2024' },
  { value: 'wkd24', label: 'Wiz Kids DC 2024' },
  { value: 'wkm24', label: 'Wiz Kids Marvel 2024' },
  { value: 'wk23', label: 'Wiz Kids 2023' },
  { value: 'wkd23', label: 'Wiz Kids DC 2023' },
  { value: 'wkm23', label: 'Wiz Kids Marvel 2023' },
  { value: 'dicn', label: 'DC Iconix' },
  { value: 'micn', label: 'Marvel Iconix' },
  { value: 'wk', label: 'Standard Game Pieces' },
];

export const getUnitImageUrl = (collection: string, unitNumber: string) => {
  return `https://hcunits.net/static/images/set/${collection}/${unitNumber}.png`;
};

export const getCollectionIconUrl = (collection: string) => {
  return `https://hcunits.net/static/images/set/${collection}/icon.svg`;
};

export const getCollectionLabel = (value: string) => {
  const edition = HC_UNIT_EDITIONS.find(ed => ed.value === value);
  return edition?.label || value;
};

export const fetchUnitFromAPI = async (collection: string, unitNumber: string) => {
  try {
    const response = await fetch(`https://hcunits.net/api/v1/units/${collection}${unitNumber}/`);
    if (!response.ok) {
      throw new Error('Unit not found');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
