import { Share } from 'react-native';
import { TFunction } from 'i18next';
import { Trip } from '@features/trips/domain/models/Trip';
import { formatTime, formatCityName } from './format';
import { DAYS_OF_WEEK } from '../constants';

export const shareTrip = async (trip: Trip, t: TFunction) => {
  const tripUrl = `https://twsila.app/trips/${trip.id}`;
  const daysStr = (trip.schedule_days || [])
    .map((d) => t(`days.${DAYS_OF_WEEK.find((x) => x.value === d)?.key}`))
    .join(', ');

  const tripType = t(trip.is_round_trip ? 'trips.roundTrip' : 'trips.oneWay');

  const shareMessage = t('trips.shareMessage', {
    from: formatCityName(trip.start_address),
    to: formatCityName(trip.end_address),
    time: formatTime(trip.departure_time),
    days: daysStr,
    tripType,
    seats: String(trip.total_seats),
    url: tripUrl,
  });

  try {
    await Share.share({
      message: shareMessage,
      url: tripUrl,
    });
  } catch (error) {
    console.error(error);
  }
};
