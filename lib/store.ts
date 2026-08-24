export type DemoAppointment = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  startsAt: string;
  type: "online" | "clinic";
  status: "confirmed" | "cancelled";
};

declare global {
  // eslint-disable-next-line no-var
  var alumasAppointments: DemoAppointment[] | undefined;
}

export const appointmentStore = global.alumasAppointments ?? [
  {
    id: "apt-demo-1",
    doctorId: "dr-aylin-kaya",
    doctorName: "Dr. Aylin Kaya",
    specialty: "İç Hastalıkları",
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    type: "online",
    status: "confirmed",
  },
];

global.alumasAppointments = appointmentStore;
