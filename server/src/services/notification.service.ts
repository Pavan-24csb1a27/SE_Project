export interface AppointmentNotificationData {
  appointmentNumber: string;
  civilianName: string;
  civilianEmail: string;
  civilianPhone?: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  type: 'CONFIRMATION' | 'CANCELLATION' | 'RESCHEDULE';
}

export const sendAppointmentNotification = async (
  data: AppointmentNotificationData
): Promise<{ success: boolean; messageId: string }> => {
  const timestamp = new Date().toISOString();
  const simulatedId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log(`\n======================================================`);
  console.log(`[Notification Service] 🔔 ${data.type} DISPATCHED`);
  console.log(`To: ${data.civilianName} <${data.civilianEmail}>${data.civilianPhone ? ` | SMS: ${data.civilianPhone}` : ''}`);
  console.log(`Appointment Number: ${data.appointmentNumber}`);
  console.log(`Doctor: Dr. ${data.doctorName}`);
  console.log(`Date & Time: ${data.date} at ${data.timeSlot}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Status: Successfully delivered to gateway (ID: ${simulatedId})`);
  console.log(`======================================================\n`);

  return { success: true, messageId: simulatedId };
};
