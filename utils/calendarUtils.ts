// Função para formatar a data para o padrão UTC exigido pelo .ics (YYYYMMDDTHHMMSSZ)
const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Interface para definir a estrutura de um agendamento
interface Appointment {
    id: string;
    appointment_time: string;
    patient_name: string;
    professional_name?: string; // Opcional, para a agenda do paciente
    // Adicione outros campos se necessário, como um link de reunião
    // meeting_link?: string; 
}

export const generateICSContent = (appointment: Appointment): string => {
    const startTime = new Date(appointment.appointment_time);
    // Assumindo que a sessão tem 50 minutos de duração
    const endTime = new Date(startTime.getTime() + 50 * 60000); 

    // Conteúdo do arquivo .ics
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IntegrandoSer//Plataforma//PT
BEGIN:VEVENT
UID:${appointment.id}@integrandoser.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startTime)}
DTEND:${formatDateForICS(endTime)}
SUMMARY:Sessão: ${appointment.professional_name || 'Terapia'} com ${appointment.patient_name}
DESCRIPTION:Sessão de terapia agendada através da plataforma IntegrandoSer.
END:VEVENT
END:VCALENDAR`;

    return icsContent;
};