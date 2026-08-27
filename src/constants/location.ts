export const TANAMI_TRAIN_LOCATION = {
  latitude: 35.5163129,
  longitude: 35.7774778,
  label: 'Tanami Train - مؤسسة تنامي ترين للتدريب و الاستشارات',
  googleMapsUrl: 'https://maps.app.goo.gl/xjzNiYXfGnQmC6yW7',
} as const;

export const TANAMI_TRAIN_EMBED_URL =
  `https://maps.google.com/maps?q=${TANAMI_TRAIN_LOCATION.latitude},${TANAMI_TRAIN_LOCATION.longitude}&z=17&output=embed`;
