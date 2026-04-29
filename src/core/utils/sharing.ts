import { Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { TFunction } from 'i18next';
import { Trip } from '@features/trips/domain/models/Trip';
import { formatTime, formatCityName } from './format';
import { DAYS_OF_WEEK } from '../constants';

export const shareTrip = async (trip: Trip, t: TFunction) => {
  const tripUrl = `https://twsila.app/trips/${trip.id}`;
  const daysStr = (trip.schedule_days || [])
    .map((d) => t(`days.${DAYS_OF_WEEK.find((x) => x.value === d)?.key}`))
    .join(', ');

  const shareMessage = t('trips.shareMessage', {
    from: formatCityName(trip.start_address),
    to: formatCityName(trip.end_address),
    time: formatTime(trip.departure_time),
    days: daysStr,
    url: tripUrl,
  });

  Alert.alert(
    t('trips.shareTrip'),
    t('trips.chooseShareOption'),
    [
      {
        text: t('trips.copyLink'),
        onPress: async () => {
          await Clipboard.setStringAsync(tripUrl);
          Alert.alert(t('common.success'), t('trips.linkCopied'));
        },
      },
      {
        text: t('trips.shareToSocial'),
        onPress: async () => {
          try {
            await Share.share({
              message: shareMessage,
              url: tripUrl,
            });
          } catch (error) {
            console.error(error);
          }
        },
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};
