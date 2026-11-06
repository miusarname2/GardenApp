import { ImageSourcePropType } from 'react-native';

export const PLANT_IMAGE_OPTIONS: { id: string; label: string; source: ImageSourcePropType }[] = [
  { id: 'garden', label: 'Planta verde', source: require('../assets/images/unnamed.png') },
  { id: 'monstera', label: 'Monstera', source: require('../assets/images/unnamed1.png') },
];

export function getPlantImageSource(image: string): ImageSourcePropType {
  const preset = PLANT_IMAGE_OPTIONS.find((option) => option.id === image);
  return preset?.source ?? { uri: image };
}
