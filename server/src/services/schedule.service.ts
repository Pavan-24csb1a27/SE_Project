import { ISlot } from '../models/DoctorAvailability.model';

export const generateTimeSlots = (
  date: string,
  startHour: number = 9,
  endHour: number = 17,
  slotDurationMinutes: number = 30
): ISlot[] => {
  const slots: ISlot[] = [];

  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (currentMinutes + slotDurationMinutes <= endMinutes) {
    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const endH = Math.floor((currentMinutes + slotDurationMinutes) / 60);
    const endM = (currentMinutes + slotDurationMinutes) % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startTime = `${pad(startH)}:${pad(startM)}`;
    const endTime = `${pad(endH)}:${pad(endM)}`;
    const slotId = `${date}_${startTime.replace(':', '')}`;

    // Skip lunch break (13:00 - 14:00) by default
    if (!(startH === 13 && startM === 0)) {
      slots.push({
        slotId,
        startTime,
        endTime,
        status: 'available',
      });
    }

    currentMinutes += slotDurationMinutes;
  }

  return slots;
};
