class operatingRoomsClient {
    async cancelOperatingRoomReservation(appointmentId, reason) {
        const response = await fetch(
            `${process.env.Module_6_URL}/turnos/${appointmentId}/cancelacion`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.Module_6_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    motivo: reason,
                    tipo_cancelacion: 'CANCELACION_TURNO',
                    timestamp: new Date().toISOString()
                })
            }
        );

        if (!response.ok) {
            throw new Error(`M6 returned ${response.status}`);
        }

        return response.json();
    }
}

module.exports = { operatingRoomsClient };